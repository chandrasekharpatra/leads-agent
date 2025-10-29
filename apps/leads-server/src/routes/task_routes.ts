import { Hono } from 'hono';
import { verifyJwt } from '../auth/auth';
import { TaskService } from '../services/task_service';

const app = new Hono<{ Bindings: Env }>();

app.get('/', verifyJwt(), async (c) => {
	const workflowId = c.req.query('workflowId') || '';
	if (workflowId === '') {
		return c.json({ tasks: [] });
	}
	const taskService = c.var.resolve('TaskService') as TaskService;
	const tasks = await taskService.fetchByWorkflowId(workflowId);
	return c.json({ tasks });
});

export default app;
