const compression = require('compression');
const express = require('express');
const fs = require('fs');
const history = require('connect-history-api-fallback');
const argv = require('yargs').argv;

const path = argv.path || require('./.angular-cli.json').apps.find(app => app.name === argv.app).outDir;
const port = argv.port || 4200;

const app = express();

app.use(history());
app.use(compression());
app.use(express.static(path));

app.listen(port, function () {
  console.log('\n', `Serving "${path}" on http://localhost:${port}. [Ctrl+C] to disconnect.`);
});
