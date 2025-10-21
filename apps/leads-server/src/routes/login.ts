import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	return c.json({ message: 'Login endpoint' });
});

export default app;
