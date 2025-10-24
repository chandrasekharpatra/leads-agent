import { Hono } from 'hono';
import { LeadService } from '../services/lead_service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
	const { pincode }: { pincode: string } = await c.req.json();
	const leadService = c.var.resolve('LeadService') as LeadService;
	const leads = await leadService.fetchLeads(pincode);
	return c.json({ leads });
});

export default app;
