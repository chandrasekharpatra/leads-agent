import { defineWorkersProject, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject(async () => {
	const migrations = await readD1Migrations("./migrations");
	return {
		test: {
			setupFiles: ["test/apply-migrations.ts"],
			poolOptions: {
				workers: {
					singleWorker: true,
					wrangler: { configPath: "./wrangler.jsonc" },
					miniflare: {
						d1Databases: ["DB"],
						bindings: {
							TEST_MIGRATIONS: migrations,
						}
					}
				}
			}
		}
	}
});