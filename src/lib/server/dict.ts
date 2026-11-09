// Loads the dictionary data (see scripts/fetch-data.sh) in memory and searches it.
// Everything is a plain linear scan over ~125k entries: fast enough (a few ms)
// and much simpler than maintaining indexes or a database.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HAN } from '#lib/chinese.ts';
import {
	hasTones,
	looksLikePinyin,
	normalizePinyin,
	numbersToMarks,
	pinyinStartsWith,
	removeTones
} from '#lib/pinyin.ts';
import type { CharInfo, Entry, SearchMode } from '#lib/types.ts';

type IndexedEntry = Entry & {
	py: string; // normalised pinyin, e.g. "nǐhǎo"
	pyBase: string; // without tones, e.g. "nihao"
	plainDefinitions: string[]; // lowercase, without "(...)" notes: what english search looks at
	lowerForms: string[]; // [simplified, traditional] in lowercase, for 卡拉ok -> 卡拉OK
	secondary: boolean; // proper noun or "variant of" entry: shown after the others
	frequency: number; // rank in the HSK word list (lower = more common)
	commonness: number; // rough proxy for words outside the HSK list, see computeCommonness()
};

// Data files, downloaded by `npm run data`. DATA_DIR can point elsewhere in production.
const DATA_DIR = process.env.DATA_DIR ?? 'data';
const NOT_RANKED = Number.MAX_SAFE_INTEGER;

function readData(file: string): string {
	const path = join(DATA_DIR, file);
	if (!existsSync(path)) {
		throw new Error(`Missing dictionary file ${path}. Run "npm run data" to download it.`);
	}
	return readFileSync(path, 'utf8');
}

// ---------------------------------------------------------------------------
// CC-CEDICT

// Line format: 傳統 传统 [chuan2 tong3] /tradition/traditional/CL:個|个[ge4]/
const LINE = /^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/$/;

function parseCedict(): IndexedEntry[] {
	const entries: IndexedEntry[] = [];
	for (const line of readData('cedict.txt').split(/\r?\n/)) {
		const match = line.match(LINE);
		if (!match) continue; // comments and empty lines
		const [, traditional, simplified, pinyin, defs] = match;

		const definitions: string[] = [];
		const classifiers: string[] = [];
		for (const def of defs.split('/')) {
			if (def.startsWith('CL:')) classifiers.push(...parseClassifiers(def.slice(3)));
			else definitions.push(cleanDefinition(def));
		}

		const py = normalizePinyin(pinyin);
		entries.push({
			id: entries.length,
			simplified,
			traditional,
			pinyin: numbersToMarks(pinyin),
			definitions,
			classifiers,
			plainDefinitions: definitions.map((d) => d.toLowerCase().replace(/\(.*?\)/g, '')),
			lowerForms: [simplified.toLowerCase(), traditional.toLowerCase()],
			py,
			pyBase: removeTones(py),
			secondary: /^[A-Z]/.test(pinyin) || definitions.every((d) => /variant of|^used in/.test(d)),
			hsk: null,
			frequency: NOT_RANKED,
			commonness: 0
		});
	}
	return entries;
}

