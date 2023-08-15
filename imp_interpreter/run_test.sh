#!/bin/bash

TESTS=(test.imp sum.imp gcd.imp even.imp pivot.imp fib.imp)

npx tsc run.ts

for i in ${!TESTS[@]}
do
    node run.js imp_programs/${TESTS[$i]}
done