import { camelize, classify, normalize } from "@angular-devkit/core";

import { FileSystemSchematicDesc } from "@angular-devkit/schematics/tools";
import { findFiles } from "./helpers";
import { join } from 'path';
import { omitBy } from "./utils";

function processInputs(schematic: FileSystemSchematicDesc, options, cliConfig) {
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

function getModule(filename, root, source, path = '') {
  if (!filename) { return; }
  const modulePath = findFiles(`**/${ filename }`, {
    cwd: join(root, source, path)
  })[ 0 ];

  return path
    ? modulePath
    : join(source, modulePath);
}

export function generateCommandPaths(schematic: FileSystemSchematicDesc, options, cliConfig, rootDir) {
  const { app, blueprint, defaults }
    = processInputs(schematic, options, cliConfig);

  const sourceDir
    = !('sourceDir' in blueprint)
      ? null
      : app.root;

  const path
    = !('path' in blueprint)
      ? null
      : options.path || defaults.path;

  const module
    = !('module' in blueprint)
      ? null
      : getModule(options.module, rootDir, sourceDir || app.root, path);

  const skipImport
    = !('skipImport' in blueprint)
      ? null
      : options.module
        ? options.skipImport || defaults.skipImport
        : true;

  return omitBy({
    module,
    path,
    skipImport,
    sourceDir,
  }, o => o === null);
}

export function generateCommandDefaults(schematic: FileSystemSchematicDesc, options, cliConfig) {
  const { app, blueprint, defaults }
    = processInputs(schematic, options, cliConfig);

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
