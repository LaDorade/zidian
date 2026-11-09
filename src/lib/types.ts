// Which language a latin query is read as. Chinese characters are always searched as such.
export type SearchMode = 'any' | 'zh' | 'en';

export type Entry = {
	id: number;
	simplified: string;
	traditional: string;
	pinyin: string; // with tone marks, e.g. "nǐ hǎo"
	definitions: string[];
	classifiers: string[]; // measure words, e.g. ["个 gè"]
	hsk: number | null; // HSK 3.0 level, 1 to 7 (7 = levels 7-9)
};

export type CharInfo = {
	character: string;
	definition: string;
	pinyin: string[];
	radical: string;
	components: string[]; // e.g. ["女", "子"] for 好
	etymology: { type: string; hint?: string; phonetic?: string; semantic?: string } | null;
	strokeCount: number;
	strokes: string[]; // SVG paths, in stroke order (1024x1024 box)
};
