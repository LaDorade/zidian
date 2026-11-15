# Zidian

A small Chinese–English dictionary, inspired by [jisho.org](https://jisho.org).
Built with SvelteKit and Tailwind.

Type English, pinyin (`nihao`, `ni3hao3`, `nǐhǎo`, `lv4`) or characters into the same box.
Each result shows pinyin, traditional form, HSK level and measure words, and each character
has its own page (`/char/好`) with strokes, radical, components and etymology.

## Running it

```sh
npm install
npm run data   # downloads the dictionary files into ./data (~50 MB)
npm run dev
npm test
```

For production:

```sh
npm run build
node build     # PORT=3000 by default, DATA_DIR if the data isn't in ./data
```

The whole dictionary is loaded in memory at startup (~350 MB of RAM), so it needs a
long-running Node server, not a serverless platform.

## How search works

There is no database: each query scans the ~125k entries, which takes 10–50 ms.
Results are ranked by match quality, then HSK level, then word frequency, with proper
nouns and variant entries pushed to the end. The last 100 searches are cached, so
paging is instant.

## Data

- [CC-CEDICT](https://cc-cedict.org/wiki/): words and definitions. © MDBG, CC BY-SA 4.0.
- [Make Me a Hanzi](https://github.com/skishore/makemeahanzi): character data (LGPL v3+)
  and stroke order (Arphic Public License).
- [Complete HSK Vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary): HSK levels
  and frequency. © drkameleon, MIT.

These credits are shown in the footer of every page and must stay there.
CC-CEDICT only publishes its latest version, so a dictionary update can change results
(and break a search test) without any code change.

## License

The code is licensed under the [GPL v3](LICENSE) or later. The data keeps its own licenses (see above).

Made with [Claude Code](https://claude.com/claude-code).
