import { inject, singleton } from 'tsyringe-neo';
import { RequestContext, TaskExecutionContext } from '../models/internal';
import { type QueueService } from '../services/queue_service';
import { Task, TaskData } from '../storage/stored/stored_task';
import { Workflow } from '../storage/stored/stored_workflow';
import { type TaskStore } from '../storage/task_store';
import { type WorkflowStore } from '../storage/workflow_store';
import { type WorkflowTaskMappingStore } from '../storage/workflow_task_mapping_store';
import { taskIdGenerator } from '../utils/id_utils';
import { CompanyTaskProcessor } from './company_task_processor';
import { HiringManagerTaskProcessor } from './hiring_manager_task_processor';
import { PincodeTaskProcessor } from './pincode_task_processor';
import { TaskCompletedProcessor } from './task_completed_processor';
import { TaskProcessor } from './task_processor';
import { TechparkTaskProcessor } from './techpark_task_processor';
import { TerminalTaskProcessor } from './terminal_task_processor';
import { ToastmasterClubTaskProcessor } from './toastmaster_club_task_processor';

@singleton()
class WorkflowEngine {
	private processors: TaskProcessor[] = [];

	constructor(
		@inject('WorkflowStore') private readonly workflowStore: WorkflowStore,
		@inject('WorkflowTaskMappingStore') private readonly workflowTaskMappingStore: WorkflowTaskMappingStore,
		@inject('TaskStore') private readonly taskStore: TaskStore,
		@inject(PincodeTaskProcessor) private pincodeProcessor: PincodeTaskProcessor,
		@inject(TechparkTaskProcessor) private techparkProcessor: TechparkTaskProcessor,
		@inject(CompanyTaskProcessor) private companyProcessor: CompanyTaskProcessor,
		@inject(TaskCompletedProcessor) private taskCompletedProcessor: TaskCompletedProcessor,
		@inject(TerminalTaskProcessor) private terminalProcessor: TerminalTaskProcessor,
		@inject(ToastmasterClubTaskProcessor) private toastmasterClubProcessor: ToastmasterClubTaskProcessor,
		@inject(HiringManagerTaskProcessor) private hiringManagerProcessor: HiringManagerTaskProcessor,
		@inject('QueueService') private readonly queueService: QueueService,
	) {
		this.registerProcessor(this.pincodeProcessor);
		this.registerProcessor(this.techparkProcessor);
		this.registerProcessor(this.companyProcessor);
		this.registerProcessor(this.taskCompletedProcessor);
		this.registerProcessor(this.terminalProcessor);
		this.registerProcessor(this.toastmasterClubProcessor);
		this.registerProcessor(this.hiringManagerProcessor);
	}

	private registerProcessor(processor: TaskProcessor): void {
		this.processors.push(processor);
	}

	async execute(ctx: RequestContext, workflowId: string): Promise<void> {

		console.log(`Starting workflow execution for workflow ID ${workflowId}`);

		const workflow = await this.workflowStore.getWorkflowById(workflowId);
		if (!workflow) {
			console.error(`Workflow with ID ${workflowId} not found`);
			return;
		}

		workflow.data.state = 'IN_PROGRESS';
		await this.workflowStore.updateWorkflow(workflow);

		try {
			const hasMoreTasks = await this.processNextTask(ctx, workflow);
			if (hasMoreTasks) {
				await this.queueService.enqueueWorkflowExecution(workflowId);
			} else {
				console.log(`Workflow ${workflowId} execution completed`);
			}
		} catch (error) {
			console.error(`Error during workflow ${workflowId} execution:`, error);
			if (workflow.data.failedCount && workflow.data.failedCount > 10) {
					// Handle failed workflows
					console.error(`Workflow ${workflowId} has failed ${workflow.data.failedCount} times not retrying further.`);
				} else {
					workflow.data.failedCount = (workflow.data.failedCount || 0) + 1;
					await this.workflowStore.updateWorkflow(workflow);
					await this.queueService.enqueueWorkflowExecution(workflowId);
				}
		}
	}

	private async processNextTask(ctx: RequestContext, workflow: Workflow): Promise<boolean> {
		const { workflowId } = workflow;
		if (workflow.data.state === 'COMPLETED') {
			console.log(`Workflow ${workflowId} already completed`);
			return false;
		}

		// Get next task using pagination
		const syncResponse = await this.workflowTaskMappingStore.sync(workflowId, {
			direction: 'FORWARD',
			limit: 1,
			pointer: workflow.data.pointer,
		});

		if (syncResponse.data.length === 0) {
			// No more tasks - mark workflow as completed
			workflow.data.state = 'COMPLETED';
			workflow.data.pointer = syncResponse.cursor;
			console.log(`No more tasks to process. Marking workflow ${workflow.workflowId} as COMPLETED`);
			await this.workflowStore.updateWorkflow(workflow);
			return false;
		}

		// Get the task to process
		const mapping = syncResponse.data[0];
		const task = await this.taskStore.getTaskById(mapping.taskId);

		if (!task) {
			console.error(`Task with ID ${mapping.taskId} not found, skipping`);
			return true;
		}

		if (task.data.next.length === 0) {
			console.log(`Task ${task.taskId} has no next tasks, continuing`);
			return true;
		}

		const nextTaskData = task.data.next[0];
		console.log(`Processing task ${task.taskId} with next task type: ${nextTaskData.type}`);

		const processor = this.findProcessor(nextTaskData.type);
		if (!processor) {
			console.warn(`No processor found for task type: ${nextTaskData.type}`);
			return true;
		}

		const taskExecutionContext: TaskExecutionContext = {
			workflowId,
			task,
		};

		try {
			const result = await processor.process(ctx, nextTaskData, taskExecutionContext);
			if (result.nextTasks.length > 0) {
				await this.createFollowUpTasks(task, nextTaskData, result.nextTasks, workflowId);
			}
			// Update workflow pointer
			workflow.data.pointer = syncResponse.cursor;
			await this.workflowStore.updateWorkflow(workflow);
			return true;
		} catch (error) {
			console.error(`Error processing task ${task.taskId}:`, error);
			return true; // Continue processing other tasks
		}
	}

	private findProcessor(taskType: string): TaskProcessor | undefined {
		return this.processors.find((processor) => processor.canHandle(taskType));
	}

	private async createFollowUpTasks(
		parentTask: Task,
		processedTaskData: TaskData,
		nextTasks: TaskData[],
		workflowId: string,
	): Promise<void> {
		const promises = nextTasks.map(async (nextTaskData) => {
			const newTask: Task = {
				taskId: taskIdGenerator(),
				data: {
					completed: [...parentTask.data.completed, processedTaskData],
					next: [nextTaskData],
				},
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			await this.taskStore.createTask(newTask);
			await this.workflowTaskMappingStore.ensureMapping(workflowId, newTask.taskId);
		});

		await Promise.all(promises);
		console.log(`Created ${nextTasks.length} follow-up tasks for workflow ${workflowId}`);
	}
}

export { WorkflowEngine };
