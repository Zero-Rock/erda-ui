#!/bin/bash
cd ../../core
echo 当前目录: $(pwd)

echo install dependence for core

npm install

cd ../shell

echo 当前目录: $(pwd)

echo install dependence for core

npm install

npm run test

cp -R ./coverage ../coverage