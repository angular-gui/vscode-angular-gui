import * as Converter from 'ansi-to-html';
import * as commands from '../commands';
import * as express from 'express';
import * as io from 'socket.io';
import * as stoppable from 'stoppable';

import { processAction, processCommand } from './runner';
import { sort, uniqueFn } from './utils';

import { Command } from './models';
import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { Server } from 'http';
import { Subject } from 'rxjs/Subject';

export class AngularGUI {
  private app;
  action = new Subject();
  converter = new Converter();
  files: FilesManager;
  server;
  schematics: SchematicsManager;
  socket;

  constructor(public config, public logger) {
    this.app = express().get('/', (req, res) => res.sendStatus(202));
    this.files = new FilesManager(config);
  }

  start(statusUpdate) {
    this.server = stoppable(this.app.listen(this.config.port, () => {
      this.logger(`Listening on localhost:${ this.config.port }...`);
    }), 0);

    this.server.once('listening', () => statusUpdate('listening'));

    this.socket = io(this.server).on('connection', async socket => {
      const { config, collections } = await this.loadConfig();

      const clientConfig
        = this.config.local
          // DEV ONLY: rebuild clientConfig when not running from extension
          ? await this.files.deleteClientConfig()
            .then(() => this.rebuild())
            .then(() => this.files.clientConfig)

          : await this.files.clientConfig
          || await this.rebuild()
            .then(() => this.files.clientConfig)

      if (!this.schematics) {
        this.initializeSchematics(config, collections);
      }

      const guiCommands
        = await this.files.guiCommands;

      const guiConfig = {
        ...this.config,
        runner: await this.files.hasRunnerScript,
      };

      const VERSION
        = (await this.files.packageJSON).version;

      const configuration
        = { ...clientConfig, cliConfig: config, guiCommands, guiConfig, VERSION };

      socket.emit('init', configuration);

      socket.on('action', (command: Command) =>
        processAction(command, socket, this));

      socket.on('command', (command: Command) =>
        processCommand(command, socket, this));

      socket.on('disconnect', socket => {
        this.logger(`Client disconnected.`);
      });
    });

    this.socket.on('connection', socket => {
      this.logger(`Client connected from ${ socket.handshake.headers.origin }.`);
      statusUpdate('connected');
    });

    this.socket.on('disconnect', socket => {
      this.logger(`Server terminated`);
      statusUpdate('listening');
    });

    return this.action.asObservable();
  }

  stop(statusUpdate) {
    this.server.once('close', () => statusUpdate('disconnected'));
    this.server.stop();
  }

  /**
   * Create `.angular-gui.json` to be used as configuration for client.
   *
   * Rebuilding is done when `.angular-gui.json` does not exist,
   * or manually via extension command `extension.rebuildConfiguration`
   */
  async rebuild() {
    this.logger('Rebuilding Schematics and updating Client Configuration...');

    const { config, collections } = await this.loadConfig();

    await this.files.copySchematics(collections)
      .then(() => this.files.fixCollectionNames(collections))
      .then(() => this.files.createRunnerScript())
      .then(() => this.initializeSchematics(config, collections));

    this.config.commandOptions.collection
      = collections;

    this.config.commandOptions.blueprint
      = Object.keys(this.schematics.blueprints);

    console.log(this.schematics.blueprints);

    const cliSchematics
      = this.config.commandOptions.blueprint
        .map(blueprint =>
          this.schematics.blueprintCommand(blueprint))
        .map(command => this.updateCommandOptions(command));

    const cliCommands
      = Object.values(commands)
        .map(command => this.updateCommandOptions(command));

    return this.files
      .saveClientConfig({ cliCommands, cliSchematics, })
      .then(data => { this.logger('Rebuilding complete.'); return data; })
  }

  private initializeSchematics(config, collections) {
    this.schematics = new SchematicsManager();
    this.schematics.collections = collections;
    this.schematics.config = config;
    this.schematics.workspaceRoot = this.files.workspaceRoot;
    this.schematics.extensionFolder = this.files.extensionFolder;
    this.schematics.initialize();
  }

  private async loadConfig() {
    const config = await this.files.cliConfig;
    const defaultCollection
      = config.defaults.schematics
        ? config.defaults.schematics.collection
        : '@schematics/angular';

    const collections
      = [ defaultCollection, ...this.config.commandOptions.collection ]
        .concat('@schematics/angular-gui')
        .filter(uniqueFn);
    return { config, collections };
  }

  /**
   * Updates CLI Command "avaibaleOptions" with values from config,
   * and sets option "default" to first item from config array.
   *
   * For example:
   *
   *   config.commandOptions.target: [
   *     'development',
   *     'production',
   *   ]
   *
   * will be used for commands that have `target` option,
   * like "build", "serve", "test"
   * and default value will be "development"
   */
  private updateCommandOptions(command) {
    const availableOptions
      = command.availableOptions
        .map(option =>
          !(option.name in this.config.commandOptions)
            ? option
            : ({
              ...option,
              values: this.config.commandOptions[ option.name ],
              default: this.config.commandOptions[ option.name ][ 0 ],
            }))

    return { ...command, availableOptions };
  }
}
