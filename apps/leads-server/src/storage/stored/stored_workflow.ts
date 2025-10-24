type WorkflowState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

interface WorkflowData {
	state: WorkflowState;
	pointer?: string;
}

interface Workflow {
	workflowId: string;
	data: WorkflowData;
	createdAt: number;
	updatedAt: number;
}

interface WorkflowTaskMapping {
	workflowId: string;
	taskId: string;
	state: WorkflowState;
	createdAt: number;
	updatedAt: number;
}

export { type Workflow, type WorkflowData, type WorkflowState, type WorkflowTaskMapping };
