import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	const { JWT_SECRET } = c.env;
	// Your login logic here, using JWT_SECRET as needed
	return c.json({ message: 'Login endpoint' });
});

export default app;
