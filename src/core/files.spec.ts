import { existsSync, globSync, join, readFile, rmdirp, writeFile } from './helpers';
import { setupWithoutSchematics, versions } from '../test';

import { AngularGUIApp } from './app.interface';
import { FilesManager } from './files';

describe('FilesManager', () => {
  let gui: AngularGUIApp;
  let files: FilesManager;

  const workspaceRoot = 'test-workspace-root';
  const extensionRoot = 'test-extension-root';

  beforeEach(async () => {
    gui = setupWithoutSchematics(workspaceRoot, extensionRoot);
    await gui.initialize(gui.config);
    files = gui.files;
  });

  afterEach(async () => {
    await rmdirp(files.workspaceRoot);
    await rmdirp(files.extensionRoot);
  });

  it('should be created', () => {
    expect(files).toBeDefined();
  });

  describe('paths', () => {
    it('should set "extensionRoot"', () => {
      const path = `src\\${ extensionRoot }`;
      expect(files.extensionRoot.endsWith(path)).toBe(true)
    });
    it('should set "extensionProjectFolder"', () => {
      const path = `src\\${ extensionRoot }\\.angular-gui\\${ workspaceRoot }`;
      expect(files.extensionProjectFolder.endsWith(path)).toBe(true)
    });
    it('should set "workspaceRoot"', () => {
      const path = `src\\${ workspaceRoot }`;
      expect(files.workspaceRoot.endsWith(path)).toBe(true)
    });
    it('should set "workspaceRootDir"', () => {
      const path = `src\\${ workspaceRoot }\\.angular-gui`;
      expect(files.workspaceRootDir.endsWith(path)).toBe(true)
    });
    it('should set "workspaceCommandsFolder"', () => {
      const path = `src\\${ workspaceRoot }\\.angular-gui\\commands`;
      expect(files.workspaceCommandsFolder.endsWith(path)).toBe(true)
    });
    it('should set "workspaceSchematicsFolder"', () => {
      const path = `src\\${ workspaceRoot }\\.angular-gui\\schematics`;
      expect(files.workspaceSchematicsFolder.endsWith(path)).toBe(true)
    });
  });

  // CLIENT CONFIG
  describe('saveClientConfig(data)', () => {
    it('should save ".angular-gui.json" to extensionProjectFolder', async () => {
      const path = join(files.extensionProjectFolder, '.angular-gui.json');
      await files.saveClientConfig('');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('deleteClientConfig()', () => {
    it('should delete extensionProjectFolder', async () => {
      const path = join(files.extensionProjectFolder, '.angular-gui.json');
      await files.saveClientConfig('');
      expect(existsSync(path)).toBe(true);
      await files.deleteClientConfig()
      expect(existsSync(files.extensionProjectFolder)).toBe(false);
    });
  });

  describe('clientConfig', () => {
    it('should return data from  "extensionProjectFolder/.angular-gui.json"', async () => {
      const path = join(files.extensionProjectFolder, '.angular-gui.json');
      const data = { a: 1 };
      await files.saveClientConfig(data);
      expect(existsSync(path)).toBe(true);
      expect(await files.clientConfig).toEqual(data);
    });
  });

  // COMMAND SCRIPTS
  describe('saveCommand(name, data)', () => {
    it('should save command by name to workspaceCommandsFolder', async () => {
      const path = join(files.workspaceCommandsFolder, 'test.sh');
      await files.saveCommand('test', '');
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('deleteCommand(name)', () => {
    it('should delete command by name from workspaceCommandsFolder', async () => {
      const path = join(files.workspaceCommandsFolder, 'test.sh');
      await files.saveCommand('test', '');
      expect(existsSync(path)).toBe(true);
      await files.deleteCommand('test')
      expect(existsSync(path)).toBe(false);
      expect(existsSync(files.workspaceCommandsFolder)).toBe(true);
    });
  });

  describe('guiCommands', () => {
    it('should return list of "{ name: script }" maps from workspaceCommandsFolder', async () => {
      await files.saveCommand('test.one', 'a');
      await files.saveCommand('test.two', 'b');
      const data = [
        { 'test.one.sh': 'a' },
        { 'test.two.sh': 'b' },
      ];
      expect(await files.guiCommands).toEqual(data);
    });
  });

  // RUNNER SCRIPT
  describe('createRunnerScript()', () => {
    it('should create "workspaceRootDir/.runner.sh"', async () => {
      const path = join(files.workspaceRootDir, '.runner.sh');
      await files.createRunnerScript();
      expect(existsSync(path)).toBe(true);
    });
    it('should user "rootDir" from configuration', async () => {
      files = new FilesManager({ ...gui.config, rootDir: 'test' });
      const path = join(files.workspaceRootDir, '.runner.sh');
      await files.createRunnerScript();
      expect(await readFile(path))
        .toEqual(`script=$1\nshift\nsh test/commands/$script.sh $@`);
    });
    it('should update "package.json" if there are no scripts in it', () => {
      const data = files[ 'updateRunnerScript' ]({});
      expect(data.scripts[ '.' ])
        .toEqual('sh .angular-gui/.runner.sh');
    });
    it('should use "npmRunner" from configuration when updating "package.json"', () => {
      files = new FilesManager({ ...gui.config, npmRunner: 'test' });
      const data = files[ 'updateRunnerScript' ]({ scripts: {} });
      expect(data.scripts[ 'test' ])
        .toEqual('sh .angular-gui/.runner.sh');
    });
    it('should use "rootDir" from configuration when updating "package.json"', () => {
      files = new FilesManager({ ...gui.config, rootDir: 'test' });
      const data = files[ 'updateRunnerScript' ]({});
      expect(data.scripts[ '.' ])
        .toEqual('sh test/.runner.sh');
    });
    it('should not update "package.json" if script with same name exists', () => {
      const scripts = { '.': 'existing script' };
      const data = files[ 'updateRunnerScript' ]({ scripts });
      expect(data.scripts[ '.' ]).toEqual('existing script');
    });
  });

  describe('hasRunnerScript', () => {
    it('should return "false" when "workspaceRootDir/.runner.sh" does not exist', async () => {
      expect(await files.hasRunnerScript).toBe(false);
    });
    it('should return "true" when "workspaceRootDir/.runner.sh" exists', async () => {
      await files.createRunnerScript();
      expect(await files.hasRunnerScript).toBe(true);
    });
  });

  // MODIFIED SCHEMATICS
  describe('copyUserSchematics()', () => {
    it('should work when there are no user schematics', () => {
      expect(() => files.copyUserSchematics()).not.toThrow();
    });
    it('should copy schematics modified by user', async () => {
      const path = join(files.workspaceSchematicsFolder, 'test-blueprint');
      await writeFile(join(path, 'test.html'), '');
      await writeFile(join(path, '.changes.json'), { path: 'test-collection/test-blueprint' });

      const target = join(...[
        files.extensionRoot,
        'node_modules',
        'test-collection',
        'test-blueprint'
      ])
      await files.copyUserSchematics();
      expect(existsSync(join(target, 'test.html'))).toBe(true);
      expect(existsSync(join(target, '.changes.json'))).toBe(false);
    });
  });

  describe('packageJSON', () => {
    it('should return data from "package.json" of the extension', async () => {
      await writeFile(join(files.extensionRoot, 'package.json'), { VERSION: 'test' });
      expect((await files.packageJSON).VERSION).toBe('test');
    });
  });

  describe('copyProjectSchematics(collections: string[])', () => {
    const collections = [ 'collection-one', 'collection-two', 'angular-gui', 'colleciton-four' ];
    const fakeCollectionFiles = [
      'node_modules/collection-one/test.file',
      'node_modules/collection-one/collection.json',
      'node_modules/collection-one/blueprint/test.file',
      'node_modules/collection-one/blueprint/another.file',

      'node_modules/collection-two/scr/collection.json',
      'node_modules/collection-two/scr/blueprint/test.file',
      
      'node_modules/collection-three/collection.json',

      'schematics/blueprint/test.file',
    ];

    beforeEach(async () => {
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 0 ]), '');
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 1 ]), '');
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 2 ]), '');
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 3 ]), '');
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 4 ]), '');
      await writeFile(join(files.workspaceRoot, fakeCollectionFiles[ 5 ]), '');
      await writeFile(join(files.extensionRoot, fakeCollectionFiles[ 6 ]), '');
      await writeFile(join(files.extensionRoot, fakeCollectionFiles[ 7 ]), '');
    });

    it('should behave...', async () => {
      const expectedSource = globSync('**/*.*', { cwd: files.workspaceRoot });
      expect(expectedSource.length).toBe(6);

      await files.copyProjectSchematics(collections);
      const copied = globSync('**/*.*', { cwd: files.extensionRoot });
      const one = copied.filter(o => o.includes('collection-one'));
      const two = copied.filter(o => o.includes('collection-two'));
      const three = copied.filter(o => o.includes('angular-gui'));

      expect(one.length).toEqual(4);
      expect(two.length).toEqual(2);
      expect(three.length).toEqual(1);
    });
  });
});
