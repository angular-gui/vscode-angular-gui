import * as helpers from './helpers';

import { join } from 'path';

/**
 * Exposes file system commands for specific files
 */
export class FilesManager {
  workspaceRoot;
  extensionRoot;
  commandsFolder;
  workspaceFolder;

  constructor(config) {
    this.workspaceRoot = config.workspaceRoot;
    this.workspaceFolder = join(config.workspaceRoot, config.rootDir);
    this.commandsFolder = join(this.workspaceFolder, 'commands');
    this.extensionRoot = config.extensionRoot;
  }

  createRunnerScript() {
    const data = `script=$1\nshift\nsh ${ this.commandsFolder }/$script.sh $@`;
    const filename = `${ this.workspaceFolder }/.run.sh`;
    return helpers.writeFile(filename, data);
  }

  saveClientConfig(data) {
    const filename = `${ this.extensionRoot }/.angular-gui.json`;
    return helpers.writeFile(filename, data);
  }

  deleteClientConfig() {
    const filename = `${ this.extensionRoot }/.angular-gui.json`;
    return helpers.unlinkp(filename);
  }

  saveCommand(name, data) {
    const filename = `${ this.commandsFolder }/${ name }.sh`;
    return helpers.writeFile(filename, data);
  }

  deleteCommand(name) {
    const filename = `${ this.commandsFolder }/${ name }.sh`;
    return helpers.unlinkp(filename);
  }

  get hasRunnerScript() {
    const filename = `${ this.workspaceFolder }/.run.sh`;
    return helpers.existsp(filename);
  }

  get cliConfig() {
    const filename = `${ this.workspaceRoot }/.angular-cli.json`;
    return helpers.readFile(filename);
  }

  get clientConfig() {
    const filename = `${ this.extensionRoot }/.angular-gui.json`;
    return helpers.readFile(filename);
  }

  get guiCommands() {
    return helpers.readFiles(this.commandsFolder, '*');
  }

  //#region TODO: delete
  // get ngSchematics() {
  //   return readFile(`${ this.workspaceRoot }/node_modules/@schematics/angular/collection.json`);
  // }

  // getCollection(collection) {
  //   return readFiles(`${ this.workspaceRoot }/node_modules/${ collection }`, '**/collection.json')
  //     .then(data => data
  //       ? data[ 0 ][ 'collection.json' ]
  //       : data)
  //     .then(data => data
  //       ? this.processSchematics({ collection, ...data })
  //       : data)
  // }

  // private unwrapExtends(data, base) {
  //   if (!data.extends || data.schema) { return data; }

  //   const [ collection, name ] = data.extends.split(':');
  //   return { ...data, ...base.schematics[ name ] };
  // }

  // private unwrapSchema(collection, name) {
  //   const collectionFolder
  //     = `${ this.workspaceRoot }/node_modules/${ collection }`;

  //   const defaultFolder
  //     = `${ this.workspaceRoot }/node_modules/@schematics/angular`;

  //   return readFiles(collectionFolder, `**/${ name }/schema.json`)
  //     .then(data => data.length
  //       ? data
  //       : readFiles(defaultFolder, `**/${ name }/schema.json`))
  //     .then(data => data
  //       ? data[ 0 ][ 'schema.json' ]
  //       : data);
  // }

  // private async processSchematics(meta) {
  //   const baseCollections
  //     = Object.entries(meta.schematics)
  //       .filter(([ name, config ]) => config.extends)
  //       .map(([ name, config ]) =>
  //         [ name, config.extends.split(':')[ 0 ] ])
  //       .map(([ name, schematics ]) => [ name, schematics
  //         ? this.getCollection(schematics)
  //         : null ])
  //       .map(([ name, promise ]) =>
  //         promise.then(data => ({ name, data })))

  //   const baseCollectionsMap
  //     = (await Promise.all(baseCollections))
  //       .reduce((dict, { name, data }) =>
  //         ({ ...dict, [ name ]: data }), {})

  //   const unwrapExtends
  //     = Object.entries(meta.schematics)
  //       .reduce((dict, [ name, config ]) =>
  //         ({ ...dict, [ name ]: this.unwrapExtends(config, baseCollectionsMap[ name ]) }), {});

  //   const unwrapSchema
  //     = Object.entries(unwrapExtends)
  //       .map(([ name, config ]) =>
  //         [ name, this.unwrapSchema(meta.collection, name) ])
  //       .map(([ name, promise ]: any) =>
  //         promise.then(data => ({ name, data })))

  //   const schematics
  //     = (await Promise.all(unwrapSchema))
  //       .reduce((dict, { name, data }) =>
  //         ({ ...dict, [ name ]: data }), {})

  //   return { ...meta, schematics };
  // }
  //#endregion
}
