import * as process from 'process';
import * as pstree from 'ps-tree';
import * as shell from 'shelljs';

import { ChildProcess } from 'child_process';
import { Command } from './models';
import { GUI } from './gui.model';
import { dasherize } from '@angular-devkit/core';

export function processAction(command: Command, socket: SocketIO.Socket, app: GUI) {
  switch (command.type) {
  }
}

export function processCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  // console.log(JSON.stringify(command, null, 2));
  switch (command.type) {
    case 'delete':
      return deleteScript(command, socket, app);

    case 'exec':
      return execCommand(command, socket, app);

    case 'generate':
      return generateCommand(command, socket, app);

    // case 'init':
    //   return initCommand(command, socket, app);

    case 'kill':
      return killCommand(command, socket, app);

    case 'save':
      return saveScript(command, socket, app);

    default:
      return socket.emit('failure', 'Invalud command');
  }
}

export async function deleteScript(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = dasherize(command.name)
      .replace(/-/g, '.');

  const terminalMessage = `Deleting script: ${ name }.sh`;
  const successMessage = `Deleted script: ${ name }.sh`;
  const failureMessage = 'Delete failed';
  app.logger(terminalMessage);

  return await app.files.deleteCommand(name)
    ? socket.emit('success', successMessage)
    : socket.emit('failure', failureMessage);
}

export function execCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = command.name
      ? `${ command.name }.sh`
      : command.value;

  const terminalMessage
    = command.description
    || `Executing command: ${ name }`;
  const successMessage = `Executed command: ${ name }`;
  const failureMessage = '';
  app.logger(terminalMessage);

  const script = command.script.replace(/^# (.*) \n/gm, '');
  const options = {
    async: true,
    cwd: app.files.workspaceRoot,
    encoding: 'utf8',
  };

  const child = shell.exec(script, options, (error, stdout, stderr) => {
    if (error) {
      socket.emit('failure', stderr);
    }
  }) as ChildProcess;

  if (!child) {
    return socket.emit('success', successMessage);
  }

  socket.emit('start', child.pid);

  child.stdout.on('data', data =>
    socket.emit('progress', app.converter.toHtml(data)))

  child.on('exit', (code, signal) => {
    if (!code) {
      socket.emit('success', successMessage);
    }
  });
}

// export async function initCommand(command: Command, socket: SocketIO.Socket, app: App) {
//   socket.emit('failure', config);
// }

export function killCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = command.name
      ? `${ command.name }.sh`
      : command.value;

  const terminalMessage = `Terminating command: ${ name }`;
  const successMessage = `Terminated command: ${ name }`;
  const failureMessage = '';
  app.logger(terminalMessage);

  pstree(command.process.pid, (error, children) => {
    children.map(p => p.PID).forEach(pid => {
      try { process.kill(pid, 'SIGKILL'); } catch { }
    })

    socket.emit('success', successMessage);
  });
}

export async function saveScript(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = dasherize(command.name)
      .replace(/-/g, '.');

  const terminalMessage = `Saving script: ${ name }.sh`;
  const successMessage = `Saved script: ${ name }.sh`;
  const failureMessage = 'Save failed';
  app.logger(terminalMessage);

  return await app.files.saveCommand(name, command.script)
    ? socket.emit('success', successMessage)
    : socket.emit('failure', failureMessage);
}

export function generateCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  socket.emit('start', true);

  const terminalMessage = `Executing command: ${ command.value }`;
  const successMessage = `Executed command: ${ command.value }`;
  const failureMessage = '';
  app.logger(terminalMessage);

  app.schematics.generateBlueprint(command, app)
    .subscribe({
      next: loggingQueue =>
        loggingQueue.forEach(log => {
          socket.emit('progress', app.converter.toHtml(log));
          app.logger(log);
        }),

      error: (error) => {
        app.logger(error.message);
        socket.emit('failure', error.message);
      },

      complete: () =>
        socket.emit('success', successMessage)
    });
}
