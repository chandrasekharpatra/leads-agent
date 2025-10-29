import { inject, singleton } from 'tsyringe-neo';
import { RequestContext, TaskExecutionContext, TaskResult } from '../models/internal';
import { type LeadService } from '../services/lead_service';
import { TaskData } from '../storage/stored/stored_task';
import { TaskProcessor } from './task_processor';

@singleton()
class HiringManagerTaskProcessor implements TaskProcessor {
	constructor(@inject('LeadService') private readonly leadService: LeadService) {}

	canHandle(taskType: string): boolean {
		return taskType === 'HIRING_MANAGER';
	}

	async process(_ctx: RequestContext, task: TaskData, context: TaskExecutionContext): Promise<TaskResult> {
		const { workflowId } = context;
		console.log(`Processing HIRING_MANAGER task for workflow ${workflowId}`);
		return {
			nextTasks: [
				{
					type: 'TASK_COMPLETED' as const,
				},
			],
		};
	}
}

export { HiringManagerTaskProcessor };
