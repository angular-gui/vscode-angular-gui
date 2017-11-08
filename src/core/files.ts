import * as helpers from './helpers';

import { join } from 'path';

/**
 * Exposes file system commands for specific files
 */
export class FilesManager {
  commandsFolder;
  extensionFolder;
  extensionRoot;
  schematicsFolder;
  workspaceFolder;
  workspaceRoot;

  constructor(public config) {
    this.workspaceRoot = config.workspaceRoot;
    this.workspaceFolder = join(config.workspaceRoot, config.rootDir);
    this.commandsFolder = join(this.workspaceFolder, 'commands');
    this.schematicsFolder = join(this.workspaceFolder, 'schematics');
    this.extensionRoot = config.extensionRoot;
    this.extensionFolder = join(config.extensionRoot, config.rootDir);
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
        const folderTo = join(this.extensionRoot, 'node_modules', name);
        return helpers.copyFolder(folderFrom, folderTo);
      });

    return Promise.all(copied);
  }

  copyGuiSchematics() {
    const folderFrom = join(this.schematicsFolder, '*');
    const folderTo = join(this.extensionRoot, 'node_modules', this.config.rootDir);
    return helpers.copyFolder(folderFrom, folderTo);
  }

  createRunnerScript() {
    const data = `script=$1\nshift\nsh ${ this.commandsFolder }/$script.sh $@`;
    const filename = join(this.workspaceFolder, '.run.sh');
    return helpers.writeFile(filename, data);
  }

  saveClientConfig(data) {
    const filename = join(this.extensionRoot, '.angular-gui.json');
    return helpers.writeFile(filename, data);
  }

  deleteClientConfig() {
    const filename = join(this.extensionRoot, '.angular-gui.json');
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
    const filename = join(this.extensionRoot, '.angular-gui.json');
    return helpers.readFile(filename);
  }

  get guiCommands() {
    return helpers.readFiles(this.commandsFolder, '*');
  }
}
