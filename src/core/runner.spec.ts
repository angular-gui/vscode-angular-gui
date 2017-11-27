import 'rxjs/add/observable/throw';

import { setup, versions } from '../test';

import { AngularGUIApp } from './app.interface';
import { CommandRunner } from './runner';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

describe('CommandRunner', () => {
  let gui: AngularGUIApp;
  let runner: CommandRunner;

  const failure = [ 'failure', jasmine.any(Object) ];
  const output = [ 'output', jasmine.any(Object) ];
  const start = [ 'start', jasmine.any(Object) ];
  const success = [ 'success', jasmine.any(Object) ];

  beforeEach(async () => {
    gui = setup('');
    await gui.initialize(gui.config);
    runner = gui.runner;
  });

  it('should be created', () => {
    expect(runner).toBeDefined();
  });

  describe('connect(socket: SocketIO.Socket)', () => {
    it('should set the socket', () => {
      expect(runner.socket).not.toBeDefined();
      runner.connect(null);
      expect(runner.socket).toBeDefined();
    });
  });

  describe('disconnect()', () => {
    it('should clear the socket', () => {
      runner.connect({} as any);
      expect(runner.socket).toBeDefined();
      runner.disconnect();
      expect(runner.socket).toBeNull();
    });
  });

  it('should not do anything if the socket is not set', () => {
    expect(runner.processAction(null)).toBeUndefined();
    expect(runner.processCommand(null)).toBeUndefined();
    expect(runner[ 'emit' ](null, null, null)).toBeUndefined();
  });

  it('should emit if the socket is set', () => {
    const socket: any = jasmine.createSpyObj('socket', [ 'emit' ]);
    runner.connect(socket);
    runner[ 'emit' ](null, null, null);
    expect(runner.socket.emit).toHaveBeenCalledWith(null, { guid: null, message: null });
  });

  describe('processAction(command: Command)', () => {
    beforeEach(() => {
      spyOn(gui.schematics, 'cloneSchematic').and.returnValue(Promise.resolve(true));
      spyOn(gui.action, 'next');
      spyOn(gui, 'rebuild').and.returnValue(Promise.resolve(true));
      spyOn(runner[ 'converter' ], 'toHtml');

      const socket: any = jasmine.createSpyObj('socket', [ 'emit' ]);
      runner.connect(socket);
    });

    // UNKNOWN
    it('should emit "failure" for unknown command type', () => {
      const command: any = { type: null };
      runner.processAction(command);
      expect(runner.socket.emit).toHaveBeenCalledWith(...failure);
    });

    // CLONE
    it('should clone schematics when commad type is "clone"', () => {
      const command: any = { type: 'clone' };
      (runner.processAction(command) as any)
        .then(() => expect(gui.schematics.cloneSchematic).toHaveBeenCalledWith(command))
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...output))
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...success));
    });

    // OPEN
    it('should open document when commad type is "open"', () => {
      const command: any = { type: 'open' };
      runner.processAction(command);
      expect(gui.action.next).toHaveBeenCalledWith(command);
    });

    // REBUILD
    it('should open document when commad type is "rebuild"', () => {
      const command: any = { type: 'rebuild' };
      (runner.processAction(command) as any)
        .then(() => expect(gui.rebuild).toHaveBeenCalled())
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...success));
    });

    // __DEV__
    it('should ... when commad type is "__DEV__"', () => {
      runner.processAction({ type: '__DEV__' } as any);
    });

  });

  describe('processCommand(command: Command)', () => {
    beforeEach(() => {
      const socket: any = jasmine.createSpyObj('socket', [ 'emit' ]);
      runner.connect(socket);
    });

    // UNKNOWN
    it('should emit "failure" for unknown command type', () => {
      const command: any = { type: null };
      runner.processCommand(command);
      expect(runner.socket.emit).toHaveBeenCalledWith(...failure);
    });

    // DELETE
    it('should delete script when commad type is "delete"', () => {
      spyOn(gui.files, 'deleteCommand').and.returnValue(Promise.resolve(true));

      const command: any = { type: 'delete', name: '' };
      (runner.processCommand(command) as any)
        .then(() => expect(gui.files.deleteCommand).toHaveBeenCalled())
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...success));
    });

    // DELETE
    it('should emit "failure" when commad type is "delete"', () => {
      spyOn(gui.files, 'deleteCommand').and.returnValue(Promise.resolve(null));

      const command: any = { type: 'delete', name: '' };
      (runner.processCommand(command) as any)
        .then(() => expect(gui.files.deleteCommand).toHaveBeenCalled())
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...failure));
    });

    // SAVE
    it('should save script when commad type is "save"', () => {
      spyOn(gui.files, 'saveCommand').and.returnValue(Promise.resolve(true));

      const command: any = { type: 'save', name: '...', description: '...', script: '...' };
      (runner.processCommand(command) as any)
        .then(() => expect(gui.files.saveCommand).toHaveBeenCalled())
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...success));
    });

    // SAVE
    it('should emit "failure" when commad type is "save"', () => {
      spyOn(gui.files, 'saveCommand').and.returnValue(Promise.resolve(null));

      const command: any = { type: 'save', name: '' };
      (runner.processCommand(command) as any)
        .then(() => expect(gui.files.saveCommand).toHaveBeenCalled())
        .then(() => expect(runner.socket.emit).toHaveBeenCalledWith(...failure));
    });

    // GENERATE
    it('should generate blueprint and emit when commad type is "generate"', () => {
      const log = [ '', '' ];
      spyOn(gui.schematics, 'generateBlueprint').and.returnValue(of(log));

      const command: any = { type: 'generate', value: 'ng generate ...' };
      runner.processCommand(command);
      expect(gui.schematics.generateBlueprint).toHaveBeenCalledWith(command);
      expect(runner.socket.emit).toHaveBeenCalledWith(...start);
      expect(runner.socket.emit).toHaveBeenCalledWith(...output);
      expect(runner.socket.emit).toHaveBeenCalledWith(...success);
    });

    // GENERATE
    it('should emit "failure" when commad type is "generate"', () => {
      spyOn(gui.schematics, 'generateBlueprint').and.returnValue(Observable.throw(new Error()));

      const command: any = { type: 'generate', value: 'ng generate ...' };
      runner.processCommand(command);
      expect(gui.schematics.generateBlueprint).toHaveBeenCalledWith(command);
      expect(runner.socket.emit).toHaveBeenCalledWith(...failure);
    });

    // GENERATE NRWL APP
    it('should transform commad and excute it as script when command is "ng generate app"', () => {
      spyOn(runner as any, 'executeCommand');
      spyOn(gui.schematics, 'generateBlueprint');

      const command: any = {
        type: 'generate',
        value: 'ng generate app',
        options: [
          { name: 'name', value: 'test' },
          { name: 'dry-run', value: true },
        ]
      };

      const override = {
        type: 'generate',
        value: `ng generate app test`,
        options: [
          { name: 'dry-run', value: true },
        ],
        script: 'ng generate app test --dry-run true'
      };

      runner.processCommand(command);
      expect(gui.schematics.generateBlueprint).not.toHaveBeenCalled();
      expect(runner[ 'executeCommand' ]).toHaveBeenCalledWith(override);
    });
  });
});

versions.forEach(version => {
  const { cli, schematics, extension } = version;
  const suiteTitle
    = `CommandRunner: `
    + `cli: ${ cli }, `
    + `schematics: ${ schematics }, `
    + `extension: ${ extension }`;

  describe(suiteTitle, () => {
    let gui: AngularGUIApp;
    let runner: CommandRunner;

    // beforeEach(() => {
    //   gui = setup(`cli-${ cli }`);
    //   runner = gui.runner;
    // });
  });

});
