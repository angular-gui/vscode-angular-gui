import * as http from 'http';

import { setupWithoutSchematics, versions } from '../test';

import { AngularGUI } from './app';
import { AngularGUIApp } from './app.interface';

describe('AngularGUI', () => {
  let gui: AngularGUIApp;

  beforeEach(() => {
    gui = setupWithoutSchematics();
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

