import {
  CollectionCannotBeResolvedException,
  CollectionMissingSchematicsMapException,
  FileSystemCollectionDesc,
  FileSystemEngineHost
} from "@angular-devkit/schematics/tools";
import { copyFolder, existsSync, globSync, join } from './core/helpers';

import { AngularGUI } from './core/app';
import config from './core/config';
import { resolve } from 'path';

export function setupWithoutSchematics(workspaceRoot: string = '', extensionRoot: string = '') {
  config[ 'workspaceRoot' ] = resolve(__dirname, workspaceRoot);
  config[ 'extensionRoot' ] = resolve(__dirname, extensionRoot);
  return new AngularGUI(config, () => { });
}

export function setupWithSchematics(cli: string = '', sch: string = '') {
  config[ 'workspaceRoot' ] = resolve(__dirname, '..', 'files', `cli-${ cli }`);
  config[ 'extensionRoot' ] = resolve(__dirname, '..', 'files', '__extension__');

  const schematicsSource = resolve(__dirname, '..', 'files', `sch-${ sch }`, '*');
  const schematicsTarget = join(config[ 'workspaceRoot' ], 'node_modules');
  console.log(schematicsSource, schematicsTarget, config[ 'extensionRoot' ], config[ 'workspaceRoot' ]);
  copyFolder(schematicsSource, schematicsTarget);
  return new AngularGUI(config, () => { });
}

export const versions = [
  { cli: '1-5-4', sch: '0-1-7' },
];

export class TestEngineHost extends FileSystemEngineHost {
  constructor(protected _root: string) { super(_root); }

  protected _resolveCollectionPath(name: string): string {
    // Allow `${_root}/${name}.json` as a collection. 
    if (existsSync(join(this._root, name + '.json'))) {
      return join(this._root, name + '.json');
    }

    // Allow `${_root}/${name}/collection.json. 
    if (existsSync(join(this._root, name, 'collection.json'))) {
      return join(this._root, name, 'collection.json');
    }

    // Allow `${_root}/ ** /${name}/collection.json. 
    const collectionJsonPath = globSync(`${ name }/**/collection.json`, {
      cwd: this._root
    })[ 0 ];
    if (collectionJsonPath) {
      return join(this._root, collectionJsonPath);
    }

    throw new CollectionCannotBeResolvedException(name);
  }

  protected _transformCollectionDescription(
    name: string,
    desc: Partial<FileSystemCollectionDesc>,
  ): FileSystemCollectionDesc {
    if (!desc.schematics || typeof desc.schematics != 'object') {
      throw new CollectionMissingSchematicsMapException(name);
    }

    return { ...desc, name } as FileSystemCollectionDesc;
  }
} 