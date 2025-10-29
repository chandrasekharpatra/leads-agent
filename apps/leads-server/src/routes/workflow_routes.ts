import { Hono } from 'hono';
import { WorkflowService } from '../services/workflow_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	const { pincode }: { pincode: string } = await c.req.json();
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	const workflow = await workflowService.init({ userId: 'anonymous' }, pincode);
	c.executionCtx.waitUntil(workflowService.resume({ userId: 'anonymous' }, workflow.workflowId));
	return c.json({ workflowId: workflow.workflowId });
});

app.post('/:workflowId/resume', async (c) => {
	const workflowId = c.req.param('workflowId');
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	c.executionCtx.waitUntil(workflowService.resume({ userId: 'anonymous' }, workflowId as string));
	return c.json({ status: 'resumed' });
});

export default app;
