module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts*',
      { pattern: 'files/**', instrument: false },
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