import type { H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
    const { request, env } = event.context.cloudflare;
    const { url } = request;
    const method = getMethod(event);
    const path = url.replace("proxy", '');
    const session = await requireUserSession(event);
    
    const body = method !== 'GET' && method !== 'HEAD' ? JSON.stringify(await readBody(event)) : undefined;
    const requestOptions = {
        method: method,
        headers: {
            ...Object.fromEntries(request.headers.entries().filter(([key]) => key.toLowerCase() !== 'cookie')),
            'content-type': request.headers.get('content-type') || 'application/json',
            ...( session.secure?.token ? { 'Authorization': `Bearer ${session.secure.token}` } : {})
        },
        body: body
    };
    const resp = await env.LEADS_SERVER.fetch(path, requestOptions);
    const data = await resp.arrayBuffer();
    event.node.res.statusCode = resp.status;
    resp.headers.forEach((value, key) => {
        event.node.res.setHeader(key, value);
    });
    event.node.res.end(Buffer.from(data));
});
