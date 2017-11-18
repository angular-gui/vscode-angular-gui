import { FilesManager } from './files';
import { SchematicsManager } from './schematics';
import { Subject } from 'rxjs/Subject';
import { defaultConfiguration } from './models';

export interface GUI {
  action: Subject<any>;
  // cliConfig;
  // cliCollection: string;
  converter;
  config: typeof defaultConfiguration;
  files: FilesManager;
  logger;
  server;
  schematics: SchematicsManager;
  socket: SocketIO.EngineSocket;
}
