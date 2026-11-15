import { building, dev } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	ORIGIN: {
		// Also used by components rendered in the browser (Seo.svelte)
		public: true,
		description: 'Public URL of the site, e.g. https://zidian.example.com',
		// Canonical URLs, OpenGraph tags, robots.txt and sitemap.xml are built from it.
		// adapter-node would otherwise trust the Host header, and default to https.
		schema: (value) => {
			if (!value) {
				if (dev || building) return undefined; // the request origin is fine locally
				throw new Error('ORIGIN is not set, e.g. ORIGIN=https://zidian.example.com node build');
			}
			const { origin } = new URL(value);
			if (origin === 'null') throw new Error(`ORIGIN is not a valid http(s) URL: ${value}`);
			return origin;
		}
	}
});
