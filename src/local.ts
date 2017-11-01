import { AngularGUI, test } from './core';

const gui = new AngularGUI({ port: 4300, rootDir: '.ng-gui' });

gui.start(o => o, console.log);
// test();