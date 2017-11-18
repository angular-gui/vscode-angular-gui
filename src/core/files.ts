import * as helpers from './helpers';

import { basename, join } from 'path';

/**
 * Exposes file system commands for specific files
 */
export class FilesManager {
  clientConfigFolder;
  commandsFolder;
  extensionRoot;
  workspaceFolder;
  workspaceRoot;

  constructor(public config) {
    this.workspaceRoot = config.workspaceRoot;
    this.workspaceFolder = join(config.workspaceRoot, config.rootDir);
    this.commandsFolder = join(this.workspaceFolder, 'commands');
    this.extensionRoot = config.extensionRoot;
    this.clientConfigFolder = join(config.extensionRoot, basename(this.workspaceRoot));
  }

  /**
   * Copy installed project schematics
   * from workspace to extension "node_modules"
   * to be able to run schematics with "NodeModulesEngineHost"
   *
   * NOTE: Cannot use "FileSystemEngineHost" because it cannot
   * resolve `collection.json` properly, for example:
   *
   *   @nrwl/schematics/  src  /collection.json
   */
  copyCliSchematics(collections: string[]) {
    const copied = collections
      .concat('@schematics/angular')
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(name => {
        const folderFrom = join(this.workspaceRoot, 'node_modules', name, '*');
        const offsetLocal = this.config.local ? '..' : '';
        const folderTo = join(this.extensionRoot, offsetLocal, 'node_modules', name);
        return helpers.copyFolder(folderFrom, folderTo);
      });

    return Promise.all(copied);
  }

  copyGuiSchematics() {
    const offsetLocal = this.config.local ? '..' : '';
    const folderFrom = join(this.extensionRoot, offsetLocal, 'schematics', '*');
    const folderTo = join(this.extensionRoot, offsetLocal, 'node_modules', '@schematics', 'angular-gui');
    return helpers.copyFolder(folderFrom, folderTo);
  }

  createRunnerScript() {
    const script = `script=$1\nshift\nsh ${ this.config.rootDir }/commands/$script.sh $@`;
    const filename = join(this.workspaceFolder, '.runner.sh');
    const packagePath = join(this.workspaceRoot, 'package.json');
    return helpers.writeFile(filename, script)
      .then(() => helpers.updateJson<any>(packagePath, data => {
        const alias = this.config.npmRunner;
        const shouldUpdate
          = !data.scripts
          || !(alias in data.scripts)
          || data.scripts[ alias ].includes('.runner.sh');

        if (shouldUpdate) {
          const command = `sh ${ this.config.rootDir }/.runner.sh`;
          const scripts = { [ alias ]: command, ...data.scripts };
          return { ...data, scripts };
        }
      }));
  }

  saveClientConfig(data) {
    const filename = join(this.clientConfigFolder, '.angular-gui.json');
    return helpers.writeFile(filename, data);
  }

  deleteClientConfig() {
    const filename = join(this.clientConfigFolder, '.angular-gui.json');
    return helpers.unlinkp(filename);
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
    const filename = join(this.clientConfigFolder, '.angular-gui.json');
    return helpers.readFile(filename);
  }

  get guiCommands() {
    return helpers.readFiles(this.commandsFolder, '*');
  }

  get packageJSON() {
    const offsetLocal = this.config.local ? '..' : '';
    const filename = join(this.extensionRoot, offsetLocal, 'package.json');
    return helpers.readFile(filename);
  }
}
