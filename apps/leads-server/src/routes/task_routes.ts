import { Hono } from 'hono';
import { TaskService } from '../services/task_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	const { workflowId }: { workflowId: string } = await c.req.json();
	const taskService = c.var.resolve('TaskService') as TaskService;
	const tasks = await taskService.fetchByWorkflowId(workflowId);
	return c.json({ tasks });
});

export default app;
