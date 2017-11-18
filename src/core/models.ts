export interface Command {
  description: string;
  name: string;
  options?: Array<{ name: string; value: any; }>;
  pid: number;
  script: string;
  type: string;
  value: string;
}

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
      '@schematics/angular-gui',
    ],
    styleext: [
      'scss',
      'styl',
      'css',
    ]
  }
};
