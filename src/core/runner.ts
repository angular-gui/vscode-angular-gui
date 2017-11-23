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
        return this.app.schematics.cloneSchematic(command);

      case 'open':
        return this.app.action.next(command);

      case 'rebuild':
        return this.app.rebuild();

      default:
        return this.emit('failure', command.guid, MESSAGE.INVALID_COMMAND);
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
        return this.emit('failure', command.guid, MESSAGE.INVALID_COMMAND);
    }
  }

  private async deleteScript(command: Command) {
    const name
      = dasherize(command.name)
        .replace(/-/g, '.');

    this.app.logger(MESSAGE.DELETE_START(name));

    return await this.app.files.deleteCommand(name)
      ? this.emit('success', command.guid, MESSAGE.DELETE_SUCCESS(name))
      : this.emit('failure', command.guid, MESSAGE.DELETE_FAILURE);
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
            this.emit('failure', command.guid, this.converter.toHtml(stderr));
          }
        });

    if (!child) {
      return this.emit('success', command.guid, MESSAGE.EXEC_SUCCESS(name));
    }

    this.emit('start', command.guid, child.pid);
    child.stderr.on('data', data => this.execOutput(data, command));
    child.stdout.on('data', data => this.execOutput(data, command));

    child.on('exit', (code, signal) => {
      if (!code) {
        this.emit('success', command.guid, MESSAGE.EXEC_SUCCESS(name));
      }
    });
  }

  private generateCommand(command: Command) {
    this.app.logger(MESSAGE.EXEC_START(command.value));
    this.emit('start', command.guid, true);

    this.app.schematics.generateBlueprint(command)
      .subscribe({
        next: loggingQueue =>
          loggingQueue.forEach(log => {
            this.app.logger(log);
            this.emit('output', command.guid, this.converter.toHtml(log));
          }),

        error: (error) => {
          this.app.logger(error.message);
          this.emit('failure', command.guid, this.converter.toHtml(error.message));
        },

        complete: () =>
          this.emit('success', command.guid, MESSAGE.EXEC_SUCCESS(command.value))
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

      this.emit('success', command.guid, MESSAGE.KILL_SUCCESS(name));
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
      ? this.emit('success', command.guid, MESSAGE.SAVE_SUCCESS(name))
      : this.emit('failure', command.guid, MESSAGE.SAVE_FAILURE);
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
        this.emit('progress', command.guid, this.progress);
      }
    }

    if (output && !outputRegexp.test(output)) {
      this.emit('output', command.guid, this.converter.toHtml(data));
    }
  }

  private emit(event, guid: string, message: any) {
    if (!this.socket) { return; }
    this.socket.emit(event, { guid, message });
  }
}
