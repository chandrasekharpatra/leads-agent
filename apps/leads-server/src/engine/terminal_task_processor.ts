import { singleton } from 'tsyringe-neo';
import { RequestContext, TaskResult } from '../models/internal';
import { TaskData } from '../storage/stored/stored_task';
import { TaskProcessor } from './task_processor';

@singleton()
export class TerminalTaskProcessor implements TaskProcessor {
	canHandle(taskType: string): boolean {
		return taskType === 'NOOP';
	}

	async process(_ctx: RequestContext, task: TaskData): Promise<TaskResult> {
		console.log(`Processing terminal task of type: ${task.type}`);

		return {
			nextTasks: [],
		};
	}
}
