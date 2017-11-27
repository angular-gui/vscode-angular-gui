import {
  basename,
  copyFile,
  copyFolder,
  dirname,
  existsSync,
  join,
  mkdirp,
  readFile,
  readFilep,
  readFiles,
  rmdirp,
  unlinkp,
  updateJson,
  writeFile
} from './helpers';
import {
  mkdirSync,
  rmdirSync,
  statSync
} from 'fs';

describe('file system helpers', () => {
  const root = join(__dirname, '..', '__testing__');

  beforeEach(() => mkdirSync(root));
  afterEach(() => rmdirSync(root));

  it('should run tests in "src/__testing__" folder', () => {
    expect(basename(root)).toBe('__testing__');
    expect(basename(dirname(root))).toBe('src');
    expect(existsSync(root)).toBe(true);
  });

  describe('rmdirp', () => {
    const folder = join(root, '__rmdirp__');
    beforeEach(() => mkdirSync(folder));

    it('should delete folder', async () => {
      await rmdirp(folder);
      expect(existsSync(folder)).toBe(false);
    });

    it('should not throw if folder does not exist', async () => {
      await rmdirp(folder);
      expect(existsSync(folder)).toBe(false);
      expect(async () => await rmdirp(folder)).not.toThrow();
    });

    it('should delete non-empty folder', async () => {
      mkdirSync(join(folder, '123'));
      mkdirSync(join(folder, '123', 'abc'));
      await rmdirp(folder);
      expect(existsSync(folder)).toBe(false);
    });
  });

  describe('mkdirp', () => {
    const folder = join(root, '__mkdirp__');
    afterEach(() => rmdirp(folder));

    it('should crete folder', async () => {
      expect(existsSync(folder)).toBe(false);
      await mkdirp(folder);
      expect(existsSync(folder)).toBe(true);
    });

    it('should not overwrite existing folder', async () => {
      expect(existsSync(folder)).toBe(false);
      await mkdirp(folder);
      expect(existsSync(folder)).toBe(true);

      const before = statSync(folder).birthtimeMs;
      await mkdirp(folder);
      await mkdirp(folder);
      const after = statSync(folder).birthtimeMs;

      expect(before).toEqual(after);
    });

    it('should create nested folder', async () => {
      const subfolder = join(folder, 'abc', '123')
      expect(existsSync(folder)).toBe(false);
      expect(existsSync(subfolder)).toBe(false);

      await mkdirp(subfolder)
      expect(existsSync(folder)).toBe(true);
      expect(existsSync(subfolder)).toBe(true);
      expect(basename(dirname(subfolder))).toEqual('abc')
    });
  });

  describe('writeFile', () => {
    const folder = join(root, '__writeFile__');
    afterEach(() => rmdirp(folder));

    it('should create file', async () => {
      const file = join(folder, 'abc', 'test.file');
      await writeFile(file, 'abc');
      expect(existsSync(file)).toBe(true);
    });
  });

  describe('unlinkp', () => {
    const folder = join(root, '__unlinkp__');
    const file = join(folder, 'abc', 'test.file');
    beforeEach(async () => await writeFile(file, 'abc'));
    afterEach(() => rmdirp(folder));

    it('should delete file', async () => {
      expect(existsSync(file)).toBe(true);
      await unlinkp(file);
      expect(existsSync(file)).toBe(false);
    });

    it('should not delete folder', async () => {
      expect(existsSync(file)).toBe(true);
      await unlinkp(folder);
      expect(existsSync(file)).toBe(true);
    });

    it('should not throw if file does not exist', () => {
      expect(async () => await unlinkp('...')).not.toThrow();
    });
  });

  describe('readFilep', () => {
    const folder = join(root, '__readFilep__');
    const file = join(folder, 'abc', 'test.file');
    afterEach(() => rmdirp(folder));

    it('should read file', async () => {
      await writeFile(file, 'abc');
      expect(existsSync(file)).toBe(true);
      expect(await readFilep(file)).toEqual('abc');
    });

    it('should return raw data for JSON stringified objects', async () => {
      const data = { abc: 123 };
      await writeFile(file, data);
      expect(await readFilep(file)).toEqual(JSON.stringify(data, null, 2));
    });
  });

  describe('readFile', () => {
    const folder = join(root, '__readFile__');
    const file = join(folder, 'abc', 'test.file');
    afterEach(() => rmdirp(folder));

    it('should return String', async () => {
      const data = 123;
      await writeFile(file, data);
      expect(await readFile(file)).toEqual(`${ data }`);
    });

    it('should return Object', async () => {
      const data = { abc: 123 };
      await writeFile(file, data);
      expect(await readFile(file)).toEqual(data);
    });

    it('should return Array', async () => {
      const data = [ { abc: 123 }];
      await writeFile(file, data);
      expect(await readFile(file)).toEqual(data);
    });
  });

  describe('readFiles', () => {
    const folder = join(root, '__readFiles__');
    afterEach(() => rmdirp(folder));

    it('should return map "{ filename: <data> }"', async () => {
      await writeFile(join(folder, 'abc', 'one.file'), 'abc');
      await writeFile(join(folder, 'def', 'xxx.xxxx'), null);
      await writeFile(join(folder, 'def', 'two.file'), 123);
      const expected = [
        { 'one.file': 'abc' },
        { 'two.file': '123' },
      ];
      expect(await readFiles(folder, '**/*.file')).toEqual(expected);
    });
  });

  describe('copyFile', () => {
    const folder = join(root, '__copyFile__');
    const file = join(folder, 'abc', 'test.file');
    afterEach(() => rmdirp(folder));

    it('should copy file to new location', async () => {
      await writeFile(file, '');
      await copyFile(file, join(folder, 'def'));
      expect(existsSync(join(folder, 'def', 'test.file'))).toBe(true);
      expect(existsSync(file)).toBe(true);
    });
  });

  describe('copyFolder', () => {
    const folder = join(root, '__copyFolder__');
    afterEach(() => rmdirp(folder));

    it('should copy folder by glob string to new location', async () => {
      await writeFile(join(folder, 'abc', 'def', 'one.file'), 'abc');
      await copyFolder(join(folder, 'abc/*'), join(folder, 'xxx'));
      expect(existsSync(join(folder, 'xxx', 'def', 'one.file'))).toBe(true);
    });

    it('should copy files by paths to new location', async () => {
      await writeFile(join(folder, 'abc', 'one.file'), 'abc');
      await writeFile(join(folder, 'def', 'xxx.xxxx'), null);
      await writeFile(join(folder, 'def', 'two.file'), 123);

      const paths = [
        join(folder, 'abc', 'one.file'),
        join(folder, 'def', 'two.file'),
      ];

      await copyFolder(paths, join(folder, 'xxx'));
      expect(existsSync(join(folder, 'xxx', 'one.file'))).toBe(true);
      expect(existsSync(join(folder, 'xxx', 'two.file'))).toBe(true);
      expect(existsSync(join(folder, 'xxx', 'xxx.xxxx'))).toBe(false);
    });
  });

  describe('updateJson', () => {
    const folder = join(root, '__updateJson__');
    const file = join(folder, 'abc', 'test.file');
    afterEach(() => rmdirp(folder));

    it('should update json data', async () => {
      await writeFile(file, { abc: 123 });
      await updateJson(file, o => {
        return { ...o, abc: 456 };
      });
      expect(await readFile(file)).toEqual({ abc: 456 });
    });
  });
});