import { MiddlewareHandler } from 'hono';
import { jwt } from 'hono/jwt';

export const verifyJwt = (): MiddlewareHandler => (c, next) => {
	const jwtMiddleware = jwt({
		secret: c.env.JWT_SECRET,
	});
	return jwtMiddleware(c, next);
};
