import { inject, singleton } from 'tsyringe-neo';
import { WorkflowEngine } from '../engine/workflow_engine';
import { RequestContext } from '../models/internal';
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
		const workflow = await this.startWorkflow(ctx, { state: 'PENDING' });
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
}

export { WorkflowServiceImpl, type WorkflowService };
