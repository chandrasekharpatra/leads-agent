import { and, desc, eq, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { user_workflow_mapping_d1_schema } from '../drizzle/user_schema';
import { PaginatedResponse, SyncRequest } from '../models/io';
import { UserWorkflowMapping } from './stored/stored_user';

interface UserWorkflowMappingStore {
	createMapping(mapping: UserWorkflowMapping): Promise<void>;
	deleteMapping(userId: string, workflowId: string): Promise<void>;
	sync(userId: string, request: SyncRequest): Promise<PaginatedResponse<UserWorkflowMapping>>;
	getMapping(userId: string, workflowId: string): Promise<UserWorkflowMapping | null>;
	ensureMapping(userId: string, workflowId: string): Promise<void>;
}

@singleton()
class D1UserWorkflowMappingStore implements UserWorkflowMappingStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createMapping(mapping: UserWorkflowMapping): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(user_workflow_mapping_d1_schema)
			.values({
				user_id: mapping.userId,
				workflow_id: mapping.workflowId,
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async deleteMapping(userId: string, workflowId: string): Promise<void> {
		const db = drizzle(this.db);
		await db
			.delete(user_workflow_mapping_d1_schema)
			.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId), eq(user_workflow_mapping_d1_schema.workflow_id, workflowId)))
			.execute();
	}

	async sync(userId: string, { pointer: incomingPointer, direction, limit }: SyncRequest): Promise<PaginatedResponse<UserWorkflowMapping>> {
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
				.from(user_workflow_mapping_d1_schema)
				.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId)))
				.limit(limit)
				.orderBy(desc(user_workflow_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				id: result.id,
				userId: result.user_id,
				workflowId: result.workflow_id,
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
				.from(user_workflow_mapping_d1_schema)
				.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId), gt(user_workflow_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(user_workflow_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				id: result.id,
				userId: result.user_id,
				workflowId: result.workflow_id,
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
				.from(user_workflow_mapping_d1_schema)
				.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId), lt(user_workflow_mapping_d1_schema.id, cursor.id)))
				.limit(limit)
				.orderBy(desc(user_workflow_mapping_d1_schema.id))
				.execute();
			const mappings = results.map((result) => ({
				id: result.id,
				userId: result.user_id,
				workflowId: result.workflow_id,
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

	async getMapping(userId: string, workflowId: string): Promise<UserWorkflowMapping | null> {
		const db = drizzle(this.db);
		const results = await db
			.select()
			.from(user_workflow_mapping_d1_schema)
			.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId), eq(user_workflow_mapping_d1_schema.workflow_id, workflowId)))
			.execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			userId: result.user_id,
			workflowId: result.workflow_id,
			createdAt: result.created_at ? result.created_at.getTime() : 0,
			updatedAt: result.updated_at ? result.updated_at.getTime() : 0,
		};
	}

	async ensureMapping(userId: string, workflowId: string): Promise<void> {
		const db = drizzle(this.db);
		const existingMapping = await db
			.select()
			.from(user_workflow_mapping_d1_schema)
			.where(and(eq(user_workflow_mapping_d1_schema.user_id, userId), eq(user_workflow_mapping_d1_schema.workflow_id, workflowId)))
			.execute();
		if (existingMapping.length > 0) {
			return;
		}
		await this.createMapping({
			userId,
			workflowId,
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

export { D1UserWorkflowMappingStore, type UserWorkflowMappingStore };
