import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const loginRequest: { token: string } = await readBody(event);
  const { env } = event.context.cloudflare;
  console.log("env", env);
  const response = await env.LEADS_SERVER.fetch(
    "https://leads.example.com/v1/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${loginRequest.token}`,
      },
      body: JSON.stringify(loginRequest),
    },
  );
  if (!response.ok) {
    console.log("Login failed", response.status, await response.text());
    throw createError({
      status: response.status,
      statusMessage: "Login failed",
    });
  }
  const responseBody = (await response.json()) as { userId: string };
  await clearUserSession(event);
  await setUserSession(event, {
    user: {
      userId: responseBody.userId,
    },
    secure: {
      token: loginRequest.token,
    },
    expiresAt: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
  });
  return { status: 200 };
});
