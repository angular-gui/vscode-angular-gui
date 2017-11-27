import { AngularGUI } from '../core/app';
import config from '../core/config';
import { resolve } from 'path';

export function setup(project: string) {
  config[ 'workspaceRoot' ] = resolve(__dirname, project);
  config[ 'extensionRoot' ] = resolve(__dirname, `ext-${ project }`);
  return new AngularGUI(config, () => { });
}

export const versions = [
  { cli: '1-5-4', schematics: '', extension: '' },
];