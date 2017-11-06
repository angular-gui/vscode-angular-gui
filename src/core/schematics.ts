import * as core from '@angular-devkit/core';
import * as path from 'path';
import * as tools from '@angular-devkit/schematics/tools';

import { DryRunEvent, DryRunSink, FileSystemSink, FileSystemTree, Schematic, SchematicEngine, Tree } from '@angular-devkit/schematics';

import { Command } from './models';
import { copyFolder } from './helpers';
import { of } from 'rxjs/observable/of';
import { sort } from './utils';

export class SchematicsManager {
  private host = new tools.NodeModulesEngineHost();
  private engine = new SchematicEngine(this.host);

  constructor(public config) { }

  /**
   * Copy project schematics 
   * from workspace to extension "node_modules"
   * to be able to run schematics with "NodeModulesEngineHost"
   * 
   * NOTE: Cannot use "FileSystemEngineHost" because it cannot
   * resolve `collection.json` properly, for example:
   * 
   *   @nrwl/schematics/  src  /collection.json
   */
  copySchematics(collections: string[]) {
    const copied = collections
      .concat('@schematics/angular')
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(name => {
        const folderFrom = path.join(this.config.workspaceRoot, 'node_modules', name, '*');
        const folderTo = path.join(this.config.extensionRoot, 'node_modules', name);
        return copyFolder(folderFrom, folderTo);
      });

    return Promise.all(copied);
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
            name: core.dasherize(name),
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

  private blueprintDefaults(schematic: tools.FileSystemSchematicDesc) {
    return Object.entries(schematic.schemaJson.properties)
      .filter(([ name, option ]) => option.default)
      .reduce((dict, [ name, option ]) => ({
        ...dict,
        [ name ]: option.default
      }), {});
  }

  private cliConfigDefaults(options, schematic: tools.FileSystemSchematicDesc) {
    const blueprintKeys
      = Object.keys(schematic.schemaJson.properties);

    return options
      .filter(option =>
        !blueprintKeys.includes(core.camelize(option.name)))
      .reduce((dict, [ name, option ]) => ({
        ...dict,
        [ core.camelize(option.name) ]: option.default
      }), {});
  }

  private commandValues(options, schematic: tools.FileSystemSchematicDesc) {
    const blueprintKeys
      = Object.keys(schematic.schemaJson.properties);

    return options
      .filter(option =>
        blueprintKeys.includes(core.camelize(option.name)))
      .reduce((dict, option) => ({
        ...dict,
        [ core.camelize(option.name) ]: option.value
      }), {});
  }

  generateBlueprint(command: Command, socket: SocketIO.Socket, app) {
    const guiOptions = command.options || [];

    const blueprint
      = command.value.replace('ng generate', '').trim();

    const collection
      = (guiOptions.find(o => o.name === 'collection') || {} as any).value
      || this.config.options.collection[ 0 ];

    const dryRun
      = !!(guiOptions.find(o => o.name === 'dry-run') || {} as any).value;

    this.host.registerOptionsTransform((schematic: any, options: {}) => {
      return {
        ...this.blueprintDefaults(schematic),
        ...this.cliConfigDefaults(guiOptions, schematic),
        ...this.commandValues(guiOptions, schematic),
      };
    });

    const engine: SchematicEngine<any, any> = this.engine;
    const _collection = engine.createCollection(collection);
    const schematic = _collection.createSchematic(blueprint);

    app.logger(`Executing command "${ command.value }"`);
    socket.emit('start', true);

    const dryRunSink
      = new DryRunSink(this.config.workspaceRoot, true);
    const fsSink
      = new FileSystemSink(this.config.workspaceRoot, true);
    const fsHost
      = new tools.FileSystemHost(this.config.workspaceRoot);
    const tree$
      = of(new FileSystemTree(fsHost))

    const loggingQueue: string[] = [];

    let error = false;

    dryRunSink.reporter.subscribe((event: DryRunEvent) => {
      switch (event.kind) {
        case 'error':
          const desc = event.description == 'alreadyExist' ? 'already exists' : 'does not exist.';
          loggingQueue.push(`ERROR! ${ event.path } ${ desc }.`);
          error = true;
          break;
        case 'update':
          loggingQueue.push(`${ core.terminal.white('UPDATE') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'create':
          loggingQueue.push(`${ core.terminal.green('CREATE') } ${ event.path } (${ event.content.length } bytes)`);
          break;
        case 'delete':
          loggingQueue.push(`${ core.terminal.yellow('DELETE') } ${ event.path }`);
          break;
        case 'rename':
          loggingQueue.push(`${ core.terminal.blue('RENAME') } ${ event.path } => ${ event.to }`);
          break;
      }
    });

    schematic.call({}, tree$)
      .map((tree: Tree) => Tree.optimize(tree))
      .concatMap((tree: Tree) => {
        return dryRunSink
          .commit(tree)
          .ignoreElements()
          .concat(of(tree));
      })
      .concatMap((tree: Tree) => {
        return dryRun || error
          ? of(tree)
          : fsSink
            .commit(tree)
            .ignoreElements()
            .concat(of(tree));
      })
      .subscribe(() => {
        loggingQueue.forEach(log => app.logger(log));
      }, () => {
        socket.emit('failure', command);
      }, () => socket.emit('finish', command))
    // .subscribe({
    //   error(err: Error) {
    //     console.log(err);

    //     // Add extra processing to output better error messages.
    //     if (err instanceof core.schema.javascript.RequiredValueMissingException) {
    //       logger.fatal('Missing argument on the command line: ' + err.path.split('/').pop());
    //     } else if (err instanceof core.schema.javascript.InvalidPropertyNameException) {
    //       logger.fatal('A non-supported argument was passed: ' + err.path.split('/').pop());
    //     } else {
    //       logger.fatal(err.message);
    //     }
    //     // process.exit(1);
    //   },
    // });

    // return Promise.resolve(true);
  }

}
