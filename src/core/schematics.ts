import { DryRunEvent, DryRunSink, FileSystemSink, FileSystemTree, SchematicEngine, Tree } from '@angular-devkit/schematics';
import { FileSystemHost, FileSystemSchematicDesc, NodeModulesEngineHost } from '@angular-devkit/schematics/tools';
import { camelize, dasherize, terminal } from '@angular-devkit/core';
import { generateCommandDefaults, generateCommandPaths, generateCommandValues } from './options';
import { omitBy, sort } from './utils';

import { Command } from './models';
import { GUI } from './gui.model';
import { join } from 'path';
import { of } from 'rxjs/observable/of';

export class SchematicsManager {
  // private tree$;
  host = new NodeModulesEngineHost();
  engine = new SchematicEngine(this.host);
  config;
  collection;

  constructor(private rootDir: string) {
    this.host.registerOptionsTransform((schematic: FileSystemSchematicDesc, options: {}) => {
      const transformed = {
        ...generateCommandDefaults(schematic, options, this.config),
        ...generateCommandValues(schematic, options),
        ...generateCommandPaths(schematic, options, this.config, this.rootDir),
      };

      console.log(`registerOptionsTransform`, transformed);
      return transformed;
    });
  }

  /**
   * List available schematics for the collection.
   *
   * @param collection Name of the collection
   */
  availableBlueprints(collection: string) {
    const _collection = this.engine.createCollection(collection);
    return this.host.listSchematics(_collection)
      .sort(sort('asc'));
  }

  /**
   * Normalize schematic to CLI Command interface
   *
   * @param collection Name of the collection
   * @param blueprint Name of the blueprint
   *
   */
  blueprintCommand(collection: string, blueprint: string) {
    const engine: SchematicEngine<any, any> = this.engine;
    const _collection = engine.createCollection(collection);
    const extended = _collection.description.schematics[ blueprint ].extends;
    let schematic = _collection.createSchematic(blueprint);

    if (extended) {
      const _collection = engine.createCollection(extended.split(':')[ 0 ]);
      schematic = _collection.createSchematic(blueprint);
    }

    const { aliases, description, name, schemaJson } = schematic.description

    return {
      aliases, description, name,
      collection: schematic.collection.description.name,
      availableOptions: Object.entries(schemaJson.properties)
        .map(([ name, options ]) => {
          return {
            name: dasherize(name),
            aliases: [ options.alias ],
            default: options.default,
            description: options.description,
            required: schemaJson.required.includes(name),
            type: options.type,
            values: options.enum
          }
        }).sort(sort('asc', o => o.name)),
    };
  }

  generateBlueprint(command: Command) {
    const options: any
      = (command.options || [])
        .reduce((dict, option) => ({
          ...dict,
          [ camelize(option.name) ]: option.value
        }), {});

    const blueprint
      = command.value.replace('ng generate', '').trim();

    const collection
      = options.collection
      || this.collection;

    const engine: SchematicEngine<any, any> = this.engine;
    const _collection = engine.createCollection(collection);
    const schematic = _collection.createSchematic(blueprint);

    const loggingQueue: string[] = [];
    let error = false;

    const dryRunSink = new DryRunSink(this.rootDir, true);
    const fsSink = new FileSystemSink(this.rootDir, true);
    const fsHost = new FileSystemHost(this.rootDir);
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
      .map(() => loggingQueue.concat(options.dryRun
        ? terminal.yellow('NOTE: Run with "dry run" no changes were made.')
        : null).filter(o => !!o));
  }
}
