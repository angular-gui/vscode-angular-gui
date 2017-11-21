import { Rule, SchematicContext, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, template, url } from '@angular-devkit/schematics';

import { exec } from 'child_process';
import { sortKeys } from '../utils';

const packages = [
  'compression',
  'connect-history-api-fallback',
  'express',
  'yargs'
];

function addDependencies() {
  return (host: Tree, context: SchematicContext) => {
    if (!host.exists('package.json')) { return host; }

    const json = JSON.parse(host.read('package.json').toString('utf-8'));

    if (!json[ 'devDependencies' ]) {
      json[ 'devDependencies' ] = {};
    }

    packages.forEach(name => {
      if (!json[ 'devDependencies' ][ name ]) {
        json[ 'devDependencies' ][ name ] = '*';
      }
    });

    json[ 'devDependencies' ]
      = sortKeys(json[ 'devDependencies' ]);

    host.overwrite('package.json', JSON.stringify(json, null, 2));
    return host;
  }
}

function installDependencies(options: ExpressOptions) {
  return (host: Tree, context: SchematicContext) => {
    if (options.npmInstall) {
      const installed
        = packages.every(name =>
          host.exists(`node_modules/${ name }/package.json`));

      if (!installed) {
        exec('npm install', { cwd: host[ '_host' ][ '_root' ] });
      }
    }
    return host;
  }
}

interface ExpressOptions {
  name: string;
  npmInstall: boolean;
  port: number;
  rootDir: string;
}

export default function (options: ExpressOptions): Rule {
  const scriptSource = apply(url('./files'), [
    filter(path => path.endsWith('.js')),
    template({ ...options }),
    move(options.rootDir)
  ]);

  const commandSource = apply(url('./files'), [
    filter(path => path.endsWith('.sh')),
    template({ ...options }),
    move(`${ options.rootDir }/commands`)
  ]);

  return chain([
    addDependencies(),
    branchAndMerge(chain([
      mergeWith(scriptSource),
      mergeWith(commandSource),
    ])),
    installDependencies(options)
  ]);
}