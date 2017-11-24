//#region Imports

import * as Converter from 'ansi-to-html';
import * as process from 'process';
import * as pstree from 'ps-tree';

import { AngularGUIApp } from './app.interface';
import { Command } from './command.interface';
import { MESSAGE } from './messages';
import { dasherize } from './utils';
import { exec } from 'child_process';

//#endregion

export class CommandRunner {
  private converter = new Converter();
  private progress: number;
  socket: SocketIO.Socket;

  constructor(private app: AngularGUIApp) { }

  connect(socket: SocketIO.Socket) {
    this.socket = socket;
  }

  disconnect() {
    this.socket = null;
  }

  processAction(command: Command) {
    if (!this.socket) { return; }
    switch (command.type) {
      case 'clone':
        return this.app.schematics
          .cloneSchematic(command)
          .then(data => {
            this.emit('output', this.converter.toHtml(data));
            this.emit('success', MESSAGE.SCHEMATIC_CLONE_SUCCESS);
          });

      case 'open':
        return this.app.action.next(command);

      case 'rebuild':
        return this.app.rebuild()
          .then(() =>
            this.emit('success', MESSAGE.REBUILD_FINISH))

      case '__DEV__':
        return;

      default:
        return this.emit('failure', MESSAGE.INVALID_COMMAND, command.guid);
    }
  }

  processCommand(command: Command) {
    if (!this.socket) { return; }
    // console.log(JSON.stringify(command, null, 2));
    switch (command.type) {
      case 'delete':
        return this.deleteScript(command);

      case 'exec':
        return this.executeCommand(command);

      case 'generate':
        return this.generateCommand(command);

      case 'kill':
        return this.killCommand(command);

      case 'save':
        return this.saveScript(command);

      default:
        return this.emit('failure', MESSAGE.INVALID_COMMAND, command.guid);
    }
  }

  private async deleteScript(command: Command) {
    const name
      = dasherize(command.name)
        .replace(/-/g, '.');

    this.app.logger(MESSAGE.DELETE_START(name));

    return await this.app.files.deleteCommand(name)
      ? this.emit('success', MESSAGE.DELETE_SUCCESS(name), command.guid)
      : this.emit('failure', MESSAGE.DELETE_FAILURE, command.guid);
  }

  private executeCommand(command: Command) {
    const name
      = command.name
        ? `${ command.name }.sh`
        : command.value;

    this.app.logger(command.description || MESSAGE.EXEC_START(name));

    const child
      = exec(
        command.script,
        { cwd: this.app.files.workspaceRoot },
        (error, stdout, stderr) => {
          if (error) {
            this.emit('failure', this.converter.toHtml(stderr), command.guid);
          }
        });

    if (!child) {
      return this.emit('success', MESSAGE.EXEC_SUCCESS(name), command.guid);
    }

    this.emit('start', child.pid, command.guid);
    child.stderr.on('data', data => this.execOutput(data, command));
    child.stdout.on('data', data => this.execOutput(data, command));

    child.on('exit', (code, signal) => {
      if (!code) {
        this.emit('success', MESSAGE.EXEC_SUCCESS(name), command.guid);
      }
    });
  }

  private generateNrwlApp(command: Command) {
    const name
      = command.options.find(o => o.name === 'name').value;
    const options
      = command.options
        .filter(o => o.name !== 'name')
        // .concat({ name: 'source-dir', value: '../../src' })
    const value
      = `ng generate app ${ name }`;
    const script
      = [ value ]
        .concat(...options.map(o => `--${ o.name } ${ o.value }`))
        .join(' ');

    return this.executeCommand({ ...command, options, value, script });
  }

  private generateCommand(command: Command) {
    if (command.value === 'ng generate app') {
      return this.generateNrwlApp(command);
    }

    this.app.logger(MESSAGE.EXEC_START(command.value));
    this.emit('start', true, command.guid);

    this.app.schematics.generateBlueprint(command)
      .subscribe({
        next: loggingQueue =>
          loggingQueue.forEach(log => {
            this.app.logger(log);
            this.emit('output', this.converter.toHtml(log), command.guid);
          }),

        error: (error) => {
          this.app.logger(error.message);
          this.emit('failure', this.converter.toHtml(error.message), command.guid);
        },

        complete: () =>
          this.emit('success', MESSAGE.EXEC_SUCCESS(command.value), command.guid),
      });
  }

  private killCommand(command: Command) {
    const name
      = command.name
        ? `${ command.name }.sh`
        : command.value;

    this.app.logger(MESSAGE.KILL_START(name));

    pstree(command.pid, (error, children) => {
      children.map(p => p.PID).forEach(pid => {
        try { process.kill(pid, 'SIGKILL'); } catch { }
      })

      this.emit('success', MESSAGE.KILL_SUCCESS(name), command.guid);
    });
  }

  private async saveScript(command: Command) {
    const name
      = dasherize(command.name)
        .replace(/-/g, '.');

    this.app.logger(MESSAGE.SAVE_START(name));

    const script
      = command.description
        ? `# ${ command.description } \n` + command.script
        : command.script;

    return await this.app.files.saveCommand(name, script)
      ? this.emit('success', MESSAGE.SAVE_SUCCESS(name), command.guid)
      : this.emit('failure', MESSAGE.SAVE_FAILURE, command.guid);
  }

  private execOutput(data, command: Command) {
    const outputRegexp = /^(\d+%|[\x00-\x1F])/i;
    const progressRegexp = /^(\d+%)/i;
    const nonASCIIRegexp = /[^\x20-\x7F]/g;

    const output
      = data.toString().replace(nonASCIIRegexp, '').trim();

    if (output && progressRegexp.test(output)) {
      const current = +output.match(/^\d+/)[ 0 ];
      if (current < this.progress) {
        this.progress = 0;
      }

      if (this.progress !== current) {
        this.progress = current;
        this.emit('progress', this.progress, command.guid);
      }
    }

    if (output && !outputRegexp.test(output)) {
      this.emit('output', this.converter.toHtml(data), command.guid);
    }
  }

  private emit(event, message: any, guid?: string) {
    if (!this.socket) { return; }
    this.socket.emit(event, { guid, message });
  }
}
