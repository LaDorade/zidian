import { siteOrigin } from '#lib/origin.ts';
import type { RequestHandler } from './$types';

// Not in static/: the sitemap needs an absolute URL.
export const GET: RequestHandler = ({ url }) =>
	new Response(
		[
			'User-agent: *',
			'# Search result pages are infinite, only character pages are worth indexing',
			'Disallow: /?',
			'',
			`Sitemap: ${siteOrigin(url)}/sitemap.xml`,
			''
		].join('\n'),
		{ headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' } }
	);
