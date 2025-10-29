import { Hono } from 'hono';
import { verifyJwt } from '../auth/auth';
import { schemaValidator, tokenValidationRequest } from '../io_schema';

const app = new Hono<{ Bindings: Env }>();

app.post('/', verifyJwt(), schemaValidator(tokenValidationRequest), async (c) => {
	return c.json({ success: true });
});

export default app;
