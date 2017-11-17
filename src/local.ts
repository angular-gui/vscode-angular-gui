import * as path from 'path';
import * as vscode from 'vscode';

import { AngularGUI, defaultConfiguration as config } from './core';

/**
 * If you are working on extension code and want to run local.ts
 * workspaceRoot should point to a AngularCLI project folder
 * for me it's "webapps", change this to match your setup
 */
config[ 'workspaceRoot' ] = path.resolve(__dirname, '..', '..', 'webapps');
config[ 'extensionRoot' ] = path.resolve(__dirname, '..', '.angular-gui');
config[ 'local' ] = true;

const gui = new AngularGUI(config, console.log);
gui.start(o => o).subscribe(console.log);
