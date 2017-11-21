import * as Converter from 'ansi-to-html';
import * as process from 'process';
import * as pstree from 'ps-tree';

import { AngularGUIApp } from './app.interface';
import { Command } from './command.interface';
import { dasherize } from '@angular-devkit/core';
import { exec } from 'child_process';

export class CommandRunner {
  private converter = new Converter();
  private progress: number;

  constructor(
    private app: AngularGUIApp,
    private socket: SocketIO.Socket) { }


  processAction(command: Command) {
    switch (command.type) {
      case 'open':
        return this.app.action.next(command);

      case 'rebuild':
        return this.app.rebuild();

      default:
        return this.emit('failure', command.guid, 'Invalud command');
    }
  }

  processCommand(command: Command) {
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
        return this.emit('failure', command.guid, 'Invalud command');
    }
  }

  private async deleteScript(command: Command) {
    const name
      = dasherize(command.name)
        .replace(/-/g, '.');

    const terminalMessage = `Deleting script: ${ name }.sh`;
    const successMessage = `Deleted script: ${ name }.sh`;
    const failureMessage = 'Delete failed';
    this.app.logger(terminalMessage);

    return await this.app.files.deleteCommand(name)
      ? this.emit('success', command.guid, successMessage)
      : this.emit('failure', command.guid, failureMessage);
  }

  private executeCommand(command: Command) {
    const name
      = command.name
        ? `${ command.name }.sh`
        : command.value;

    const terminalMessage
      = command.description
      || `Executing command: ${ name }`;
    const successMessage = `Executed command: ${ name }`;
    const failureMessage = '';
    this.app.logger(terminalMessage);

    const options = {
      cwd: this.app.files.workspaceRoot,
    };

    const child = exec(command.script, options, (error, stdout, stderr) => {
      if (error) {
        this.emit('failure', command.guid, this.converter.toHtml(stderr));
      }
    });

    if (!child) {
      return this.emit('success', command.guid, successMessage);
    }

    this.emit('start', command.guid, child.pid);
    child.stderr.on('data', data => this.execOutput(data, command));
    child.stdout.on('data', data => this.execOutput(data, command));

    child.on('exit', (code, signal) => {
      if (!code) {
        this.emit('success', command.guid, successMessage);
      }
    });
  }

  private generateCommand(command: Command) {
    const terminalMessage = `Executing command: ${ command.value }`;
    const successMessage = `Executed command: ${ command.value }`;
    const failureMessage = '';
    this.app.logger(terminalMessage);
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
          this.emit('success', command.guid, successMessage)
      });
  }

  private killCommand(command: Command) {
    const name
      = command.name
        ? `${ command.name }.sh`
        : command.value;

    const terminalMessage = `Terminating command: ${ name }`;
    const successMessage = `Terminated command: ${ name }`;
    const failureMessage = '';
    this.app.logger(terminalMessage);

    pstree(command.pid, (error, children) => {
      children.map(p => p.PID).forEach(pid => {
        try { process.kill(pid, 'SIGKILL'); } catch { }
      })

      this.emit('success', command.guid, successMessage);
    });
  }

  private async saveScript(command: Command) {
    const name
      = dasherize(command.name)
        .replace(/-/g, '.');

    const terminalMessage = `Saving script: ${ name }.sh`;
    const successMessage = `Saved script: ${ name }.sh`;
    const failureMessage = 'Save failed';
    this.app.logger(terminalMessage);

    const script
      = command.description
        ? `# ${ command.description } \n` + command.script
        : command.script;

    return await this.app.files.saveCommand(name, script)
      ? this.emit('success', command.guid, successMessage)
      : this.emit('failure', command.guid, failureMessage);
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
    this.socket.emit(event, { guid, message });
  }
}
