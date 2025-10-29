import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { inject, singleton } from 'tsyringe-neo';
import { workflow_d1_schema } from '../drizzle/workflow_schema';
import { Workflow } from './stored/stored_workflow';

interface WorkflowStore {
	createWorkflow(workflow: Workflow): Promise<void>;
	getWorkflowById(workflowId: string): Promise<Workflow | null>;
	getWorkflowByIds(workflowIds: string[]): Promise<Map<string, Workflow>>;
	updateWorkflow(workflow: Workflow): Promise<void>;
	deleteWorkflow(workflowId: string): Promise<void>;
}

@singleton()
class D1WorkflowStore implements WorkflowStore {
	constructor(@inject('DB') private db: D1Database) {}

	async createWorkflow(workflow: Workflow): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.insert(workflow_d1_schema)
			.values({
				workflow_id: workflow.workflowId,
				data: JSON.stringify(workflow.data),
				created_at: date,
				updated_at: date,
			})
			.execute();
	}

	async getWorkflowById(workflowId: string): Promise<Workflow | null> {
		const db = drizzle(this.db);
		const results = await db.select().from(workflow_d1_schema).where(eq(workflow_d1_schema.workflow_id, workflowId)).execute();
		if (results.length === 0) {
			return null;
		}
		const result = results[0];
		return {
			workflowId: result.workflow_id,
			data: JSON.parse(result.data as string),
			createdAt: result.created_at ? new Date(result.created_at).getTime() : 0,
			updatedAt: result.updated_at ? new Date(result.updated_at).getTime() : 0,
		};
	}

	async getWorkflowByIds(workflowIds: string[]): Promise<Map<string, Workflow>> {
		const db = drizzle(this.db);
		const results = await db.select().from(workflow_d1_schema).where(inArray(workflow_d1_schema.workflow_id, workflowIds)).execute();
		const workflowMap: Map<string, Workflow> = new Map();
		for (const result of results) {
			const workflow: Workflow = {
				workflowId: result.workflow_id,
				data: JSON.parse(result.data as string),
				createdAt: result.created_at ? new Date(result.created_at).getTime() : 0,
				updatedAt: result.updated_at ? new Date(result.updated_at).getTime() : 0,
			};
			workflowMap.set(workflow.workflowId, workflow);
		}
		return workflowMap;
	}

	async updateWorkflow(workflow: Workflow): Promise<void> {
		const db = drizzle(this.db);
		const date = new Date();
		await db
			.update(workflow_d1_schema)
			.set({
				data: JSON.stringify(workflow.data),
				updated_at: date,
			})
			.where(eq(workflow_d1_schema.workflow_id, workflow.workflowId))
			.execute();
	}

	async deleteWorkflow(workflowId: string): Promise<void> {
		const db = drizzle(this.db);
		await db.delete(workflow_d1_schema).where(eq(workflow_d1_schema.workflow_id, workflowId)).execute();
	}
}

export { D1WorkflowStore, type WorkflowStore };
