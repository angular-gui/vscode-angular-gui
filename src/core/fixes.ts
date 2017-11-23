import {
  CollectionCannotBeResolvedException,
  CollectionMissingSchematicsMapException,
  FileSystemCollectionDesc,
  FileSystemEngineHost
} from "@angular-devkit/schematics/tools";
import { existsSync, globSync, join } from './helpers';

export class GuiFileSystemEngineHost extends FileSystemEngineHost {
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
