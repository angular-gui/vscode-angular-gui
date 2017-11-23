import { classify, omitBy } from './utils';
import { globSync, join, normalize } from './helpers';

import { FileSystemSchematicDesc } from "@angular-devkit/schematics/tools";

function transform(schematic: FileSystemSchematicDesc, options, cliConfig) {
  const blueprint: any
    = schematic.schemaJson.properties;

  const defaults: any
    = Object.entries(blueprint)
      .filter(([ name, option ]) =>
        'default' in option
        && option.default !== '')
      .reduce((dict, [ name, option ]) => ({
        ...dict,
        [ name ]: option.default
      }), {});

  const app
    = cliConfig.apps.find(a => a.name === options.app)
    || cliConfig.apps[ 0 ];

  return { app, blueprint, defaults };
}

function getModule(filename, root, source = '') {
  if (!filename) { return; }
  return globSync(`**/${ filename }`, {
    cwd: join(root, source)
  })[ 0 ];
}

export function generateCommandPaths(schematic: FileSystemSchematicDesc, options, cliConfig, rootDir) {
  const { app, blueprint, defaults }
    = transform(schematic, options, cliConfig);

  const sourceDir
    = !('sourceDir' in blueprint)
      ? null
      : ('appRoot' in blueprint)
        ? app.root
        : options.sourceDir || defaults.sourceDir;

  const path
    = !('path' in blueprint)
      ? null
      : options.path || defaults.path;

  const module
    = !('module' in blueprint)
      ? null
      : ('sourceDir' in blueprint)
        ? getModule(options.module, rootDir, sourceDir)
        : join(app.root, getModule(options.module, rootDir, app.root))

  const appRoot
    = module && sourceDir
      ? '.'
      : null;

  const skipImport
    = !('skipImport' in blueprint)
      ? null
      : options.module
        ? options.skipImport || defaults.skipImport
        : true;

  return omitBy({
    appRoot,
    module,
    path,
    skipImport,
    sourceDir,
  }, o => o === null);
}

export function generateCommandDefaults(schematic: FileSystemSchematicDesc, options, cliConfig) {
  const { app, blueprint, defaults }
    = transform(schematic, options, cliConfig);

  const htmlTemplate
    = !('htmlTemplate' in blueprint)
      ? null
      : `<!-- generated with angular-gui -->\n`
      + `<p>\n  ${ classify(options.name + '-' + schematic.name) } Works!\n</p>`;

  const viewEncapsulation
    = !('viewEncapsulation' in blueprint)
      ? null
      : options.viewEncapsulation || defaults.viewEncapsulation;

  const styleext
    = !('styleext' in blueprint)
      ? null
      : options.styleext
        ? options.styleext
        : cliConfig.defaults
          && cliConfig.defaults.styleExt
          ? cliConfig.defaults.styleExt
          : null;

  return omitBy({
    ...defaults,
    htmlTemplate,
    styleext,
    viewEncapsulation,
  }, o => o === null);
}

export function generateCommandValues(schematic: FileSystemSchematicDesc, options) {
  const blueprint: any
    = schematic.schemaJson.properties;

  return omitBy(options, (_, key) => !(key in blueprint));
}
