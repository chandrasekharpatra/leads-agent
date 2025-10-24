import { inject, singleton } from 'tsyringe-neo';
import { Task } from '../storage/stored/stored_task';
import { D1TaskStore } from '../storage/task_store';
import { D1WorkflowTaskMappingStore } from '../storage/workflow_task_mapping_store';

interface TaskService {
	fetchByWorkflowId(workflowId: string): Promise<Task[]>;
}

@singleton()
class TaskServiceImpl implements TaskService {
	constructor(
		@inject('TaskStore') private taskStore: D1TaskStore,
		@inject('WorkflowTaskMappingStore') private workflowTaskMappingStore: D1WorkflowTaskMappingStore,
	) {}

	async fetchByWorkflowId(workflowId: string): Promise<Task[]> {
		const mappingsResponse = await this.workflowTaskMappingStore.sync(workflowId, { direction: 'FORWARD', limit: 200 });
		const tasks: Task[] = [];
		for (const mapping of mappingsResponse.data) {
			const task = await this.taskStore.getTaskById(mapping.taskId);
			if (task) {
				tasks.push(task);
			}
		}
		const promises = mappingsResponse.data.map(async (mapping) => {
			const task = await this.taskStore.getTaskById(mapping.taskId);
			return task ? task : null;
		});
		const results = await Promise.all(promises);
		return results.filter((task) => task !== null) as Task[];
	}
}

export { TaskServiceImpl, type TaskService };
