import { TestEngineHost, setupWithSchematics, versions } from '../test';

import { AngularGUIApp } from './app.interface';
import { SchematicsManager } from './schematics';

versions.forEach(version => {
  const { cli, sch } = version;
  const suiteTitle
    = `SchematicsManager: `
    + `cli: ${ cli }, `
    + `schematics: ${ sch }`;

  describe(suiteTitle, () => {
    let gui: AngularGUIApp;
    let schematics: SchematicsManager;

    beforeEach(async () => {
      gui = setupWithSchematics(cli, sch);
      schematics = gui.schematics;
    });

    it('should work', () => {
      throw null;

    });
  });

});
