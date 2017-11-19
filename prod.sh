echo "Build extension \"angular-gui\" for production"

rm -rf out schematics
webpack
tsc -p ./tsconfig.schematics.json
cp src/schematics/* schematics
