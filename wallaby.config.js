module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts*',
      { pattern: 'src/test/**/*', load: false },
      { pattern: 'src/test/**/.angular-cli.json', load: false },
      { pattern: 'src/**/*.spec.ts*', ignore: true },
      { pattern: 'src/schematics/**', ignore: true },
    ],
    env: {
      type: 'node'
    },
    filesWithNoCoverageCalculated: [
      'src/test',
    ],
    tests: [
      'src/**/*.spec.ts*',
      { pattern: 'src/test/**', ignore: true },
    ],
    testFramework: 'jasmine'
  }
}