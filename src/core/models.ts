export const rootDir = '.ng-gui';

export const config = {
  environment: [
    'production',
    'development'
  ],
  port: 4300,
  rootDir,
  target: [
    'production',
    'development'
  ]
};

export interface Command {
  name: string;
  value: string;
  type: string;
  options: { [ key: string ]: string };
}
