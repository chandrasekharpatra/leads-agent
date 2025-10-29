import { Task, TaskData } from '../storage/stored/stored_task';

interface TechPark {
	name: string;
	address: string;
}

interface Company {
	name: string;
	industry: string;
	employeeCount: number;
	address: string;
}

interface ToastmasterClubDetail {
	hasClub: boolean;
	url?: string;
}

interface Profile {
	name: string;
	linkedInUrl?: string;
}

interface RequestContext {
	userId: string;
}

interface WorkflowContext {
	workflowId: string;
	currentTask: Task;
	completedTasks: TaskData[];
}

interface TaskExecutionContext {
	workflowId: string;
	task: Task;
}

interface TaskResult {
	nextTasks: TaskData[];
}

export {
	type Company,
	type Profile,
	type RequestContext,
	type TechPark,
	type ToastmasterClubDetail,
	type Task,
	type WorkflowContext,
	type TaskResult,
	type TaskExecutionContext,
};
