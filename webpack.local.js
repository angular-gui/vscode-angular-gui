const base = require('./webpack.config');

module.exports = {
  ...base,
  entry: "./src/local.ts",
  output: {
    ...base.output,
    filename: "local.js",
  },
};
