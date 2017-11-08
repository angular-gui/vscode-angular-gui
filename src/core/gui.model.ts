import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { defaultConfiguration } from './models';
import { terminal } from '@angular-devkit/core';

export interface GUI {
  cliConfig;
  cliCollection: string;
  config: typeof defaultConfiguration;
  files: FilesManager;
  logger;
  server;
  schematics: SchematicsManager;
  socket: SocketIO.EngineSocket;
  terminal: typeof terminal;
}
