import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as shell from 'shelljs';

export { normalize } from '@angular-devkit/core';

export const basename = path.basename;
export const dirname = path.dirname;
export const join = path.join;
export const resolve = path.resolve;
export const existsSync = fs.existsSync;
export const globSync = glob.sync;

//////////////////////////////////////////////////////////////
//#region fs helpers

export async function mkdirp(o) {
  return existsSync(o)
    ? true
    : await mkdirp(dirname(o))
      .then(() => new Promise(res =>
        fs.mkdir(resolve(o), (error) => res(error || true))));
}

export async function readFilep(o) {
  return new Promise(res =>
    fs.readFile(resolve(o), 'utf-8', (error, data) =>
      res(null || data)));
}

export async function rmdirp(o) {
  const folder = resolve(o);
  if (existsSync(folder)) {
    shell.mv(folder, folder + '_');
    shell.rm('-rf', folder + '_');
  }
}

export async function unlinkp(o) {
  return existsSync(o)
    ? new Promise(res =>
      fs.unlink(resolve(o), (error) => res(error || true)))
    : true;
}

//#endregion
//////////////////////////////////////////////////////////////

export async function copyFile(filapath, folder) {
  const target = join(folder, basename(filapath));
  return writeFile(target, await readFilep(filapath));
}

export async function copyFolder(folderFrom, folderTo) {
  const target = resolve(folderTo);
  const folder = await mkdirp(target);
  if (folder !== true) { return folder; }

  const shouldCopy
    = typeof folderFrom === 'string'
      ? globSync(folderFrom).length
      : folderFrom.length;

  if (shouldCopy) {
    shell.cp('-Ru', folderFrom, target);
  }
}

export async function readFile(filepath) {
  const data = await readFilep(filepath) as string;
  return /^[\{|\[]/.test(data)
    ? JSON.parse(data)
    : data;
}

export async function readFiles(folder, pattern) {
  const files
    = globSync(pattern, { cwd: folder })
      .map(file => join(folder, file));

  return Promise.all(files.map(o => readFile(o).then(data => {
    return { [ basename(o) ]: data };
  })));
}

export async function writeFile(filepath, data, backup = false): Promise<any> {
  const folder = await mkdirp(dirname(filepath));
  if (folder !== true) { return folder; }

  data = typeof data === 'object'
    ? JSON.stringify(data, null, 2)
    : data;

  return new Promise(res =>
    fs.writeFile(resolve(filepath), data, (error) => res(error || true)));
}

export async function updateJson<T>(filepath, transform: (o: T) => T, backup = false) {
  const data = await readFile(filepath);
  const updated = transform(data);
  return updated
    ? writeFile(filepath, updated, backup)
    : true;
}
