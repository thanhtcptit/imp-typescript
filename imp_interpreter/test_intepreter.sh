#!/bin/bash

TESTS=(test.imp add.imp sum.imp gcd.imp even.imp pivot.imp fib.imp)

npx tsc intepreter.ts

for i in ${!TESTS[@]}
do
    node intepreter.js imp_programs/${TESTS[$i]}
done