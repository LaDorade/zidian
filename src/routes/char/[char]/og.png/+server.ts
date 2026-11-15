import { redirect } from '@sveltejs/kit';
import { characterImage } from '#lib/server/og.ts';
import type { RequestHandler } from './$types';

// Drawn on each request (a few ms), the cache headers let proxies and social networks keep it.
export const GET: RequestHandler = ({ params }) => {
	const png = characterImage(params.char);
	// No stroke data for this character: the generic image
	if (!png) redirect(302, '/og.png');
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' }
	});
};
