import { inject, singleton } from 'tsyringe-neo';
import { WorkflowEngine } from '../engine/workflow_engine';
import { RequestContext } from '../models/internal';
import { PaginatedResponse, SyncRequest } from '../models/io';
import { Task, TaskData } from '../storage/stored/stored_task';
import { Workflow, WorkflowData } from '../storage/stored/stored_workflow';
import { type TaskStore } from '../storage/task_store';
import { type UserWorkflowMappingStore } from '../storage/user_workflow_mapping_store';
import { type WorkflowStore } from '../storage/workflow_store';
import { type WorkflowTaskMappingStore } from '../storage/workflow_task_mapping_store';
import { taskIdGenerator, workflowIdGenerator } from '../utils/id_utils';

interface WorkflowService {
	startWorkflow(ctx: RequestContext, data: WorkflowData): Promise<Workflow>;
	init(ctx: RequestContext, pincode: string): Promise<Workflow>;
	resume(ctx: RequestContext, workflowId: string): Promise<void>;
	fetchWorkflow(ctx: RequestContext, workflowId: string): Promise<Workflow | null>;
	syncWorkflows(ctx: RequestContext, request: SyncRequest): Promise<PaginatedResponse<Workflow>>;
}

@singleton()
class WorkflowServiceImpl implements WorkflowService {
	constructor(
		@inject('WorkflowStore') private readonly workflowStore: WorkflowStore,
		@inject('TaskStore') private readonly taskStore: TaskStore,
		@inject('UserWorkflowMappingStore') private readonly userWorkflowMappingStore: UserWorkflowMappingStore,
		@inject('WorkflowTaskMappingStore') private readonly workflowTaskMappingStore: WorkflowTaskMappingStore,
		@inject(WorkflowEngine) private readonly workflowEngine: WorkflowEngine,
	) {}

	async startWorkflow(ctx: RequestContext, data: WorkflowData): Promise<Workflow> {
		const workflow: Workflow = {
			workflowId: workflowIdGenerator(),
			data,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		await this.workflowStore.createWorkflow(workflow);
		await this.userWorkflowMappingStore.createMapping({
			userId: ctx.userId,
			workflowId: workflow.workflowId,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return workflow;
	}

	async init(ctx: RequestContext, pincode: string): Promise<Workflow> {
		const workflow = await this.startWorkflow(ctx, { state: 'PENDING', pincode });
		const pincodeTaskData: TaskData = {
			type: 'PINCODE',
			pincode,
		};

		const rootTask: Task = {
			taskId: taskIdGenerator(),
			data: {
				completed: [],
				next: [pincodeTaskData],
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		await this.taskStore.createTask(rootTask);
		await this.workflowTaskMappingStore.ensureMapping(workflow.workflowId, rootTask.taskId);
		return workflow;
	}

	async resume(ctx: RequestContext, workflowId: string): Promise<void> {
		await this.workflowEngine.execute(ctx, workflowId);
	}

	async fetchWorkflow(ctx: RequestContext, workflowId: string): Promise<Workflow | null> {
		const mapping = await this.userWorkflowMappingStore.getMapping(ctx.userId, workflowId);
		if (!mapping) {
			return null;
		}
		return await this.workflowStore.getWorkflowById(workflowId);
	}

	async syncWorkflows(ctx: RequestContext, request: SyncRequest): Promise<PaginatedResponse<Workflow>> {
		return this.userWorkflowMappingStore.sync(ctx.userId, request).then(async (paginatedMappings) => {
			const workflows: Workflow[] = [];
			const workflowIds = paginatedMappings.data.map((mapping) => mapping.workflowId);
			const workflowMap = await this.workflowStore.getWorkflowByIds(workflowIds);
			for (const mapping of paginatedMappings.data) {
				const workflow = workflowMap.get(mapping.workflowId);
				if (workflow) {
					workflows.push(workflow);
				}
			}
			return {
				...paginatedMappings,
				data: workflows,
			};
		});
	}
}

export { WorkflowServiceImpl, type WorkflowService };
