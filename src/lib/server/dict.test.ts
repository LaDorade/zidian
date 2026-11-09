// Search tests on the real data: skipped if `npm run data` has not been run.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

// Same default as dict.ts (which cannot be imported before checking: it loads the files)
const dataDir = process.env.DATA_DIR ?? 'data';
const hasData = ['cedict.txt', 'dictionary.txt', 'graphics.txt', 'hsk.json'].every((f) =>
	existsSync(join(dataDir, f))
);

describe.skipIf(!hasData)('search', async () => {
	const { search } = await import('./dict.ts');
	const first = (q: string, mode?: 'any' | 'zh' | 'en') => search(q, mode, 0, 1).entries[0];
	const top = (q: string, n: number, mode?: 'any' | 'zh' | 'en') =>
		search(q, mode, 0, n).entries.map((e) => e.simplified);

	test.each([
		['你好', '你好'],
		['卡拉OK', '卡拉OK'], // latin letters inside a word
		['卡拉ok', '卡拉OK'],
		['T恤', 'T恤'],
		['〇', '〇'],
		['nihao', '你好'],
		['ni3hao3', '你好'],
		['nǐhǎo', '你好'],
		['ni hao', '你好'],
		['eat', '吃'],
		['she', '她'],
		['man', '男人']
	])('%s -> %s first', (q, expected) => {
		expect(first(q).simplified).toBe(expected);
	});

	test('pinyin: the neutral tone only matches itself', () => {
		// 吗 ma, 嘛 ma, 么 ma, and words starting with them (吗喽 ma lóu), but not 妈 mā
		expect(search('ma5').entries.every((e) => e.pinyin.split(' ')[0] === 'ma')).toBe(true);
	});

	test('pinyin: a syllable without vowel keeps its tone', () => {
		const { total, entries } = search('m2');
		expect(total).toBeLessThan(10);
		expect(entries.every((e) => e.pinyin.startsWith('ḿ'))).toBe(true);
	});

	test('pinyin: ü typed explicitly does not match u', () => {
		expect(top('nv3', 50)).not.toContain('努');
		expect(top('nu3', 50)).toContain('努');
		expect(top('nu3', 50)).toContain('女');
	});

	test('english: notes in parentheses are not searched', () => {
		// "(slang)" is a note on hundreds of entries, "slang" a meaning of a few
		expect(search('slang', 'en').total).toBeLessThan(50);
	});

	test('english: accented letters are part of words', () => {
		// "ng" is not a word in "děng" (pinyin in a definition), nor "cr" in "crêpe".
		// A few real matches remain: "Francis Ng", "consonant ng", "CR Vanguard".
		expect(search('ng', 'en').total).toBeLessThan(20);
		expect(top('cr', 50, 'en')).not.toContain('可丽饼');
		expect(top('crêpe', 50, 'en')).toContain('可丽饼');
	});

	test('modes', () => {
		expect(first('she', 'en').simplified).toBe('她');
		expect(first('she', 'zh').simplified).not.toBe('她');
		expect(search('hello', 'zh').total).toBe(0);
	});

	test('pagination', () => {
		const all = search('ma').entries;
		expect(search('ma', 'any', 50, 50).entries).toEqual(all.slice(50, 100));
	});
});
