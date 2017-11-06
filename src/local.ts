import * as path from 'path';

import { AngularGUI, defaultConfiguration as config } from './core';

try {
  const rootUri = require('vscode').workspace.workspaceFolders[ 0 ];
  config[ 'workspaceRoot' ] = rootUri.uri.fsPath;
  config[ 'extensionRoot' ] = path.resolve(__dirname, '..');
} catch  {
  config[ 'workspaceRoot' ] = path.resolve(__dirname, '..', '..', 'webapps');
  config[ 'extensionRoot' ] = path.resolve(__dirname, '..', config.rootDir);
}

const gui = new AngularGUI(config, console.log);
gui.start(o => o);
