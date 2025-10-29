import { Hono } from 'hono';
import { z } from 'zod/v4';
import { verifyJwt } from '../auth/auth';
import { createWorkflowRequest, resumeWorkflowRequest, schemaValidator, syncWorkflowRequest } from '../io_schema';
import { JwtPayload } from '../models/internal';
import { WorkflowService } from '../services/workflow_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', verifyJwt(), schemaValidator(createWorkflowRequest), async (c) => {
	const { pincode } = c.req.valid('json') as z.infer<typeof createWorkflowRequest>;
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	const jwtPayload = c.get('jwtPayload') as JwtPayload;
	const workflow = await workflowService.init({ userId: jwtPayload.sub }, pincode);
	c.executionCtx.waitUntil(workflowService.resume({ userId: jwtPayload.sub }, workflow.workflowId));
	return c.json({ workflowId: workflow.workflowId });
});

app.post('/:workflowId/resume', verifyJwt(), schemaValidator(resumeWorkflowRequest), async (c) => {
	const { workflowId } = c.req.valid('json') as z.infer<typeof resumeWorkflowRequest>;
	const jwtPayload = c.get('jwtPayload') as JwtPayload;
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	c.executionCtx.waitUntil(workflowService.resume({ userId: jwtPayload.sub }, workflowId as string));
	return c.json({ status: 'resumed' });
});

app.get('/:workflowId', verifyJwt(), async (c) => {
	const workflowId = c.req.param('workflowId') as string;
	const jwtPayload = c.get('jwtPayload') as JwtPayload;
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	const workflow = await workflowService.fetchWorkflow({ userId: jwtPayload.sub }, workflowId as string);
	if (!workflow) {
		return c.json({ error: 'Workflow not found' }, 404);
	}
	return c.json(workflow);
});

app.post('/sync', verifyJwt(), schemaValidator(syncWorkflowRequest), async (c) => {
	const { pointer, direction } = c.req.valid('json') as z.infer<typeof syncWorkflowRequest>;
	const jwtPayload = c.get('jwtPayload') as JwtPayload;
	const workflowService = c.var.resolve('WorkflowService') as WorkflowService;
	const result = await workflowService.syncWorkflows({ userId: jwtPayload.sub }, { pointer, direction, limit: 10 });
	return c.json(result);
});

export default app;
