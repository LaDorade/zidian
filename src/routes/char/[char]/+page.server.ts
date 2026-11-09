import { error } from '@sveltejs/kit';
import { isChinese } from '#lib/chinese.ts';
import { getCharacter, search } from '#lib/server/dict.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const char = params.char;
	if ([...char].length !== 1 || !isChinese(char)) error(404, 'Not a Chinese character');

	const info = getCharacter(char);
	const { total, entries } = search(char);
	if (!info && !total) error(404, 'Character not found');

	const isReading = (e: (typeof entries)[number]) => e.simplified === char || e.traditional === char;
	return {
		char,
		info,
		readings: entries.filter(isReading),
		words: entries.filter((e) => !isReading(e)).slice(0, 50),
		wordCount: total
	};
};
