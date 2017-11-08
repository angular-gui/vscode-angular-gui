import * as path from 'path';

import { AngularGUI, defaultConfiguration as config } from './core';

config[ 'workspaceRoot' ] = path.resolve(__dirname, '..', '..', 'webapps');
config[ 'extensionRoot' ] = path.resolve(__dirname, '..');
config[ 'local' ] = true;

const gui = new AngularGUI(config, console.log);
gui.start(o => o);
