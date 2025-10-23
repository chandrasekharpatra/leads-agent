import { Hono } from 'hono';
import { LeadGenService } from '../services/lead_gen_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	return c.json({ message: 'Login endpoint' });
});

app.post('/search', async (c) => {
	const { pincode } = await c.req.json();
	const service = c.var.resolve('LeadGenService') as LeadGenService;
	const result = await service.generateLead(pincode);
	return c.json({ result });
});

export default app;
