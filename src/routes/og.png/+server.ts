import { siteImage } from '#lib/server/og.ts';
import type { RequestHandler } from './$types';

// Always the same image: drawn once
let png: Buffer | undefined;

export const GET: RequestHandler = () => {
	png ??= siteImage();
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' }
	});
};
