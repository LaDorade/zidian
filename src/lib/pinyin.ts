// Pinyin helpers: tone numbers <-> tone marks, and query normalisation.
//
// Normalised form used for searching: lowercase, no spaces, tone marks
// (e.g. "Ni3 hao3", "nǐ hǎo", "ni3hao3" -> "nǐhǎo"). An unmarked vowel in a
// query means "any tone", so "nihao" or "ni3hao" also match "nǐhǎo".

const MARKS: Record<string, string> = {
	a: 'aāáǎà',
	e: 'eēéěè',
	i: 'iīíǐì',
	o: 'oōóǒò',
	u: 'uūúǔù',
	ü: 'üǖǘǚǜ'
};

// 'ǎ' -> ['a', 3], 'ü' -> ['u', 0] (ü is folded into u so "lu" finds "lü")
const SPLIT: Record<string, [string, number]> = {};
for (const [vowel, forms] of Object.entries(MARKS)) {
	[...forms].forEach((form, tone) => (SPLIT[form] = [vowel === 'ü' ? 'u' : vowel, tone]));
}

function splitChar(c: string): [string, number] {
	return SPLIT[c] ?? [c, 0];
}

/** "hao3" -> "hǎo", "lu:4" -> "lǜ", "ma5" -> "ma". Anything else is returned as is. */
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
	if (i < 0) return letters;

	const marked = MARKS[lower[i]][tone];
	const isUpper = letters[i] !== lower[i];
	return letters.slice(0, i) + (isUpper ? marked.toUpperCase() : marked) + letters.slice(i + 1);
}

/** "ni3 hao3" -> "nǐ hǎo" (for display) */
export function numbersToMarks(pinyin: string): string {
	return pinyin.split(' ').map(syllableToMarks).join(' ');
}

/** Any spelling ("Ni3 hao3", "nǐhǎo", "ni hao", "lv4") -> normalised form ("nǐhǎo", "lǜ"). */
export function normalizePinyin(input: string): string {
	return input
		.normalize('NFC')
		.toLowerCase()
		.replace(/u:|v/g, 'ü')
		.split(/[\s']+/)
		.flatMap((word) => word.match(/\D+\d?/g) ?? []) // "ni3hao" -> ["ni3", "hao"]
		.map(syllableToMarks)
		.join('')
		.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]/g, '');
}

/** Normalised pinyin without any tone: "nǐhǎo" -> "nihao", "lǜ" -> "lu" */
export function removeTones(normalized: string): string {
	return [...normalized].map((c) => splitChar(c)[0]).join('');
}

/** True if the query looks like pinyin (latin letters, tone numbers or marks). */
export function looksLikePinyin(input: string): boolean {
	return /^[a-zü:\s'1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/i.test(input.normalize('NFC'));
}

/** True if the query specifies at least one tone. */
export function hasTones(input: string): boolean {
	return /[1-5āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(input.normalize('NFC'));
}

/**
 * Does `target` start with `query`? Both must be normalised.
 * A vowel without a mark in the query matches any tone in the target.
 */
export function pinyinStartsWith(target: string, query: string): boolean {
	if (query.length > target.length) return false;
	for (let i = 0; i < query.length; i++) {
		const [qBase, qTone] = splitChar(query[i]);
		const [tBase, tTone] = splitChar(target[i]);
		if (qBase !== tBase) return false;
		if (qTone && qTone !== tTone) return false;
	}
	return true;
}
