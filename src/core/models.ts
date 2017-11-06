export interface Command {
  $exec?: number;
  description: string;
  name: string;
  options?: Array<{ name: string; value: any; }>;
  script: string;
  type: string;
  value: string;
}

export const defaultConfiguration = {
  port: 4300,
  rootDir: '.ng-gui',
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
      'styl',
      'scss',
      'css',
    ]
  }
};
