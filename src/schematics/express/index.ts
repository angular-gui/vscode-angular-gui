import { Rule, SchematicContext, Tree, apply, branchAndMerge, chain, filter, mergeWith, move, template, url } from '@angular-devkit/schematics';

function addExpressDependencies() {
  return (host: Tree, context: SchematicContext) => {
    if (!host.exists('package.json')) { return host; }

    const json = JSON.parse(host.read('package.json').toString('utf-8'));

    if (!json[ 'devDependencies' ]) {
      json[ 'devDependencies' ] = {};
    }
    if (!json[ 'devDependencies' ][ 'compression' ]) {
      json[ 'devDependencies' ][ 'compression' ] = 'latest';
    }
    if (!json[ 'devDependencies' ][ 'express' ]) {
      json[ 'devDependencies' ][ 'express' ] = 'latest';
    }
    if (!json[ 'devDependencies' ][ 'connect-history-api-fallback' ]) {
      json[ 'devDependencies' ][ 'connect-history-api-fallback' ] = 'latest';
    }
    if (!json[ 'devDependencies' ][ 'yargs' ]) {
      json[ 'devDependencies' ][ 'yargs' ] = 'latest';
    }
    host.overwrite('package.json', JSON.stringify(json, null, 2));
    return host;
  }
}

function addAngularGuiCommand() {
  return (host: Tree, context: SchematicContext) => {

    return host;
  }
}

export interface ExpressOptions {
  name?: string;
}

export default function (options: ExpressOptions): Rule {
  const scriptSource = apply(url('./files'), [
    filter(path => path.endsWith('.js')),
    template({ ...options }),
    move('./')
  ]);

  const commandSource = apply(url('./files'), [
    filter(path => path.endsWith('.sh')),
    template({ ...options }),
    move('.angular-gui/commands')
  ]);

  return chain([
    addExpressDependencies(),
    branchAndMerge(chain([
      mergeWith(scriptSource),
      mergeWith(commandSource),
    ])),
  ]);
}