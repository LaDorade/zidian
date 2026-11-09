#!/bin/sh
# Downloads the open dictionary data into ./data (not committed to git).
#   - CC-CEDICT (CC BY-SA 4.0)            https://www.mdbg.net/chinese/dictionary?page=cedict
#   - Make Me a Hanzi dictionary (LGPL)   https://github.com/skishore/makemeahanzi
#   - Make Me a Hanzi graphics (Arphic PL) idem — used for stroke order
#   - Complete HSK Vocabulary (MIT)       https://github.com/drkameleon/complete-hsk-vocabulary
set -e

# Make Me a Hanzi and the HSK list are pinned to a commit, so that an update upstream
# cannot change the results (and break the tests) without us noticing.
# CC-CEDICT cannot be pinned: MDBG only publishes the latest version.
MAKEMEAHANZI=https://raw.githubusercontent.com/skishore/makemeahanzi/bddc96d41bef78427ed0e034e9f7e31d71fd1b92
HSK=https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/7ac65bf1a6387d35f1ade478906172a19311c7f9
mkdir -p data
cd data
curl -fL https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz | gunzip > cedict.txt
curl -fLO $MAKEMEAHANZI/dictionary.txt
curl -fLO $MAKEMEAHANZI/graphics.txt
curl -fL $HSK/complete.json -o hsk.json
ls -lh
