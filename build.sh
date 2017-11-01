echo "Building extension \"ng-gui\" in watch mode"

concurrently --kill-others \
  "webpack --config webpack.local.js --display minimal -w" \
  "nodemon out/local.js"

# webpack --config webpack.local.js --display minimal