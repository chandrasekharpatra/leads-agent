import { Hono } from 'hono';
import 'reflect-metadata';
import 'tslib';
import { tsyringe } from './middleware/tysringe_middleware';

import { login } from './routes';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
	const middleware = tsyringe((container) => {});
	return middleware(c, next);
});

app.route('/v1/login', login);

export default app;
