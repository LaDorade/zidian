#!/bin/sh
# Downloads the open dictionary data into ./data (not committed to git).
#   - CC-CEDICT (CC BY-SA 4.0)            https://www.mdbg.net/chinese/dictionary?page=cedict
#   - Make Me a Hanzi dictionary (LGPL)   https://github.com/skishore/makemeahanzi
#   - Make Me a Hanzi graphics (Arphic PL) idem — used for stroke order
#   - Complete HSK Vocabulary (MIT)       https://github.com/drkameleon/complete-hsk-vocabulary
set -e
mkdir -p data
cd data
curl -fL https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz | gunzip > cedict.txt
curl -fLO https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt
curl -fLO https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt
curl -fL https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json -o hsk.json
ls -lh
