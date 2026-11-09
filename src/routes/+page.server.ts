import { charactersOf, isChinese, search } from '#lib/server/dict.ts';
import type { SearchMode } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 50;
const MODES: SearchMode[] = ['any', 'zh', 'en'];

export const load: PageServerLoad = ({ url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const modeParam = url.searchParams.get('mode') as SearchMode;
	const mode = MODES.includes(modeParam) ? modeParam : 'any';

	const results = search(q, mode);
	const entries = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	// Sidebar: characters of the query itself, or of the first results.
	const words = isChinese(q) ? [q] : entries.slice(0, 3).map((e) => e.simplified);
	const characters = charactersOf(words).map(({ strokes, ...char }) => char);

	return { q, mode, page, total: results.length, pageCount: Math.ceil(results.length / PAGE_SIZE), entries, characters };
};
