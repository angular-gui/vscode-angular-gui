import { Collection, DryRunEvent, DryRunSink, FileSystemSink, FileSystemTree, SchematicEngine, Tree } from '@angular-devkit/schematics';
import { CollectionCannotBeResolvedException, FileSystemEngineHost, FileSystemHost, FileSystemSchematicDesc, NodeModulesEngineHost } from '@angular-devkit/schematics/tools';
import { camelize, dasherize, terminal } from '@angular-devkit/core';
import { generateCommandDefaults, generateCommandPaths, generateCommandValues } from './options';
import { omitBy, sort } from './utils';

import { Command } from './models';
import { GUI } from './gui.model';
import { existsSync } from 'fs';
import { sync as globSync } from 'glob';
import { join } from 'path';
import { of } from 'rxjs/observable/of';

export class GuiEngineHost extends FileSystemEngineHost {
  constructor(protected _root: string) { super(_root); }

  protected _resolveCollectionPath(name: string): string {
    // Allow `${_root}/${name}.json` as a collection.
    if (existsSync(join(this._root, name + '.json'))) {
      return join(this._root, name + '.json');
    }

    // Allow `${_root}/${name}/collection.json.
    if (existsSync(join(this._root, name, 'collection.json'))) {
      return join(this._root, name, 'collection.json');
    }

    // Allow `${_root}/ ** /${name}/collection.json.
    const collectionJsonPath = globSync(`${ name }/**/collection.json`, {
      cwd: this._root
    })[ 0 ];
    if (collectionJsonPath) {
      return join(this._root, collectionJsonPath);
    }

    throw new CollectionCannotBeResolvedException(name);
  }
}

export class SchematicsManager {
  private _blueprints;
  engine;
  host;

  constructor(
    private cliConfig,
    private collections: string[],
    private workspaceRoot: string,
    private extensionFolder: string) {

    this.host = new GuiEngineHost(this.extensionFolder);
    this.engine = new SchematicEngine(this.host);
    this.host.registerOptionsTransform((schematic: FileSystemSchematicDesc, options: {}) => ({
      ...generateCommandDefaults(schematic, options, this.cliConfig),
      ...generateCommandValues(schematic, options),
      ...generateCommandPaths(schematic, options, this.cliConfig, this.workspaceRoot),
    }));
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
    const engine: SchematicEngine<any, any> = this.engine;
    const collection = engine.createCollection(this.blueprints[ blueprint ]);
    const extended = collection.description.schematics[ blueprint ].extends;
    let schematic = collection.createSchematic(blueprint);

    if (extended) {
      const collection = engine.createCollection(extended.split(':')[ 0 ]);
      schematic = collection.createSchematic(blueprint);
    }

    const { aliases, description, name, schemaJson } = schematic.description;

    return {
      aliases, description, name,
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
          loggingQueue.push(`${ terminal.red('ERROR!') } ${ event.path } ${ desc }.`);
          error = true;
          break;
        case 'update':
          loggingQueue.push(`${ terminal.white('UPDATE') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'create':
          loggingQueue.push(`${ terminal.green('CREATE') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'delete':
          loggingQueue.push(`${ terminal.yellow('DELETE') } ${ event.path }`);
          break;
        case 'rename':
          loggingQueue.push(`${ terminal.blue('RENAME') } ${ event.path } => ${ event.to }`);
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
            ? terminal.yellow('NOTE: Run with "dry run" no changes were made.')
            : null)
          .filter(o => !!o));
  }
}
