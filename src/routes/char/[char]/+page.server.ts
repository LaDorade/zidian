import { error } from '@sveltejs/kit';
import { getCharacter, search } from '#lib/server/dict.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const char = params.char;
	const info = getCharacter(char);
	const results = search(char);
	if (!info && !results.length) error(404, 'Character not found');

	const isReading = (e: (typeof results)[number]) => e.simplified === char || e.traditional === char;
	return {
		char,
		info,
		readings: results.filter(isReading),
		words: results.filter((e) => !isReading(e)).slice(0, 50),
		wordCount: results.length
	};
};
