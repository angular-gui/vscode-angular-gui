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
      return app.schematics
        .generateBlueprint(command, socket, app);

    // case 'init':
    //   return initCommand(command, socket, app);

    case 'kill':
      return killCommand(command, socket, app);

    case 'save':
      return saveScript(command, socket, app);

    default:
      return socket.emit('failure', {
        command,
        message: 'Invalud command'
      });
  }
}

export async function deleteScript(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = dasherize(command.name)
      .replace(/-/g, '.');
  const message
    = `Deleting script: ${ name }.sh`;
  app.logger(message);

  return await app.files.deleteCommand(name)
    ? socket.emit('success', command)
    : socket.emit('failure', {
      command,
      message: 'Delete failed'
    });
}

export function execCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  const message
    = command.description
      ? command.description
      : command.name
        ? `Executing command: ${ command.name }.sh`
        : `Executing command: ${ command.value }`;
  app.logger(message);

  const script = command.script.replace(/^# (.*) \n/gm, '');
  const options = {
    async: true,
    cwd: app.files.workspaceRoot,
  };
  const child = shell.exec(script, options) as ChildProcess;
  if (!child) { return socket.emit('finish', command); }

  socket.emit('start', child.pid);
  child.on('exit', (code, signal) => socket.emit('finish', command));
}

// export async function initCommand(command: Command, socket: SocketIO.Socket, app: App) {
//   socket.emit('failure', config);
// }

export function killCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  const message = command.name
    ? `Terminating command: ${ command.name }.sh`
    : `Terminating command: ${ command.value }`;
  app.logger(message);

  pstree(command.$exec, (error, children) => {
    children.map(p => p.PID).forEach(pid => {
      try { process.kill(pid, 'SIGKILL'); } catch { }
    })

    socket.emit('finish');
  });
}

export async function saveScript(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = dasherize(command.name)
      .replace(/-/g, '.');
  const message
    = `Saving script: ${ name }.sh`;
  app.logger(message);

  return await app.files.saveCommand(name, command.script)
    ? socket.emit('success', command)
    : socket.emit('failure', {
      command,
      message: 'Save failed'
    });
}
