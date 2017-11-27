export default {
  port: 4300,
  rootDir: '.angular-gui',
  npmRunner: '.',
  commands: [
    'build',
    'e2e',
    'generate',
    'lint',
    'serve',
    'shell',
    'test',
    'xi18n',
  ],
  commandOptions: {
    environment: [
      'dev',
      'prod',
    ],
    target: [
      'development',
      'production',
    ],
    collection: [
      '@schematics/angular',
    ],
    styleext: [
      'scss',
      'styl',
      'css',
    ]
  }
};
