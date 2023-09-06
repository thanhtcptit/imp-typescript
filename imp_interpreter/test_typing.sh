#!/bin/bash

TESTS=(test.imp add.imp sum.imp gcd.imp even.imp pivot.imp fib.imp)

npx tsc --downlevelIteration typing.ts

for i in ${!TESTS[@]}
do
    node typing.js imp_programs/${TESTS[$i]}
done
