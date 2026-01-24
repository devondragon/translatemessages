import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				// Use test config without AI binding to avoid remote mode in CI
				wrangler: { configPath: './wrangler.test.toml' },
			},
		},
	},
});
