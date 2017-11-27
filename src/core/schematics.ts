//#region Imports

import {
  Collection,
  DryRunEvent,
  DryRunSink,
  FileSystemSink,
  FileSystemTree,
  SchematicEngine,
  Tree
} from '@angular-devkit/schematics';
import {
  FileSystemHost,
  FileSystemSchematicDesc,
  NodeModulesEngineHost
} from '@angular-devkit/schematics/tools';
import { camelize, dasherize, sort, terminal } from './utils';
import { copyFolder, dirname, existsSync, join, writeFile } from './helpers';
import {
  generateCommandDefaults,
  generateCommandPaths,
  generateCommandValues
} from './options';

import { Command } from './command.interface';
import { MESSAGE } from './messages';
import { of } from 'rxjs/observable/of';

//#endregion

export class SchematicsManager {
  private _blueprints;
  engine;
  host;

  constructor(
    public collections: string[],
    private cliConfig,
    private workspaceRoot: string,
    private workspaceSchematicsFolder: string) {

    this.host = new NodeModulesEngineHost();
    this.engine = new SchematicEngine(this.host);
    this.host.registerOptionsTransform((schematic: FileSystemSchematicDesc, options: {}) => {
      const transformed = {
        ...generateCommandDefaults(schematic, options, this.cliConfig),
        ...generateCommandValues(schematic, options),
        ...generateCommandPaths(schematic, options, this.cliConfig, this.workspaceRoot),
      };
      console.log('TRANSFORMED:', schematic.name, transformed);
      return transformed;
    });
  }

  /**
   * Available schematics for all collections.
   */
  get blueprints() {
    return this._blueprints
      ? this._blueprints
      : this._blueprints = this.collections
        .map(collection => this.engine.createCollection(collection))
        .map(collection =>
          this.host.listSchematics(collection)
            .map(blueprint =>
              ({ [ blueprint ]: collection.description.name })))
        .reduce((acc, list) => [ ...acc, ...list ], [])
        .reduce((acc, list) => ({ ...list, ...acc }), {});
  }

  /**
   * Normalize schematic to CLI Command interface
   *
   * @param blueprint Name of the blueprint
   *
   */
  blueprintCommand(blueprint: string) {
    const collection
      = this.engine.createCollection(this.blueprints[ blueprint ]) as Collection<any, any>;
    const extended
      = collection.description.schematics[ blueprint ].extends;
    let schematic = collection.createSchematic(blueprint);

    if (extended) {
      const collection
        = this.engine.createCollection(extended.split(':')[ 0 ]) as Collection<any, any>;
      schematic = collection.createSchematic(blueprint);
    }

    const { aliases, description, name, schemaJson } = schematic.description;
    const modified
      = existsSync(join(this.workspaceSchematicsFolder, blueprint));

    return {
      aliases, description, name, modified,
      collection: schematic.collection.description.name,
      availableOptions: Object.entries(schemaJson.properties)
        .map(([ name, options ]) => {
          return {
            name: dasherize(name),
            aliases: options.alias
              ? [ options.alias ]
              : [],
            default: options.default,
            description: options.description,
            required: schemaJson.required
              ? schemaJson.required.includes(name)
              : false,
            type: options.type,
            values: options.enum
          }
        }).sort(sort('asc', o => o.name)),
    };
  }

  /**
   * Copy schematic files to workspace rootDir
   * to allow users to modify them
   * 
   * @param command `command.payload` is name of the blueprint
   */
  cloneSchematic(command: Command, files: string | false = 'files') {
    const blueprint
      = command.payload;
    const collection
      = this.engine.createCollection(this.blueprints[ blueprint ]) as Collection<any, any>;
    const schematic
      = collection.createSchematic(blueprint);
    const folderFrom
      = join(dirname(schematic.description.path), files ? files : '');
    const folderTo
      = join(this.workspaceSchematicsFolder, files ? blueprint : '');
    const message
      = `${ terminal.green('COPY ') } ${ folderTo }\n`
      + MESSAGE.SCHEMATIC_CLONE(blueprint);

    return copyFolder(folderFrom, folderTo)
      .then(() => {
        const filepath = join(folderTo, '.changes.json');
        const path
          = dirname(schematic.description.path)
            .split('node_modules')
            .pop()
            .replace(/^(\\|\/)/, '');

        // TODO: Figure out a good way to delete stuff from original schematic...

        return writeFile(filepath, { path });
      })
      .then(() => message);
  }

  generateBlueprint(command: Command) {
    const blueprint
      = command.value.replace('ng generate', '').trim();
    const collection
      = this.engine.createCollection(this.blueprints[ blueprint ]) as Collection<any, any>;
    const schematic
      = collection.createSchematic(blueprint);

    const loggingQueue: string[] = [];
    let error = false;

    const dryRunSink = new DryRunSink(this.workspaceRoot, true);
    const fsSink = new FileSystemSink(this.workspaceRoot, true);
    const fsHost = new FileSystemHost(this.workspaceRoot);
    const tree$ = of(new FileSystemTree(fsHost));

    dryRunSink.reporter.forEach((event: DryRunEvent) => {
      switch (event.kind) {
        case 'error':
          const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist.';
          loggingQueue.push(`${ terminal.red('ERROR! ') } ${ event.path } ${ desc }.`);
          error = true;
          break;
        case 'update':
          loggingQueue.push(`${ terminal.white('UPDATE ') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'create':
          loggingQueue.push(`${ terminal.green('CREATE ') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'delete':
          loggingQueue.push(`${ terminal.yellow('DELETE ') } ${ event.path }`);
          break;
        case 'rename':
          loggingQueue.push(`${ terminal.blue('RENAME ') } ${ event.path } => ${ event.to }`);
          break;
      }
    });

    const options: any
      = (command.options || [])
        .reduce((dict, option) => ({
          ...dict,
          [ camelize(option.name) ]: option.value
        }), {});

    return schematic.call(options, tree$)
      .map((tree: Tree) => Tree.optimize(tree))
      .concatMap((tree: Tree) => {
        return dryRunSink
          .commit(tree)
          .ignoreElements()
          .concat(of(tree));
      })
      .concatMap((tree: Tree) => {
        return options.dryRun
          || error
          ? of(tree)
          : fsSink
            .commit(tree)
            .ignoreElements()
            .concat(of(tree));
      })
      .map(() =>
        loggingQueue
          .concat(options.dryRun
            ? terminal.yellow(MESSAGE.DRY_RUN)
            : null)
          .filter(o => !!o));
  }
}
