import * as process from 'process';
import * as pstree from 'ps-tree';

import { Command } from './models';
import { GUI } from './gui.model';
import { dasherize } from '@angular-devkit/core';
import { exec } from 'child_process';

function emitProgress(data, socket: SocketIO.Socket, app: GUI) {
  const progressRegexp = /^(\d+%|[\x00-\x1F])/i;
  const nonASCIIRegexp = /[^\x20-\x7F]/g;

  const output
    = data.toString().replace(nonASCIIRegexp, '').trim();

  if (output && !progressRegexp.test(output)) {
    socket.emit('progress', app.converter.toHtml(data));
  }
}

export function processAction(command: Command, socket: SocketIO.Socket, app: GUI) {
  switch (command.type) {
    case 'open':
      return app.action.next(command);

    default:
      return socket.emit('failure', 'Invalud action');
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

  const options = {
    cwd: app.files.workspaceRoot,
    encoding: 'utf8',
  };

  const child = exec(command.script, options, (error, stdout, stderr) => {
    if (error) {
      socket.emit('failure', app.converter.toHtml(stderr));
    }
  });

  if (!child) {
    return socket.emit('success', successMessage);
  }

  socket.emit('start', child.pid);
  child.stderr.on('data', data => emitProgress(data, socket, app));
  child.stdout.on('data', data => emitProgress(data, socket, app));

  child.on('exit', (code, signal) => {
    if (!code) {
      socket.emit('success', successMessage);
    }
  });
}

export function killCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  const name
    = command.name
      ? `${ command.name }.sh`
      : command.value;

  const terminalMessage = `Terminating command: ${ name }`;
  const successMessage = `Terminated command: ${ name }`;
  const failureMessage = '';
  app.logger(terminalMessage);

  pstree(command.pid, (error, children) => {
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

  const script
    = command.description
      ? `# ${ command.description } \n` + command.script
      : command.script;

  return await app.files.saveCommand(name, script)
    ? socket.emit('success', successMessage)
    : socket.emit('failure', failureMessage);
}

export function generateCommand(command: Command, socket: SocketIO.Socket, app: GUI) {
  socket.emit('start', true);

  const terminalMessage = `Executing command: ${ command.value }`;
  const successMessage = `Executed command: ${ command.value }`;
  const failureMessage = '';
  app.logger(terminalMessage);

  app.schematics.generateBlueprint(command)
    .subscribe({
      next: loggingQueue =>
        loggingQueue.forEach(log => {
          socket.emit('progress', app.converter.toHtml(log));
          app.logger(log);
        }),

      error: (error) => {
        app.logger(error.message);
        socket.emit('failure', app.converter.toHtml(error.message));
      },

      complete: () =>
        socket.emit('success', successMessage)
    });
}
