//#region Imports

import * as Converter from 'ansi-to-html';
import * as commands from '../commands';
import * as express from 'express';
import * as io from 'socket.io';
import * as stoppable from 'stoppable';

import { sort, uniqueFn } from './utils';

import { AngularGUIApp } from './app.interface';
import { Command } from './command.interface';
import { CommandRunner } from './runner';
import { FilesManager } from './files';
import { MESSAGE } from './messages';
import { SchematicsManager } from './schematics';
import { Subject } from 'rxjs/Subject';

//#endregion 

export class AngularGUI implements AngularGUIApp {
  private app;
  private server;

  action = new Subject();
  files: FilesManager;
  runner: CommandRunner;
  schematics: SchematicsManager;

  constructor(public config, public logger) {
    this.app = express().get('/', (req, res) => res.sendStatus(202));
    this.runner = new CommandRunner(this);
    this.initialize(config);
  }

  start(statusUpdate) {
    this.server = stoppable(this.app.listen(this.config.port, () => {
      this.logger(MESSAGE.SERVER_CONNECTED(this.config.port));
    }), 0);

    this.server.once('listening', () => statusUpdate('listening'));

    io(this.server)
      .on('connection', async socket => {
        statusUpdate('connected');
        this.logger(MESSAGE.CLIENT_CONNECTED(socket.handshake.headers.origin));

        this.runner.connect(socket);
        socket.emit('init', await this.clientConfig());

        socket.on('action', (command: Command) =>
          this.runner.processAction(command));

        socket.on('command', (command: Command) =>
          this.runner.processCommand(command));

        socket.on('disconnect', socket => {
          this.logger(MESSAGE.CLIENT_DISCONNECTED);
          statusUpdate('listening');
        });
      });

    return this.action.asObservable();
  }

  stop(statusUpdate) {
    this.server.once('close', () => statusUpdate('disconnected'));
    this.server.stop();
    this.runner.disconnect();
  }

  /**
   * Create `.angular-gui.json` to be used as configuration for client.
   *
   * Rebuilding is done when `.angular-gui.json` does not exist,
   * or manually via extension command `extension.rebuildConfiguration`
   */
  async rebuild() {
    this.logger(MESSAGE.REBUILD_START);

    return this.files.deleteClientConfig()
      .then(() => this.files.copyProjectSchematics(this.schematics.collections))
      .then(() => this.files.copyUserSchematics())
      .then(() => this.files.createRunnerScript())
      .then(() => {
        this.config.commandOptions.collection
          = this.schematics.collections;

        this.config.commandOptions.blueprint
          = Object.keys(this.schematics.blueprints)
            .sort(sort('asc'));

        const cliSchematics
          = this.config.commandOptions.blueprint
            .map(blueprint =>
              this.schematics.blueprintCommand(blueprint))
            .map(command =>
              this.updateCommandOptions(command));

        const cliCommands
          = Object.values(commands)
            .filter(command => this.config.commands.includes(command.name))
            .map(command => this.updateCommandOptions(command));

        return this.files
          .saveClientConfig({ cliCommands, cliSchematics });
      })
      .then(() => this.clientConfig())
      .then(config => {
        this.logger(MESSAGE.REBUILD_FINISH);
        if (this.runner.socket) {
          this.runner.socket.emit('init', config);
        }
      })
  }

  async initialize(config) {
    this.files = new FilesManager(this.config = config);

    const cliConfig
      = await this.files.cliConfig;

    const defaultCollection
      = cliConfig.defaults.schematics
        ? cliConfig.defaults.schematics.collection
        : '@schematics/angular';

    this.config.commandOptions.collection
      = [ defaultCollection, ...this.config.commandOptions.collection ]
        .concat('@schematics/angular-gui')
        .filter(uniqueFn);

    this.schematics
      = new SchematicsManager(
        this.config.commandOptions.collection,
        cliConfig,
        this.files.workspaceRoot,
        this.files.workspaceSchematicsFolder);
  }

  private async clientConfig() {
    const cliConfig
      = await this.files.cliConfig;

    const clientConfig
      = await this.files.clientConfig
      || await this.rebuild()
        .then(() => this.files.clientConfig)

    this.config.commandOptions.blueprint
      = Object.keys(this.schematics.blueprints)
        .sort(sort('asc'))

    const guiCommands
      = await this.files.guiCommands;

    const guiConfig = {
      ...this.config,
      runner: await this.files.hasRunnerScript,
    };

    const VERSION
      = (await this.files.packageJSON).version;

    return { ...clientConfig, cliConfig, guiCommands, guiConfig, VERSION };
  }

  /**
   * Updates CLI Command "avaibaleOptions" with values from config,
   * and sets option "default" to first item from config array.
   *
   * For example:
   * ```
   * config.commandOptions.target: [
   *   'development',
   *   'production',
   * ]
   * ```
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
