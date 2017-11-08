import * as commands from '../commands';
import * as express from 'express';
import * as io from 'socket.io';
import * as stoppable from 'stoppable';

import { processAction, processCommand } from './runner';

import { Command } from './models';
import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { Server } from 'http';
import { sort } from './utils';
import { terminal } from '@angular-devkit/core';

export class AngularGUI {
  private app;
  cliConfig;
  cliCollection;
  files: FilesManager;
  server;
  schematics: SchematicsManager;
  socket;
  terminal = terminal;

  constructor(public config, public logger) {
    this.app = express().get('/', (req, res) => res.sendStatus(202));
    this.files = new FilesManager(config);
    this.schematics = new SchematicsManager(config);
  }

  start(statusUpdate) {
    this.server = stoppable(this.app.listen(this.config.port, () => {
      const host = terminal.magenta(`localhost:${ this.config.port }`);
      this.logger(`Listening on ${ host }...`);
    }), 0);

    this.server.once('listening', () => statusUpdate('listening'));

    this.socket = io(this.server).on('connection', async socket => {
      const cliConfig = this.cliConfig
        = await this.files.cliConfig;

      const cliCollection = this.cliCollection
        = this.cliConfig.defaults.schematics
          ? this.cliConfig.defaults.schematics.collection
          : '@schematics/angular';

      const clientConfig
        = !this.config.local
          ? await this.files.deleteClientConfig()
            .then(() => this.rebuild())
            .then(() => this.files.clientConfig)

          // DEV ONLY: rebuild clientConfig when running from local.ts
          : await this.files.clientConfig
          || await this.rebuild()
            .then(() => this.files.clientConfig)

      const guiCommands
        = await this.files.guiCommands;

      const guiConfig = {
        ...this.config,
        runner: await this.files.hasRunnerScript,
      };

      socket.emit('init', { ...clientConfig, cliConfig, guiCommands, guiConfig });

      socket.on('action', (command: Command) =>
        processAction(command, socket, this));

      socket.on('command', (command: Command) =>
        processCommand(command, socket, this));

      socket.on('disconnect', socket => {
        this.logger(terminal.red(`Client disconnected.`));
      });
    });

    this.socket.on('connection', socket => {
      const origin = terminal.magenta(socket.handshake.headers.origin);
      this.logger(`Client connected from ${ origin }.`);
      statusUpdate('connected');
    });

    this.socket.on('disconnect', socket => {
      this.logger(terminal.yellow(`Server terminated`));
      statusUpdate('listening');
    });
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

    this.config.options.collection
      = [ this.cliCollection, '@schematics/angular' ]
        .filter((v, i, a) => a.indexOf(v) === i);

    await this.files.copyCliSchematics(this.config.options.collection);

    this.config.options.blueprint
      = this.schematics.availableBlueprints(this.cliCollection)

    const cliSchematics
      = this.config.options.blueprint
        .map(blueprint =>
          this.schematics.blueprintCommand(this.cliCollection, blueprint))
        .map(command => this.updateCommandOptions(command));

    const cliCommands
      = Object.values(commands)
        .map(command => this.updateCommandOptions(command));

    return this.files.saveClientConfig({
      cliCommands,
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