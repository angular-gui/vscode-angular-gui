export const defaultConfiguration = {
  port: 4300,
  rootDir: '.angular-gui',
  npmRunner: '.',
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
