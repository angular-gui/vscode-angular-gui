export interface Command {
  description: string;
  name: string;
  options?: Array<{ name: string; value: any; }>;
  process?: {
    pid: number;
    log: string[];
  };
  script: string;
  type: string;
  value: string;
}

export const defaultConfiguration = {
  port: 4300,
  rootDir: '.angular-gui',
  options: {
    environment: [
      'development',
      'production',
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
