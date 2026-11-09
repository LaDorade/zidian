import { error } from '@sveltejs/kit';
import { isChinese } from '#lib/chinese.ts';
import { charactersOf, search } from '#lib/server/dict.ts';
import type { SearchMode } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 50;
const MODES: SearchMode[] = ['any', 'zh', 'en'];

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const modeParam = url.searchParams.get('mode') as SearchMode;
	const mode = MODES.includes(modeParam) ? modeParam : 'any';

	const { total, entries } = search(q, mode, (page - 1) * PAGE_SIZE, PAGE_SIZE);
	const pageCount = Math.ceil(total / PAGE_SIZE);
	if (page > 1 && page > pageCount) error(404, 'Page not found');

	// Sidebar: characters of the query itself, or of the first results.
	const words = isChinese(q) ? [q] : entries.slice(0, 3).map((e) => e.simplified);
	const characters = charactersOf(words).map(({ strokes, ...char }) => char);

	return { q, mode, page, total, pageCount, entries, characters };
};
