/// <reference types="./worker-configuration.d.ts" />

declare module "h3" {

  interface Env extends Cloudflare.Env {
    readonly LEADS_SERVER: Fetcher;
    readonly NUXT_SESSION_PASSWORD: string;
  }

  interface H3EventContext {
    cf: CfProperties;
    cloudflare: {
      request: Request;
      env: Env;
      context: ExecutionContext;
    };
  }
}

export { };
