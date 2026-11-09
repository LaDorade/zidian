// Matches one Chinese character (any Han block: 好, 〇, 𠮷, radicals like 亻...)
export const HAN = /\p{Script=Han}/u;

export function isChinese(text: string): boolean {
	return HAN.test(text);
}
