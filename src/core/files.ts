import {
   basename,
   copyFolder,
   existsSync,
   join,
   readFile,
   readFiles,
   rmdirp,
   unlinkp,
   updateJson,
   writeFile
} from './helpers';

import { uniqueFn } from './utils';

/**
 * Exposes file system commands for specific files
 */
export class FilesManager {
  extensionFolder;
  commandsFolder;
  extensionRoot;
  schematicsFolder;
  workspaceFolder;
  workspaceRoot;

  constructor(private config) {
    this.extensionRoot = this.config.extensionRoot;
    this.workspaceRoot = this.config.workspaceRoot;

    this.extensionFolder = join(this.extensionRoot, basename(this.workspaceRoot));
    this.workspaceFolder = join(this.workspaceRoot, this.config.rootDir);
    this.commandsFolder = join(this.workspaceFolder, 'commands');
    this.schematicsFolder = join(this.workspaceFolder, 'schematics');
  }

  /**
   * Copy installed project schematics
   * from workspace "node_modules" to extension folder
   * to be able to handle multiple workspaces
   */
  copyProjectSchematics(collections: string[]) {
    const copied = collections
      .filter(uniqueFn)
      .filter(collection => collection !== '@schematics/angular-gui')
      .map(name => {
        const folderFrom = join(this.workspaceRoot, 'node_modules', name, '*');
        const folderTo = join(this.extensionFolder, name);
        return copyFolder(folderFrom, folderTo);
      });

    const folderFrom
      = this.config.local
        ? join(this.extensionRoot, '..', 'schematics', '*') // DEV ONLY
        : join(this.extensionRoot, 'schematics', '*');
    const folderTo = join(this.extensionFolder, '@schematics', 'angular-gui');
    copied.push(copyFolder(folderFrom, folderTo));

    return Promise.all(copied);
  }

  /**
   * Copy schematics modified by user
   * from gui schematics folder to extension folder
   * to be able to use them in client app
   */
  copyUserSchematics() {
    const folderFrom = join(this.schematicsFolder, '*');
    const folderTo = this.extensionFolder;
    return copyFolder(folderFrom, folderTo);
  }

  createRunnerScript() {
    const script = `script=$1\nshift\nsh ${ this.config.rootDir }/commands/$script.sh $@`;
    const filename = join(this.workspaceFolder, '.runner.sh');
    const packagePath = join(this.workspaceRoot, 'package.json');
    return writeFile(filename, script)
      .then(() => updateJson<any>(packagePath, data => {
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
    return writeFile(filename, data);
  }

  deleteClientConfig() {
    return rmdirp(this.extensionFolder);
  }

  saveCommand(name, data) {
    const filename = join(this.commandsFolder, `${ name }.sh`);
    return writeFile(filename, data);
  }

  deleteCommand(name) {
    const filename = join(this.commandsFolder, `${ name }.sh`);
    return unlinkp(filename);
  }

  get hasRunnerScript() {
    const filename = join(this.workspaceFolder, '.runner.sh');
    return existsSync(filename);
  }

  get cliConfig() {
    const filename = join(this.workspaceRoot, '.angular-cli.json');
    return readFile(filename);
  }

  get clientConfig() {
    const filename = join(this.extensionFolder, '.angular-gui.json');
    return readFile(filename);
  }

  get guiCommands() {
    return readFiles(this.commandsFolder, '*');
  }

  get packageJSON() {
    const filename
      = this.config.local
        ? join(this.extensionRoot, '..', 'package.json') // DEV ONLY
        : join(this.extensionRoot, 'package.json');
    return readFile(filename);
  }
}
