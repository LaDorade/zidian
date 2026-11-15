// OpenGraph images (1200x630 PNG), drawn on demand.
// Chinese characters are drawn from the Make Me a Hanzi stroke paths, so no CJK font
// is needed: Noto Sans (see scripts/fetch-data.sh) is only used for the latin text.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { DATA_DIR, getCharacter } from '#lib/server/dict.ts';

const WIDTH = 1200;
const HEIGHT = 630;
const FONT = join(DATA_DIR, 'NotoSans-Regular.ttf');

const escape = (text: string) =>
	text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Character drawn from its strokes in a size x size box, or nothing if we have no strokes. */
function hanzi(char: string, x: number, y: number, size: number): string {
	const strokes = getCharacter(char)?.strokes ?? [];
	// Make Me a Hanzi coordinates are upside down
	return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 1024 1024">
		<g transform="scale(1, -1) translate(0, -900)">${strokes.map((d) => `<path d="${d}"/>`).join('')}</g>
	</svg>`;
}

/** Splits text in lines of about maxChars characters (no real text measuring in SVG). */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(' ')) {
		if (line && (line + ' ' + word).length > maxChars) {
			lines.push(line);
			line = word;
		} else {
			line = line ? `${line} ${word}` : word;
		}
	}
	if (line) lines.push(line);
	if (lines.length > maxLines) {
		lines.length = maxLines;
		lines[maxLines - 1] = lines[maxLines - 1].replace(/[,;]?\s*\S*$/, '…');
	}
	return lines;
}

function render(content: string): Buffer {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" font-family="Noto Sans">
		<rect width="100%" height="100%" fill="#fff"/>
		${content}
		<text x="80" y="${HEIGHT - 50}" font-size="28" fill="#888">Zidian · Chinese–English dictionary</text>
	</svg>`;
	const resvg = new Resvg(svg, {
		font: { fontFiles: existsSync(FONT) ? [FONT] : [], loadSystemFonts: false, defaultFontFamily: 'Noto Sans' }
	});
	return resvg.render().asPng();
}

/** Image of the whole site: 字典 + a short pitch. */
export function siteImage(): Buffer {
	return render(`
		${hanzi('字', 60, 70, 260)}${hanzi('典', 300, 70, 260)}
		<text x="600" y="190" font-size="96">Zidian</text>
		${wrap('Chinese–English dictionary with pinyin, HSK levels and stroke order', 28, 3)
			.map((l, i) => `<text x="600" y="${270 + i * 50}" font-size="40" fill="#444">${escape(l)}</text>`)
			.join('')}
	`);
}

/** Image of a character page: the character, its pinyin and meaning. Null if we cannot draw it. */
export function characterImage(char: string): Buffer | null {
	const info = getCharacter(char);
	if (!info?.strokes.length) return null;
	return render(`
		${hanzi(char, 70, 40, 470)}
		<text x="600" y="200" font-size="88">${escape(info.pinyin.join(', '))}</text>
		${wrap(info.definition, 28, 4)
			.map((l, i) => `<text x="600" y="${290 + i * 52}" font-size="40" fill="#444">${escape(l)}</text>`)
			.join('')}
	`);
}
