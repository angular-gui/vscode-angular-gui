import * as process from 'process';
import * as pstree from 'ps-tree';
import * as shell from 'shelljs';

import { ChildProcess } from 'child_process';
import { Command } from './models';

export function processAction(command: Command, socket: SocketIO.Socket, app) {
  switch (command.type) {
  }
}

export function processCommand(command: Command, socket: SocketIO.Socket, app) {
  // console.log(JSON.stringify(command, null, 2));
  switch (command.type) {
    case 'delete':
      return deleteCommand(command, socket, app);

    case 'exec':
      return execCommand(command, socket, app);

    case 'generate':
      return app.sm.generateBlueprint(command, socket, app);

    // case 'init':
    //   return initCommand(command, socket, app);

    case 'kill':
      return killCommand(command, socket, app);

    case 'save':
      return saveCommand(command, socket, app);

    default:
      return socket.emit('failure', command);
  }
}

export async function deleteCommand(command: Command, socket: SocketIO.Socket, app) {
  app.logger(`Deleting command ${ command.name }.sh`);
  return await app.fm.deleteCommand(command.name)
    ? socket.emit('success', command)
    : socket.emit('failure', command);
}

export function execCommand(command: Command, socket: SocketIO.Socket, app) {
  const message
    = command.description
      ? command.description
      : command.name
        ? `Executing command ${ command.name }.sh`
        : `Executing command "${ command.value }"`;
  app.logger(message);

  const script = command.script.replace(/^# (.*) \n/gm, '');
  const child = shell.exec(script, { async: true }) as ChildProcess;
  if (!child) { return socket.emit('finish', command); }

  socket.emit('start', child.pid);
  child.on('exit', (code, signal) => socket.emit('finish', command));
}

// export async function initCommand(command: Command, socket: SocketIO.Socket, app) {
//   socket.emit('failure', config);
// }

export function killCommand(command: Command, socket: SocketIO.Socket, app) {
  const message = command.name
    ? `Terminating command ${ command.name }.sh`
    : `Terminating command "${ command.value }"`;
  app.logger(message);

  pstree(command.$exec, (error, children) => {
    children.map(p => p.PID).forEach(pid => {
      try { process.kill(pid, 'SIGKILL'); } catch { }
    })

    socket.emit('finish');
  });
}

export async function saveCommand(command: Command, socket: SocketIO.Socket, app) {
  app.logger(`Saving command ${ command.name }.sh`);
  return await app.fm.saveCommand(command.name, command.script)
    ? socket.emit('success', command)
    : socket.emit('failure', command);
}

export async function generateCommand(command: Command, socket: SocketIO.Socket, app) {
  app.logger(`Executing command "${ command.value }"`);
  app.sm.generateBlueprint(command)
  // return await app.fm.saveCommand(command.name, command.script)
  //   ? socket.emit('success', command)
  //   : socket.emit('failure', command);
}
