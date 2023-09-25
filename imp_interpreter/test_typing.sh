#!/bin/bash

TESTS=( fib.imp gcd.imp fst.imp compare.imp)

npx tsc --downlevelIteration typing.ts

for i in ${!TESTS[@]}
do
    node typing.js imp_programs/${TESTS[$i]}
done