// "個|个[ge4],隻|只[zhi1]" -> ["个 gè", "只 zhī"]
function parseClassifiers(text: string): string[] {
	return text.split(',').map((cl) => {
		const match = cl.match(/(?:[^|[]+\|)?([^[]+)\[([^\]]+)\]/);
		return match ? `${match[1]} ${numbersToMarks(match[2])}` : cl;
	});
}

// "variant of 個|个[ge4]" -> "variant of 个[gè]"
function cleanDefinition(def: string): string {
	return def
		.replace(new RegExp(`${HAN.source}+\\|(${HAN.source}+)`, 'gu'), '$1')
		.replace(/\[([a-z:A-Z]+[1-5](?: [a-z:A-Z]+[1-5])*)\]/g, (_, py) => `[${numbersToMarks(py)}]`);
}

// CEDICT has no frequency data. As a rough proxy, a character is "common" if it
// appears in many words, and a word is as common as its rarest character.
function computeCommonness(entries: IndexedEntry[]) {
	const charCount = new Map<string, number>();
	for (const e of entries) {
		for (const c of new Set(e.simplified)) charCount.set(c, (charCount.get(c) ?? 0) + 1);
	}
	for (const e of entries) {
		e.commonness = Math.min(...[...e.simplified].map((c) => charCount.get(c) ?? 0));
	}
}

// ---------------------------------------------------------------------------
// Complete HSK Vocabulary (HSK levels + word frequency)

// Sets the HSK 3.0 level and frequency rank of the entries found in the HSK list.
// Matching is done on simplified + pinyin, so 好 hǎo and 好 hào are distinct.
function addHskData(entries: IndexedEntry[]) {
	// Several entries can share a key (e.g. 后 from 後 and from 后)
	const byKey = Map.groupBy(entries, (e) => `${e.simplified}|${e.py}`);
	for (const word of JSON.parse(readData('hsk.json'))) {
		const level = word.level.find((l: string) => l.startsWith('new-')); // "new-3" = HSK 3.0, level 3
		for (const form of word.forms) {
			const key = `${word.simplified}|${normalizePinyin(form.transcriptions.numeric)}`;
			for (const entry of byKey.get(key) ?? []) {
				entry.hsk = level ? Number(level.slice(4)) : null;
				entry.frequency = word.frequency;
			}
		}
	}
}

// ---------------------------------------------------------------------------
// Make Me a Hanzi (character info + stroke order)

function parseCharacters(): Map<string, CharInfo> {
	const chars = new Map<string, CharInfo>();
	for (const line of readData('dictionary.txt').split('\n')) {
		if (!line) continue;
		const d = JSON.parse(line);
		chars.set(d.character, {
			character: d.character,
			definition: d.definition ?? '',
			pinyin: d.pinyin ?? [],
			radical: d.radical ?? '',
			// "⿰女子" -> ["女", "子"] (drops layout symbols and unknown parts)
			components: [...(d.decomposition ?? '')].filter((c) => HAN.test(c) && c !== d.character),
			etymology: d.etymology ?? null,
			strokeCount: 0,
			strokes: []
		});
	}
	for (const line of readData('graphics.txt').split('\n')) {
		if (!line) continue;
		const g = JSON.parse(line);
		const info = chars.get(g.character);
		if (info) {
			info.strokes = g.strokes;
			info.strokeCount = g.strokes.length;
		}
	}
	return chars;
}

// ---------------------------------------------------------------------------
// Loading (once, at server start)

const entries = parseCedict();
addHskData(entries);
computeCommonness(entries);
const characters = parseCharacters();

// ---------------------------------------------------------------------------
// Search

// Lower score = better match.
const EXACT = 0;
const EXACT_LATER = 0.5; // english: exact match, but not on the first meaning
const WORD = 1; // english: the query is a whole word of a definition
const PREFIX = 2;
const CONTAINS = 3;

function englishScore(entry: IndexedEntry, query: string, wordRegex: RegExp): number {
	let best = Infinity;
	entry.plainDefinitions.forEach((def, i) => {
		// "to eat; to consume" -> ["to eat", "to consume"]
		def.split(';').forEach((sense, j) => {
			// "to eat", "a man", "the sun" also count as exact matches
			const plain = sense.trim().replace(/^(to|a|an|the) /, '');
			if (plain === query) {
				best = Math.min(best, i === 0 && j === 0 ? EXACT : EXACT_LATER);
			}
		});
		if (wordRegex.test(def)) best = Math.min(best, WORD);
	});
	return best;
}

function hanziScore(entry: IndexedEntry, query: string): number {
	const forms = entry.lowerForms;
	if (forms.some((f) => f === query)) return EXACT;
	if (forms.some((f) => f.startsWith(query))) return PREFIX;
	if (forms.some((f) => f.includes(query))) return CONTAINS;
	return Infinity;
}

function pinyinScore(entry: IndexedEntry, py: string, pyBase: string): number {
	if (!entry.pyBase.startsWith(pyBase) || !pinyinStartsWith(entry.py, py)) return Infinity;
	return entry.pyBase === pyBase ? EXACT : PREFIX;
}

/**
 * Search by hanzi, pinyin (with or without tones) or english. Best matches first.
 * `mode` restricts latin queries to pinyin ('zh') or english ('en').
 * Returns the total number of results and the `limit` results starting at `offset`.
 */
export function search(
	input: string,
	mode: SearchMode = 'any',
	offset = 0,
	limit = Infinity
): { total: number; entries: Entry[] } {
	const key = `${mode}|${input.trim()}`;
	const results = cache.get(key) ?? searchUncached(input.trim(), mode);
	// Least recently used cache: a Map keeps insertion order, so re-insert on each use
	cache.delete(key);
	cache.set(key, results);
	if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
	return { total: results.length, entries: results.slice(offset, offset + limit).map(toEntry) };
}

// Recent searches (sorted results), so that changing page does not redo the whole search.
const CACHE_SIZE = 100;
const cache = new Map<string, IndexedEntry[]>();

function searchUncached(input: string, mode: SearchMode): IndexedEntry[] {
	if (!input) return [];

	let scoreOf: (e: IndexedEntry) => number;

	const query = input.toLowerCase();

	if (HAN.test(query)) {
		scoreOf = (e) => hanziScore(e, query);
	} else {
		// In 'any' mode, latin input can be pinyin or english: try both, unless tones are given.
		const py = mode !== 'en' && looksLikePinyin(query) ? normalizePinyin(query) : '';
		const pyBase = removeTones(py);
		const english = mode === 'en' || (mode === 'any' && !hasTones(query));
		const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		// Not \b, which is ASCII-only: "ng" would be a word in "děng", "crêpe" would contain "cr"
		const wordRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u');

		scoreOf = (e) =>
			Math.min(
				py ? pinyinScore(e, py, pyBase) : Infinity,
				english ? englishScore(e, query, wordRegex) : Infinity
			);
	}

	const results: { entry: IndexedEntry; score: number }[] = [];
	for (const entry of entries) {
		const score = scoreOf(entry);
		if (score !== Infinity) results.push({ entry, score });
	}

	results.sort(
		(a, b) =>
			a.score - b.score ||
			Number(a.entry.secondary) - Number(b.entry.secondary) ||
			// Among equally good matches: HSK words first, by level, then by frequency
			(a.entry.hsk ?? 10) - (b.entry.hsk ?? 10) ||
			a.entry.frequency - b.entry.frequency ||
			b.entry.commonness - a.entry.commonness ||
			a.entry.simplified.length - b.entry.simplified.length
	);
	return results.map((r) => r.entry);
}

/** Strip the search-only fields before sending an entry to the browser. */
function toEntry({ id, simplified, traditional, pinyin, definitions, classifiers, hsk }: IndexedEntry): Entry {
	return { id, simplified, traditional, pinyin, definitions, classifiers, hsk };
}

// ---------------------------------------------------------------------------
// Characters

export function getCharacter(char: string): CharInfo | null {
	return characters.get(char) ?? null;
}

/** Unique chinese characters of the given words, in order, with their info. */
export function charactersOf(words: string[], max = 10): CharInfo[] {
	const unique = [...new Set(words.flatMap((w) => [...w]))].filter((c) => characters.has(c));
	return unique.slice(0, max).map((c) => characters.get(c)!);
}
