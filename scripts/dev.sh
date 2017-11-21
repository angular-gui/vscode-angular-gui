echo "Building extension \"angular-gui\" in watch mode"

sh scripts/schematics.sh

concurrently --kill-others \
  "webpack --config webpack.local.js --display minimal -w" \
  "tsc -p ./tsconfig.schematics.json --watch" \
  "nodemon out/local.js"
