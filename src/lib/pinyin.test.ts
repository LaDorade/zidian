import { describe, expect, test } from 'vitest';
import { hasTones, normalizePinyin, numbersToMarks, pinyinStartsWith, removeTones } from './pinyin.ts';

describe('numbersToMarks (display)', () => {
	test.each([
		['ni3 hao3', 'nǐ hǎo'],
		['Bei3 jing1', 'Běi jīng'],
		['lu:4', 'lǜ'],
		['nu:3 er2', 'nǚ ér'],
		['gou3', 'gǒu'], // "ou": the o takes the mark
		['gui4', 'guì'], // otherwise the last vowel
		['liu2', 'liú'],
		['ma5', 'ma'],
		['m2', 'ḿ'],
		['ng4', 'ǹg'],
		['hm5', 'hm'],
		['xx5', 'xx'],
		['A A zhi4', 'A A zhì']
	])('%s -> %s', (input, expected) => {
		expect(numbersToMarks(input)).toBe(expected);
	});
});

describe('normalizePinyin', () => {
	test.each([
		['ni3hao3', 'nǐhǎo'],
		['ni3 hao3', 'nǐhǎo'],
		['Ni3 Hao3', 'nǐhǎo'],
		['nǐhǎo', 'nǐhǎo'],
		['nǐ hǎo', 'nǐhǎo'],
		['ni\u030cha\u030co', 'nǐhǎo'], // combining marks (NFD)
		['nihao', 'nihao'],
		['ni3hao', 'nǐhao'],
		['lv4', 'lǜ'],
		['lu:4', 'lǜ'],
		['xi1\'an1', 'xīān'],
		['ma5', 'ma5'],
		['shen2 me5', 'shénme5'],
		['m2', 'm2'],
		['ḿ', 'm2'],
		['ng3', 'ng3'],
		['ňg', 'ng3'],
		['hm5', 'hm5']
	])('%s -> %s', (input, expected) => {
		expect(normalizePinyin(input)).toBe(expected);
	});
});

describe('removeTones', () => {
	test.each([
		['nǐhǎo', 'nihao'],
		['lǜ', 'lu'],
		['ma5', 'ma'],
		['ng3', 'ng']
	])('%s -> %s', (input, expected) => {
		expect(removeTones(input)).toBe(expected);
	});
});

describe('hasTones', () => {
	test.each([
		['nihao', false],
		['ni3hao', true],
		['nǐhao', true],
		['ḿ', true]
	])('%s -> %s', (input, expected) => {
		expect(hasTones(input)).toBe(expected);
	});
});

// pinyinStartsWith(target, query): both are normalised by the caller
describe('pinyinStartsWith', () => {
	test.each([
		// a query without tone matches any tone, including the neutral one
		['nǐhǎo', 'nihao', true],
		['nǐhǎo', 'nǐhao', true],
		['nǐhǎo', 'nihǎo', true],
		['nǐhǎo', 'nìhǎo', false],
		['ma5', 'ma', true],
		['mā', 'ma', true],
		['shénme5', 'shenme', true],
		['dōngxi5', 'dongxi', true],
		['shénme5shíhou5', 'shenmeshihou', true],
		// the neutral tone only matches itself
		['ma5', 'ma5', true],
		['mā', 'ma5', false],
		['má', 'ma5', false],
		// syllables without vowel
		['m2', 'm2', true],
		['m4', 'm2', false],
		['mā', 'm2', false],
		['m2', 'm', true],
		// u matches u and ü, ü only matches ü
		['lǜ', 'lu', true],
		['lù', 'lu', true],
		['nǚ', 'nü', true],
		['nǔ', 'nü', false],
		// prefixes
		['nǐhǎo', 'ni', true],
		['ni', 'nihao', false]
	])('%s starts with %s: %s', (target, query, expected) => {
		expect(pinyinStartsWith(target, query)).toBe(expected);
	});
});
