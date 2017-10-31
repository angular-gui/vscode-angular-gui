import * as path from 'path';
import * as shell from 'shelljs';
import * as vscode from 'vscode';

import { createRunnerScript, resolve } from './files';

import { ChildProcess } from 'child_process';
import { Command } from './models';
import { log } from './utils';

const process: { [ name: string ]: ChildProcess } = {};

export function processCommand(command: Command, socket: SocketIO.Socket, config) {
  log(Object.keys(process), JSON.stringify(command));

  switch (command.type) {
    case 'DEV_CLEANUP':
      shell.rm('-rf', config.rootDir, `node_modules/${ config.rootDir }`);

    // case 'delete':
    //   return deleteCommand(command, socket);

    case 'init':
      return initCommand(config, socket);

    case 'exec':
      return execCommand(command, socket);

    case 'stop':
      return killCommand(command, socket);

    // case 'save':
    //   return saveCommand(command, socket);

    default:
      return socket.emit('failure', command, null);
  }
}

export async function initCommand(config, socket: SocketIO.Socket) {
}

export function execCommand(command: Command, socket: SocketIO.Socket) {
  process[ command.name ]
    = shell.exec(command.value, { async: true }) as ChildProcess;
  process[ command.name ]
    .on('message', (message, listener) => socket.emit('success', command, message, listener));
  process[ command.name ]
    .on('exit', (code, signal) => killCommand(command, socket));
}

export function killCommand(command: Command, socket: SocketIO.Socket) {
  process[ command.name ].kill();
  delete process[ command.name ];
  socket.emit('success', command);
}
