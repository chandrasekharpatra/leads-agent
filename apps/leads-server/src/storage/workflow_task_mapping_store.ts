import { and, desc, eq, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { workflow_task_mapping_d1_schema } from '../drizzle/workflow_schema';
import { PaginatedResponse, SyncRequest } from '../models/io';
import { WorkflowState, WorkflowTaskMapping } from './stored/stored_workflow';

interface WorkflowTaskMappingStore {
	createMapping(mapping: WorkflowTaskMapping): Promise<void>;
	deleteMapping(workflowId: string, taskId: string): Promise<void>;
	sync(workflowId: string, request: SyncRequest): Promise<PaginatedResponse<WorkflowTaskMapping>>;
	getMapping(workflowId: string, taskId: string): Promise<WorkflowTaskMapping | null>;
	ensureMapping(workflowId: string, taskId: string): Promise<void>;
}

@singleton()
class D1WorkflowTaskMappingStore implements WorkflowTaskMappingStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createMapping(mapping: WorkflowTaskMapping): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(workflow_task_mapping_d1_schema)
			.values({
				workflow_id: mapping.workflowId,
				task_id: mapping.taskId,
                state: mapping.state,
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async deleteMapping(workflowId: string, taskId: string): Promise<void> {
		const db = drizzle(this.db);
		await db
			.delete(workflow_task_mapping_d1_schema)
			.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId), eq(workflow_task_mapping_d1_schema.task_id, taskId)))
			.execute();
	}

	async sync(
		workflowId: string,
		{ pointer: incomingPointer, direction, limit }: SyncRequest,
	): Promise<PaginatedResponse<WorkflowTaskMapping>> {
		const db = drizzle(this.db);
		let pointer: CompositePointer;
		if (!incomingPointer) {
			pointer = {
				latest: undefined,
				earliest: undefined,
			};
		} else {
			pointer = JSON.parse(atob(incomingPointer)) as CompositePointer;
		}

		if (!pointer.earliest && !pointer.latest) {
			// Initial sync, fetch latest records
			const results = await db
				.select()
				.from(workflow_task_mapping_d1_schema)
				.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId)))
				.limit(limit)
				.orderBy(desc(workflow_task_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				workflowId: result.workflow_id,
				taskId: result.task_id,
                state: result.state as WorkflowState,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const latest = results[0];
				const latestCursor: Cursor = {
					id: latest.id,
				};
				const earliest = results[results.length - 1];
				const earliestCursor: Cursor = {
					id: earliest.id,
				};
				nextPointer = {
					latest: btoa(JSON.stringify(latestCursor)),
					earliest: btoa(JSON.stringify(earliestCursor)),
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		} else if (direction === 'FORWARD' && pointer.latest) {
			const cursor: Cursor = JSON.parse(atob(pointer.latest));
			const results = await db
				.select()
				.from(workflow_task_mapping_d1_schema)
				.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId), gt(workflow_task_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(workflow_task_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				workflowId: result.workflow_id,
				taskId: result.task_id,
                state: result.state as WorkflowState,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const result = results[0];
				const newCursor: Cursor = {
					id: result.id,
				};
				nextPointer = {
					latest: btoa(JSON.stringify(newCursor)),
					earliest: pointer.earliest ? pointer.earliest : undefined,
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		} else if (direction === 'BACKWARD' && pointer.earliest) {
			const cursor: Cursor = JSON.parse(atob(pointer.earliest));
			const results = await db
				.select()
				.from(workflow_task_mapping_d1_schema)
				.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId), lt(workflow_task_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(workflow_task_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				workflowId: result.workflow_id,
				taskId: result.task_id,
                state: result.state as WorkflowState,
				createdAt: result.created_at ? result.created_at.getTime() : 0,
				updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
			}));
			let nextPointer: CompositePointer | undefined = undefined;
			if (mappings.length > 0) {
				const result = results[results.length - 1];
				const newCursor: Cursor = {
					id: result.id,
				};
				nextPointer = {
					earliest: btoa(JSON.stringify(newCursor)),
					latest: pointer.latest ? pointer.latest : undefined,
				};
			}
			return {
				data: mappings,
				total: mappings.length,
				cursor: nextPointer ? btoa(JSON.stringify(nextPointer)) : incomingPointer,
			};
		}
		throw new Error('Invalid pointer or direction');
	}

	async getMapping(workflowId: string, taskId: string): Promise<WorkflowTaskMapping | null> {
		const db = drizzle(this.db);
		const results = await db
			.select()
			.from(workflow_task_mapping_d1_schema)
			.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId), eq(workflow_task_mapping_d1_schema.task_id, taskId)))
			.execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			workflowId: result.workflow_id,
			taskId: result.task_id,
            state: result.state as WorkflowState,
			createdAt: result.created_at ? result.created_at.getTime() : 0,
			updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
		};
	}

	async ensureMapping(workflowId: string, taskId: string): Promise<void> {
		const db = drizzle(this.db);
		const existingMapping = await db
			.select()
			.from(workflow_task_mapping_d1_schema)
			.where(and(eq(workflow_task_mapping_d1_schema.workflow_id, workflowId), eq(workflow_task_mapping_d1_schema.task_id, taskId)))
			.execute();
		if (existingMapping.length > 0) {
			return;
		}
		await this.createMapping({
			workflowId,
			taskId,
            state: 'PENDING',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	}
}

interface CompositePointer {
	latest?: string;
	earliest?: string;
}

interface Cursor {
	id: number;
}

export { D1WorkflowTaskMappingStore, type WorkflowTaskMappingStore };
