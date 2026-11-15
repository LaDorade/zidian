import { allCharacters } from '#lib/server/dict.ts';
import { siteOrigin } from '#lib/origin.ts';
import type { RequestHandler } from './$types';

// Home page + one page per character (~9500 URLs, under the 50k limit of a sitemap).
// Search result pages are left out: they are infinite and not indexed.
export const GET: RequestHandler = ({ url }) => {
	const origin = siteOrigin(url);
	const urls = [`${origin}/`, ...allCharacters().map((c) => `${origin}/char/${encodeURIComponent(c)}`)];
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		urls.map((loc) => `<url><loc>${loc}</loc></url>`).join('\n') +
		'\n</urlset>\n';

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400' }
	});
};
