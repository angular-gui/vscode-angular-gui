sh scripts/schematics.sh

echo "Bundling code for \"angular-gui\" extension"
rm -rf out
webpack --display minimal
