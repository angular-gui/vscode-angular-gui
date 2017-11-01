const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: "./src/extension.ts",
  output: {
    // Set libraryTarget to load extension
    libraryTarget: 'commonjs',
    filename: "extension.js",
    path: __dirname + "/out",
    // Bundle absolute resource paths in the source-map,
    // so VSCode can match the source file.
    // devtoolModuleFilenameTemplate: '[absolute-resource-path]'  
  },
  target: 'node',
  externals: [ nodeExternals() ],
  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    extensions: [ ".ts", ".js" ],
    modules: [
      // path.resolve('src'),
      path.join(__dirname, 'js'),
      'node_modules',
    ]
  },

  module: {
    rules: [
      // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.ts$/, loader: "awesome-typescript-loader" },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ]
  },
};
