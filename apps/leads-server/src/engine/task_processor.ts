import { RequestContext, TaskExecutionContext, TaskResult } from '../models/internal';
import { TaskData } from '../storage/stored/stored_task';

interface TaskProcessor {
	canHandle(taskType: string): boolean;
	process(ctx: RequestContext, task: TaskData, context: TaskExecutionContext): Promise<TaskResult>;
}

export { type TaskProcessor };
