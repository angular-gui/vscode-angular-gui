import * as helpers from './helpers';

import { basename, join } from 'path';

import { sync as globSync } from 'glob';
import { uniqueFn } from './utils';

/**
 * Exposes file system commands for specific files
 */
export class FilesManager {
  extensionFolder;
  commandsFolder;
  extensionRoot;
  workspaceFolder;
  workspaceRoot;

  constructor(public config) {
    this.workspaceRoot = config.workspaceRoot;
    this.workspaceFolder = join(config.workspaceRoot, config.rootDir);
    this.commandsFolder = join(this.workspaceFolder, 'commands');
    this.extensionRoot = config.extensionRoot;
    this.extensionFolder = join(config.extensionRoot, basename(this.workspaceRoot));
  }

  /**
   * Copy installed project schematics
   * from workspace "node_modules" to extension folder
   * to be able to handle multiple workspaces
   */
  copySchematics(collections: string[]) {
    const copied = collections
      .filter(uniqueFn)
      .filter(collection => collection !== '@schematics/angular-gui')
      .map(name => {
        const folderFrom = join(this.workspaceRoot, 'node_modules', name, '*');
        const folderTo = join(this.extensionFolder, name);
        return helpers.copyFolder(folderFrom, folderTo);
      });

    const folderFrom = this.config.local // DEV ONLY
      ? [
        join(this.extensionRoot, '..', 'schematics', '*'),
        join(this.extensionRoot, '..', 'src', 'schematics', '*') ]
      : join(this.extensionRoot, 'schematics', '*');
    const folderTo = join(this.extensionFolder, '@schematics', 'angular-gui');
    copied.push(helpers.copyFolder(folderFrom, folderTo));

    return Promise.all(copied);
  }

  /**
   * https://github.com/angular/devkit/issues/285
   */
  fixCollectionNames(collections: string[]) {
    const fixed = collections
      .filter(uniqueFn)
      .map(name => {
        return globSync(`${ name }/**/collection.json`, { cwd: this.extensionFolder })[ 0 ]
      })
      .map(collection => join(this.extensionFolder, collection))
      .map((collection, index) =>
        helpers.updateJson(collection, data => ({
          ...data, name: collections[ index ]
        })));
    return Promise.all(fixed);
  }

  createRunnerScript() {
    const script = `script=$1\nshift\nsh ${ this.config.rootDir }/commands/$script.sh $@`;
    const filename = join(this.workspaceFolder, '.runner.sh');
    const packagePath = join(this.workspaceRoot, 'package.json');
    return helpers.writeFile(filename, script)
      .then(() => helpers.updateJson<any>(packagePath, data => {
        const alias = this.config.npmRunner;
        const shouldUpdatePackageJson
          = !data.scripts
          || !(alias in data.scripts)
          || data.scripts[ alias ].includes('.runner.sh');

        if (shouldUpdatePackageJson) {
          const command = `sh ${ this.config.rootDir }/.runner.sh`;
          const scripts = { [ alias ]: command, ...data.scripts };
          return { ...data, scripts };
        } else {
          return data;
        }
      }));
  }

  saveClientConfig(data) {
    const filename = join(this.extensionFolder, '.angular-gui.json');
    return helpers.writeFile(filename, data);
  }

  deleteClientConfig() {
    return helpers.rmdirp(this.extensionFolder);
  }

  saveCommand(name, data) {
    const filename = join(this.commandsFolder, `${ name }.sh`);
    return helpers.writeFile(filename, data);
  }

  deleteCommand(name) {
    const filename = join(this.commandsFolder, `${ name }.sh`);
    return helpers.unlinkp(filename);
  }

  get hasRunnerScript() {
    const filename = join(this.workspaceFolder, '.run.sh');
    return helpers.existsp(filename);
  }

  get cliConfig() {
    const filename = join(this.workspaceRoot, '.angular-cli.json');
    return helpers.readFile(filename);
  }

  get clientConfig() {
    const filename = join(this.extensionFolder, '.angular-gui.json');
    return helpers.readFile(filename);
  }

  get guiCommands() {
    return helpers.readFiles(this.commandsFolder, '*');
  }

  get packageJSON() {
    const offsetLocal = this.config.local ? '..' : ''; // DEV ONLY
    const filename = join(this.extensionRoot, offsetLocal, 'package.json');
    return helpers.readFile(filename);
  }
}
