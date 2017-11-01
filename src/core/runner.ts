import * as process from 'process';
import * as pstree from 'ps-tree';
import * as shell from 'shelljs';

import { createRunnerScript, resolve, writeFile } from './files';

import { ChildProcess } from 'child_process';
import { Command } from './models';

export function processAction(command: Command, socket: SocketIO.Socket) {
  switch (command.type) {
  }
}

export function processCommand(command: Command, socket: SocketIO.Socket, config) {
  // console.log(JSON.stringify(command));
  // console.log(command.label, command.type, command.value);
  switch (command.type) {
    case 'delete':
      return deleteCommand(command, socket);

    case 'init':
      return initCommand(config, socket);

    case 'exec':
      return execCommand(command, socket);

    case 'kill':
      return killCommand(command, socket);

    case 'save':
      return saveCommand(command, config, socket);

    case 'test':
      return testCommand(command, socket);

    default:
      return socket.emit('failure', command, null);
  }
}

export async function deleteCommand(config, socket: SocketIO.Socket) {
  socket.emit('failure', config);
}

export async function initCommand(config, socket: SocketIO.Socket) {
  socket.emit('failure', config);
}

export function execCommand(command: Command, socket: SocketIO.Socket) {
  const child = shell.exec(command.value, { async: true }) as ChildProcess;
  if (!child) { return socket.emit('finish', command); }

  socket.emit('start', child.pid);
  child.on('exit', (code, signal) => socket.emit('finish', command));
}

export function killCommand(command: Command, socket: SocketIO.Socket) {
  pstree(command.value, (error, children) => {
    children.map(p => p.PID).forEach(pid => {
      try { process.kill(pid, 'SIGKILL'); } catch { }
    })

    socket.emit('finish');
  });
}

export async function saveCommand(command: Command, config, socket: SocketIO.Socket) {
  return writeFile(`${ config.rootDir }/commands/${ command.label }.sh`, command.value);
}

export async function testCommand(config, socket: SocketIO.Socket) {
  socket.emit('failure', config);
}
