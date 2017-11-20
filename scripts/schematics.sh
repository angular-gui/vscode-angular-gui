echo "Building schematics for \"angular-gui\" extension"

rm -rf schematics
tsc -p ./tsconfig.schematics.json
cp -r src/schematics/* schematics
rm -rf schematics/**/*.ts schematics/*.ts
