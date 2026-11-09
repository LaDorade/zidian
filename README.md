# Zidian

A simple Chinese (simplified) – English online dictionary, inspired by [jisho.org](https://jisho.org).
Built with SvelteKit and Tailwind CSS. Styling is intentionally minimal.

## Getting started

```sh
npm install
npm run data   # downloads the dictionary files into ./data (~50 MB, not committed)
npm run dev
npm test       # unit tests (pinyin) + search tests on the real data
```

## Production

```sh
npm run build
node build     # PORT=3000 by default; DATA_DIR=/path/to/data if not ./data
```

The app uses `adapter-node`: the dictionary (~50 MB of files) is loaded in memory once
at startup, which does not suit serverless platforms. The server uses ~350 MB of RAM.

## Features

- Search in English, pinyin or Chinese characters, from a single search box.
  A mode selector (`?mode=any|zh|en`) restricts latin input to pinyin or to English
  ("she" in Chinese mode finds 蛇, in English mode 她). Chinese characters are always searched as such.
- Pinyin with or without tones, in both notations: `nihao`, `ni hao`, `ni3hao3`, `ni3hao`, `nǐhǎo`.
  `ü` can be typed `v` or `u:` (`lv4`, `lü`), or ignored (`lu4` also finds 绿 lǜ, but `lv4` does not find 路 lù).
  A syllable without tone matches any tone; the neutral tone `5` only matches itself (`ma5` → 吗 ma, not 妈 mā).
  Syllables without vowel work too (`m2`, `ḿ`, `ng4`).
- Result list with pinyin, traditional form, HSK level, numbered meanings and measure words.
- Character info next to the results, and a page per character (`/char/好`):
  meaning, strokes, radical, components, etymology, stroke order, words using it.

## Code overview

| File                            | Role                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `scripts/fetch-data.sh`         | Downloads the data files                                   |
| `src/lib/pinyin.ts`             | Tone numbers ↔ tone marks, pinyin normalisation/matching |
| `src/lib/chinese.ts`            | `isChinese()`: detects Han characters                      |
| `src/lib/server/dict.ts`        | Loads the data in memory at startup, search, char lookup   |
| `src/routes/+page.*`            | Search page (`/?q=...&page=...`)                           |
| `src/routes/char/[char]/+page.*`| Character page                                             |
| `src/lib/components/`           | `EntryList` (result list), `CharSummary` (sidebar card)    |
| `*.test.ts`                     | Vitest tests, next to the code they test                   |

Search is a plain scan over the ~125k entries (no database, no index): ~10 ms for
Chinese characters or pinyin with tones, ~35-50 ms for latin queries that are also
searched in English. The sorted results of the last 100 searches are kept in memory,
so changing page is instant. English search ignores the notes in parentheses
("(slang)", "(literary)"). Results are sorted by:

1. match quality (exact, exact on a secondary meaning, whole word, prefix, contains);
2. proper nouns and "variant of" / "used in" entries last;
3. HSK 3.0 level (HSK 1 first, words outside the HSK list after);
4. frequency rank from the HSK list;
5. for the remaining words, a rough proxy: how many words use the entry's rarest character.

HSK data is matched on simplified + pinyin, so only the listed readings get a level
(好 hǎo and 好 hào are both HSK 1, but 了 liǎo is not). The HSK list gives a level per
word, not per reading: a word listed with several readings gives its level to all of
them, rare ones included (见 xiàn is HSK 1 like 见 jiàn, so `xian` shows it first).

## Data and licenses

- **[CC-CEDICT](https://cc-cedict.org/wiki/)** — words, pinyin, definitions.
  © MDBG and contributors, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- **[Make Me a Hanzi](https://github.com/skishore/makemeahanzi)** — character info and stroke order.
  `dictionary.txt` (derived from Unihan and CJKlib): LGPL v3+.
  `graphics.txt` (derived from Arphic fonts): Arphic Public License.
- **[Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)** — HSK levels and word frequency.
  © drkameleon, MIT.

Make Me a Hanzi and the HSK list are pinned to a commit in `scripts/fetch-data.sh`.
CC-CEDICT cannot be (MDBG only publishes the latest version), so a dictionary update
can change some results, and make a search test fail without any code change.

These credits are also shown in the footer of every page and must stay there.
