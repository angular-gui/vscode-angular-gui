module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts*',
      { pattern: 'files/**', load: false },
      { pattern: 'files/sch*/**', ignore: true },
      { pattern: 'files/**/.angular-cli.json', load: false },
      { pattern: 'src/**/*.spec.ts*', ignore: true },
      { pattern: 'src/schematics/**', ignore: true },
    ],
    env: {
      type: 'node'
    },
    filesWithNoCoverageCalculated: [
      'files/**',
      'src/test.ts'
    ],
    tests: [
      'src/**/*.spec.ts*',
      { pattern: 'files/**', ignore: true },
    ],
    testFramework: 'jasmine'
  }
}