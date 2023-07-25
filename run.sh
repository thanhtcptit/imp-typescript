#!/bin/bash

TS_FILE=$1
TS_FILENAME=$(basename $ .ts)

npx tsc $TS_FILE && node $TS_FILENAME.js
rm $TS_FILENAME.js