#!/bin/bash

TS_FILE=$1
DIR_NAME=$(dirname $1)
TS_FILENAME=$(basename $1 .ts)

npx tsc $TS_FILE && node $DIR_NAME/$TS_FILENAME.js
rm $DIR_NAME/$TS_FILENAME.js