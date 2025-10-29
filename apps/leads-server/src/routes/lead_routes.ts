import { Hono } from 'hono';
import { verifyJwt } from '../auth/auth';
import { LeadService } from '../services/lead_service';

const app = new Hono<{ Bindings: Env }>();

app.get('/', verifyJwt(), async (c) => {
	const pincode = c.req.query('pincode') || '';
	if (pincode === '') {
		return c.json({ leads: [] });
	}
	const leadService = c.var.resolve('LeadService') as LeadService;
	const leads = await leadService.fetchLeads(pincode);
	return c.json({ leads });
});

export default app;
