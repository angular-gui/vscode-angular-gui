import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { defaultConfiguration } from './models';

export interface GUI {
  cliConfig;
  cliCollection: string;
  config: typeof defaultConfiguration;
  files: FilesManager;
  logger;
  server;
  schematics: SchematicsManager;
  socket: SocketIO.EngineSocket;
}
