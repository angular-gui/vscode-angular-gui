import * as Converter from 'ansi-to-html';
import * as commands from '../commands';
import * as express from 'express';
import * as io from 'socket.io';
import * as stoppable from 'stoppable';

import { processAction, processCommand } from './runner';

import { Command } from './models';
import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { Server } from 'http';
import { Subject } from 'rxjs/Subject';
import { sort } from './utils';

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
    this.schematics = new SchematicsManager(this.files.workspaceRoot);
  }

  start(statusUpdate) {
    this.server = stoppable(this.app.listen(this.config.port, () => {
      this.logger(`Listening on localhost:${ this.config.port }...`);
    }), 0);

    this.server.once('listening', () => statusUpdate('listening'));

    this.socket = io(this.server).on('connection', async socket => {
      const { config, collection } = await this.loadConfig();

      this.schematics.collection = collection;
      this.schematics.config = config;

      const clientConfig
        = this.config.local
          // DEV ONLY: rebuild clientConfig when not running from extension
          ? await this.files.deleteClientConfig()
            .then(() => this.rebuild())
            .then(() => this.files.clientConfig)

          : await this.files.clientConfig
          || await this.rebuild()
            .then(() => this.files.clientConfig)

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
    const collection
      = this.schematics.collection
      || (await this.loadConfig()).collection;

    this.config.commandOptions.collection
      = [ collection, '@schematics/angular' ]
        .filter((v, i, a) => a.indexOf(v) === i);

    await this.files.copyCliSchematics(this.config.commandOptions.collection);
    await this.files.copyGuiSchematics();
    await this.files.createRunnerScript();

    this.config.commandOptions.blueprint
      = this.schematics.availableBlueprints(collection)

    const cliSchematics
      = this.config.commandOptions.blueprint
        .map(blueprint =>
          this.schematics.blueprintCommand(collection, blueprint))
        .map(command => this.updateCommandOptions(command));

    const cliCommands
      = Object.values(commands)
        .map(command => this.updateCommandOptions(command));

    return this.files.saveClientConfig({
      cliCommands,
      cliSchematics,
    });
  }

  private async loadConfig() {
    const config = await this.files.cliConfig;
    const collection
      = config.defaults.schematics
        ? config.defaults.schematics.collection
        : '@schematics/angular';
    return { config, collection };
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
//