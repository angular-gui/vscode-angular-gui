import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as shell from 'shelljs';

//////////////////////////////////////////////////////////////
//#region fs helpers

export function existsp(o) {
  return new Promise(res => {
    fs.exists(path.resolve(o), (exists) => res(exists));
  });
}

export function globp(folder, pattern): Promise<string[]> {
  return new Promise(res => {
    glob(`${ folder }/${ pattern }`, (error, matches) =>
      res(error as any || matches));
  });
}

export async function mkdirp(o) {
  return await existsp(o)
    ? true
    : await mkdirp(path.dirname(o))
      .then(() => new Promise(res =>
        fs.mkdir(path.resolve(o), (error) => res(error || true))));
}

export async function readFilep(o) {
  return new Promise(res =>
    fs.readFile(path.resolve(o), 'utf-8', (error, data) =>
      res(null || data)));
}

export async function rmdirp(o) {
  return await existsp(o)
    ? new Promise(res =>
      fs.rmdir(path.resolve(o), (error) => res(error || true)))
    : true;
}

export async function unlinkp(o) {
  return (await existsp(o))
    ? new Promise(res =>
      fs.unlink(path.resolve(o), (error) => res(error || true)))
    : true;
}

//#endregion
//////////////////////////////////////////////////////////////

export async function copyFile(filapath, folder) {
  const target = path.join(folder, path.basename(filapath));
  return writeFile(target, await readFilep(filapath));
}

export async function copyFolder(folderFrom, folderTo) {
  const target = path.resolve(folderTo);
  const folder = await mkdirp(target);
  if (folder !== true) { return folder; }

  try {
    shell.cp('-Ru', folderFrom, target);
    return Promise.resolve(true);
  } catch (error) {
    return Promise.resolve(error);
  }
}

export async function readFile(filepath) {
  const data = await readFilep(filepath) as string;
  return /^[\{|\[]/.test(data)
    ? JSON.parse(data)
    : data;
}

export async function readFiles(folder, pattern) {
  const files = await globp(folder, pattern) as string[];
  if (!files.length) { return files; }

  return Promise.all(files.map(o => readFile(o).then(data => {
    return { [ path.basename(o) ]: data };
  })))
}

export function findFiles(pattern: string, options?: glob.IOptions) {
  return glob.sync(pattern, options);
}

export async function writeFile(filepath, data, backup = false): Promise<any> {
  const folder = await mkdirp(path.dirname(filepath));
  if (folder !== true) { return folder; }

  data = typeof data === 'object'
    ? JSON.stringify(data, null, 2)
    : data;

  return new Promise(res =>
    fs.writeFile(path.resolve(filepath), data, (error) => res(error || true)));
}

export async function updateJson<T>(filepath, transform: (o: T) => T, backup = false) {
  const data = await readFile(filepath);
  const updated = transform(data);
  return updated
    ? writeFile(filepath, updated, backup)
    : Promise.resolve(true);
}
