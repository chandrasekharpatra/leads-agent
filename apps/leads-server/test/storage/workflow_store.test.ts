import { container } from 'tsyringe-neo';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Workflow } from '../../src/storage/stored/stored_workflow';
import { WorkflowStore } from '../../src/storage/workflow_store';
import { workflowIdGenerator } from '../../src/utils/id_utils';
import { initTsyringe } from '../tsyringe';

describe('Workflow store CRUD tests', () => {
	beforeAll(() => {
		initTsyringe();
	});

	afterAll(() => {
		container.clearInstances();
		container.reset();
	});

	it('workflow crud operations', async () => {
		const workflowStore = container.resolve<WorkflowStore>('WorkflowStore');

		const workflow: Workflow = {
			workflowId: workflowIdGenerator(),
			data: {
				state: 'PENDING',
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};

		await workflowStore.createWorkflow(workflow);

		const fetchedWorkflow = await workflowStore.getWorkflowById(workflow.workflowId);
		expect(fetchedWorkflow).toBeDefined();
		expect(fetchedWorkflow?.data.state).toBe('PENDING');

		await workflowStore.updateWorkflow({
			...workflow,
			data: {
				state: 'IN_PROGRESS',
			},
		});

		const updatedWorkflow = await workflowStore.getWorkflowById(workflow.workflowId);
		expect(updatedWorkflow).toBeDefined();
		expect(updatedWorkflow?.data.state).toBe('IN_PROGRESS');

		await workflowStore.deleteWorkflow(workflow.workflowId);
		const deletedWorkflow = await workflowStore.getWorkflowById(workflow.workflowId);
		expect(deletedWorkflow).toBeNull();
	});
});
