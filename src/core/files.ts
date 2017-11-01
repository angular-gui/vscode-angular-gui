import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as shell from 'shelljs';

// import * as vscode from 'vscode';
// const vscode = require('vscode');
let ROOT;

export function root() {
  if (!ROOT) {
    try {
      const rootUri = require('vscode').workspace.workspaceFolders[ 0 ];
      ROOT = path.resolve(rootUri.uri.fsPath);
      throw null;
    } catch  {
      ROOT = path.resolve('.');
    }
  }

  return ROOT;
}

export function resolve(...values) {
  return path.resolve(root(), ...values);
}

//////////////////////////////////////////////////////////////
//#region fs helpers

function existsp(o) {
  return new Promise(res => {
    fs.exists(resolve(o), (exists) => res(exists));
  });
}

function globp(o) {
  return new Promise(res => {
    glob(`${ root() }/${ o }`, (error, matches) => res(error || matches));
  });
}

async function mkdirp(o) {
  return await existsp(o)
    ? true
    : await mkdirp(path.dirname(o))
      .then(() => new Promise(res =>
        fs.mkdir(resolve(o), (error) => res(error || true))));
}

async function readFilep(o) {
  return new Promise(res =>
    fs.readFile(resolve(o), 'utf-8', (error, data) => res(null || data)));
}

async function rmdirp(o) {
  return await existsp(o)
    ? new Promise(res =>
      fs.rmdir(resolve(o), (error) => res(error || true)))
    : true;
}

async function unlinkp(o) {
  return (await existsp(o))
    ? new Promise(res =>
      fs.unlink(resolve(o), (error) => res(error || true)))
    : true;
}

//#endregion
//////////////////////////////////////////////////////////////

export async function copyFile(filapath, folder) {
  const target = path.join(folder, path.basename(filapath));
  return writeFile(target, await readFilep(filapath));
}

export async function copyFolder(folderFrom, folderTo) {
  const files = await globp(`${ folderFrom }/**/*`) as string[];
  if (!files.length) { return files; }

  const target = resolve(folderTo);
  const folder = await mkdirp(target);
  if (folder !== true) { return folder; }

  shell.cp('-Ru', files, target);
}

export async function readFile(filepath) {
  const data = await readFilep(filepath) as string;
  return /^[\{|\[]/.test(data)
    ? JSON.parse(data)
    : data;
}

export async function readFiles(o) {
  const files = await globp(o) as string[];
  if (!files.length) { return files; }

  return Promise.all(files.map(o => readFile(o).then(data => {
    return { [ path.basename(o) ]: data };
  })))
}

export async function writeFile(filepath, data, backup = false): Promise<any> {
  const folder = await mkdirp(path.dirname(filepath));
  if (folder !== true) { return folder; }

  data = typeof data === 'object'
    ? JSON.stringify(data, null, 2)
    : data;

  return new Promise(res =>
    fs.writeFile(resolve(filepath), data, (error) => res(error || true)));
}

export async function updateJson<T>(filepath, transform: (o: T) => T, backup = false) {
  const data = await readFile(filepath);
  return writeFile(filepath, transform(data), backup);
}

export function createRunnerScript(rootDir) {
  const script = `script=$1\nshift\nsh ${ rootDir }/commands/$script.sh $@`;
  return writeFile(`${ rootDir }/.run.sh`, script);
}

export function hasRunnerScript(rootDir) {
  return existsp(`${ rootDir }/.run.sh`);  
}

export function saveCommandScript() {
}

export async function test() {
  console.log('testing file system', path.resolve('.'));
  // console.log('testing file system', path.resolve('node_modules/.ng-gui'));
  // console.log('testing file system', resolve('node_modules/.ng-gui'));
  // console.log(await fofDelete('.ng-gui'));
  // console.log(typeof await copyFile('.ng-gui/commands/test.sh', '.ng-gui'));
  // const data = [ 12, 3, 'abc', null ];
  // console.log(await readFiles('src/test/*'));

  // fs.exists(resolve('.ng-gui'), (exists) => {
  //   console.log(exists);
  //   if (exists) { return; }
  //   fs.mkdir(resolve('.ng-gui'), (error) => {
  //     console.log(error);
  //   })

  // })
}
