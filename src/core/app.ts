import * as commands from '../commands';
import * as express from 'express';
import * as io from 'socket.io';
import * as stoppable from 'stoppable';

import { processAction, processCommand } from './runner';

import { Command } from './models';
import { FilesManager } from './files';
import { OutputChannel } from 'vscode';
import { SchematicsManager } from './schematics';
import { Server } from 'http';
import { sort } from './utils';

export class AngularGUI {
  app; cli; fm: FilesManager; server; sm: SchematicsManager; socket;

  constructor(public config, public logger) {
    this.app = express().get('/', (req, res) => res.sendStatus(202));
    this.fm = new FilesManager(config);
    this.sm = new SchematicsManager(config);
  }

  start(cb) {
    this.server = stoppable(this.app.listen(this.config.port, () => {
      this.logger(`Listening on localhost:${ this.config.port }`);
    }), 0);

    this.server.once('listening', () => cb(null));

    this.socket = io(this.server).on('connection', async socket => {

      const clientConfig
        = !this.config.extensionRoot.includes('extensions')
          ? await this.fm.deleteClientConfig()
            .then(() => this.rebuild())
            .then(() => this.fm.clientConfig)

          // DEV ONLY: rebuild clientConfig when running from local.ts
          : await this.fm.clientConfig
          || await this.rebuild()
            .then(() => this.fm.clientConfig)

      const guiCommands
        = await this.fm.guiCommands;

      const guiConfig = {
        ...this.config,
        runner: await this.fm.hasRunnerScript,
      };

      this.cli = clientConfig.cliCollection;

      socket.emit('init', { ...clientConfig, guiCommands, guiConfig });

      socket.on('action', (command: Command) =>
        processAction(command, socket, this));

      socket.on('command', (command: Command) =>
        processCommand(command, socket, this));

      socket.on('disconnect', socket => {
        this.logger(`Client disconnected`);
      });
    });

    this.socket.on('connection', socket => {
      this.logger(`Client connected from ${ socket.handshake.headers.origin }`);
      cb(true);
    });

    this.socket.on('disconnect', socket => {
      this.logger(`Server terminated`);
      cb(null);
    });
  }

  stop(cb) {
    this.server.once('close', () => cb(false));
    this.server.stop();
  }

  /**
   * Create `.angular-gui.json` to be used as configuration for client.
   * 
   * Rebuilding is done when `.angular-gui.json` does not exist,
   * or manually via extension command `extension.rebuildConfiguration`
   */
  async rebuild() {
    const cliConfig = await this.fm.cliConfig;

    const cliCollection
      = cliConfig.defaults.schematics
        ? cliConfig.defaults.schematics.collection
        : '@schematics/angular';

    this.config.options.collection
      = [ cliCollection, '@schematics/angular' ]
        .filter((v, i, a) => a.indexOf(v) === i);

    await this.sm.copySchematics(this.config.options.collection);

    this.config.options.blueprint
      = this.sm.availableBlueprints(cliCollection)

    const cliSchematics
      = this.config.options.blueprint
        .map(blueprint =>
          this.sm.blueprintCommand(cliCollection, blueprint))
        .map(command => this.updateCommandOptions(command));

    const cliCommands
      = Object.values(commands)
        .map(command => this.updateCommandOptions(command));

    return this.fm.saveClientConfig({
      cliCollection,
      cliCommands,
      cliConfig,
      cliSchematics,
    });
  }

  /**
   * Updates CLI Command "avaibaleOptions" with values from config, 
   * and sets option "default" to first item from config array.
   * 
   * For example:
   * 
   *   config.options.environment: [
   *     'development',
   *     'production',
   *   ]
   * 
   * will be used for commands that have `environment` option,
   * like "build", "serve", "test"
   * and default value will be "development"
   */
  private updateCommandOptions(command) {
    const hasConfig = name =>
      Object.keys(this.config.options).includes(name);

    const availableOptions
      = command.availableOptions
        .map(option => !hasConfig(option.name)
          ? option
          : ({
            ...option,
            values: this.config.options[ option.name ],
            default: this.config.options[ option.name ][ 0 ],
          }))

    return { ...command, availableOptions };
  }
}
