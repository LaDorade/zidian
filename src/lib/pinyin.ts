// Pinyin helpers: tone numbers <-> tone marks, and query normalisation.
//
// Normalised form used for searching: lowercase, no spaces, one character per
// letter so it can be compared character by character:
//   - tones 1-4 on a vowel are tone marks:       "Ni3 hao3", "nǐ hǎo" -> "nǐhǎo"
//   - the neutral tone is kept as the number 5:   "ma5", "shen2 me5"  -> "ma5", "shénme5"
//   - syllables without vowel keep their number:  "m2", "ḿ", "ng4"    -> "m2", "m2", "ng4"
// In a query, a syllable without tone means "any tone": "nihao" matches "nǐhǎo",
// "ma" matches "mā" and "ma5", but "ma5" only matches "ma5".
// Likewise "u" matches "u" and "ü" ("lu4" finds "lǜ"), but "ü"/"v" only matches "ü".

const MARKS: Record<string, string> = {
	a: 'aāáǎà',
	e: 'eēéěè',
	i: 'iīíǐì',
	o: 'oōóǒò',
	u: 'uūúǔù',
	ü: 'üǖǘǚǜ'
};
const MARKED_VOWELS = Object.values(MARKS).join('');
const COMBINING_MARKS = '̄́̌̀'; // tones 1 to 4

// 'ǎ' -> ['a', 3], 'ǜ' -> ['ü', 4], '5' -> ['', 5], 'n' -> ['n', 0]
const SPLIT: Record<string, [string, number]> = {};
for (const [vowel, forms] of Object.entries(MARKS)) {
	[...forms].forEach((form, tone) => (SPLIT[form] = [vowel, tone]));
}
for (const tone of [1, 2, 3, 4, 5]) SPLIT[tone] = ['', tone];

function splitChar(c: string): [string, number] {
	return SPLIT[c] ?? [c, 0];
}

/** "hao3" -> "hǎo", "lu:4" -> "lǜ", "ma5" -> "ma", "ng2" -> "ńg". Anything else is returned as is. */
export function syllableToMarks(syllable: string): string {
	const match = syllable.match(/^([a-zü:]+)([1-5])$/i);
	if (!match) return syllable;
	const letters = match[1].replace(/u:|v/g, 'ü').replace(/U:|V/g, 'Ü');
	const tone = Number(match[2]);
	if (tone === 5) return letters;

	// Standard rule: a or e takes the mark, then the o of "ou", else the last vowel.
	const lower = letters.toLowerCase();
	let i = lower.search(/[ae]/);
	if (i < 0) i = lower.indexOf('ou');
	if (i < 0) i = lower.search(/[iouü][^iouü]*$/);
	if (i < 0) {
		// No vowel (m, n, ng, hm, hng): the mark goes on the m or n
		const mn = lower.search(/[mn]/);
		if (mn < 0) return letters;
		const marked = letters.slice(0, mn + 1) + COMBINING_MARKS[tone - 1] + letters.slice(mn + 1);
		return marked.normalize('NFC');
	}

	const marked = MARKS[lower[i]][tone];
	const isUpper = letters[i] !== lower[i];
	return letters.slice(0, i) + (isUpper ? marked.toUpperCase() : marked) + letters.slice(i + 1);
}

/** "ni3 hao3" -> "nǐ hǎo" (for display) */
export function numbersToMarks(pinyin: string): string {
	return pinyin.split(' ').map(syllableToMarks).join(' ');
}

// "hao3" -> "hǎo", but "ma5" and "m2" keep their number (see the normalised form above)
function normalizeSyllable(syllable: string): string {
	const match = syllable.match(/^(.*?)([1-5])$/);
	if (!match) return syllable;
	const [, letters, tone] = match;
	if (tone === '5' || !/[aeiouü]/.test(letters)) return letters + tone;
	return syllableToMarks(syllable);
}

/** Any spelling ("Ni3 hao3", "nǐhǎo", "ni hao", "lv4", "ḿ") -> normalised form ("nǐhǎo", "lǜ", "m2"). */
export function normalizePinyin(input: string): string {
	return (
		input
			.toLowerCase()
			// Tone marks on m/n ("ḿ", "ňg") become numbers ("m2", "ng3")
			.normalize('NFD')
			.replace(/([mn])([̄́̌̀])(g?)/g, (_, mn, mark, g) => mn + g + (COMBINING_MARKS.indexOf(mark) + 1))
			.normalize('NFC')
			.replace(/u:|v/g, 'ü')
			.split(/[\s']+/)
			.flatMap((word) => word.match(/\D+\d?/g) ?? []) // "ni3hao" -> ["ni3", "hao"]
			.map(normalizeSyllable)
			.join('')
			.replace(new RegExp(`[^a-zü1-5${MARKED_VOWELS}]`, 'g'), '')
	);
}

/** Normalised pinyin without any tone, ü written u: "nǐhǎo" -> "nihao", "lǜ" -> "lu", "ma5" -> "ma" */
export function removeTones(normalized: string): string {
	return [...normalized].map((c) => splitChar(c)[0].replace('ü', 'u')).join('');
}

/** True if the query looks like pinyin (latin letters, tone numbers or marks). */
export function looksLikePinyin(input: string): boolean {
	return new RegExp(`^[a-zü:\\s'1-5ḿńňǹ${MARKED_VOWELS}]+$`, 'i').test(input.normalize('NFC'));
}

/** True if the query specifies at least one tone. */
export function hasTones(input: string): boolean {
	return /[1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜḿńňǹ]/i.test(input.normalize('NFC'));
}

/**
 * Does `target` start with `query`? Both must be normalised.
 * Whatever tone the query leaves out matches any tone in the target.
 */
export function pinyinStartsWith(target: string, query: string): boolean {
	let t = 0;
	for (const q of query) {
		const [qBase, qTone] = splitChar(q);
		// The query has no tone number here: skip the target's one ("ma" vs "ma5")
		if (qBase) while (t < target.length && !splitChar(target[t])[0]) t++;
		if (t >= target.length) return false;

		const [tBase, tTone] = splitChar(target[t++]);
		if (qBase !== tBase && !(qBase === 'u' && tBase === 'ü')) return false;
		if (qTone && qTone !== tTone) return false;
	}
	return true;
}
