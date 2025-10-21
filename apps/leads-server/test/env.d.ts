declare module 'cloudflare:test' {
	interface ProvidedEnv extends Env {
		JWT_SECRET: string;
		PERPLEXITY_API_KEY: string;
	}
}
