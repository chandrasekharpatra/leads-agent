import { Hono } from 'hono';
import { verifyJwt } from '../auth/auth';
import { JwtPayload } from '../models/internal';

const app = new Hono<{ Bindings: Env }>();

app.post('/', verifyJwt(), async (c) => {
	const { sub } = c.get('jwtPayload') as JwtPayload;
	return c.json({ userId: sub });
});

export default app;
