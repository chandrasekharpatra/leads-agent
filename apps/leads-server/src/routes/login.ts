import { Hono } from 'hono';
import { LeadService } from '../services/lead_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	return c.json({ message: 'Login endpoint' });
});

app.post('/search', async (c) => {
	return c.json({ message: 'Search endpoint' });
});

export default app;
