#!/bin/bash

TESTS=(id.imp)

npx tsc intepreter.ts

for i in ${!TESTS[@]}
do
    node intepreter.js imp_programs/${TESTS[$i]}
done