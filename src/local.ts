import { AngularGUI } from './core/app';
import config from './core/config';
import { resolve } from 'path';

/**
 * If you are working on extension code and want to run local.ts
 * workspaceRoot should point to a AngularCLI project folder
 * for me it's "webapps", change this to match your setup
 */
config[ 'workspaceRoot' ] = resolve(__dirname, '..', '..', 'webapps');
config[ 'extensionRoot' ] = resolve(__dirname, '..');
config[ 'local' ] = true;

const gui = new AngularGUI(config, console.log);
gui.start(o => o).subscribe(console.log);
