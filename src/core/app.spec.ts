import { setup, versions } from '../test';

import { AngularGUI } from './app';
import { AngularGUIApp } from './app.interface';

versions.forEach(version => {
  const { cli, schematics, extension } = version;
  const suiteTitle
    = `AngularGUI: `
    + `cli: ${ cli }, `
    + `schematics: ${ schematics }, `
    + `extension: ${ extension }`;

  describe(suiteTitle, () => {
    let gui: AngularGUIApp;

    beforeEach(() => {
      gui = setup(`cli-${ cli }`);
    });

    it('should be created', () => {
      expect(gui).toBeDefined();
    });

    it('should initialize files manager', async () => {
      expect(gui.files).not.toBeDefined();
      await gui.initialize(gui.config);

      expect(gui.files).toBeDefined();
    });

    it('should initialize schematics manager', async () => {
      expect(gui.schematics).not.toBeDefined();
      await gui.initialize(gui.config);

      expect(gui.schematics).toBeDefined();
    });
  });

});

