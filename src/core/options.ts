import { camelize, classify, normalize } from "@angular-devkit/core";

import { FileSystemSchematicDesc } from "@angular-devkit/schematics/tools";
import { join } from 'path';
import { omitBy } from "./utils";

function processInputs(schematic: FileSystemSchematicDesc, guiOptions = [], cliConfig) {
  const blueprint: any
    = schematic.schemaJson.properties;

  const defaults: any
    = Object.entries(blueprint)
      .filter(([ name, option ]) => 'default' in option)
      .reduce((dict, [ name, option ]) => ({
        ...dict,
        [ name ]: option.default
      }), {});

  const options
    = guiOptions.reduce((dict, option) =>
      ({ ...dict, [ camelize(option.name) ]: option.value }), {});

  const app
    = cliConfig.apps.find(a => a.name === options.app)
    || cliConfig.apps[ 0 ];

  return { app, blueprint, defaults, options };
}

export function generateCommandPaths(schematic: FileSystemSchematicDesc, guiOptions = [], cliConfig) {
  const { app, blueprint, defaults, options }
    = processInputs(schematic, guiOptions, cliConfig);

  const sourceDir
    = !('sourceDir' in blueprint)
      ? null
      : app.root;

  const path
    = !('path' in blueprint)
      ? null
      : options.path || defaults.path;

  const appRoot
    = normalize(app.root).split('/').concat('').map(o => '..').join('/') + '/' + path;

  const module
    = !('module' in blueprint)
      ? null
      : appRoot + '/' + options.module;

  const skipImport
    = !('skipImport' in blueprint)
      ? null
      : options.module
        ? !!options.skipImport
        : true;

  return omitBy({
    // appRoot,
    // module,
    path,
    skipImport: true,
    sourceDir,
  }, o => o === null);
}

export function generateCommandDefaults(schematic: FileSystemSchematicDesc, guiOptions = [], cliConfig) {
  const { app, blueprint, defaults, options }
    = processInputs(schematic, guiOptions, cliConfig);

  const htmlTemplate
    = !('htmlTemplate' in blueprint)
      ? null
      : `<!-- generated with angular-gui -->\n`
      + `<p>\n  ${ classify(options.name + '-' + schematic.name) } Works!\n</p>`;

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
  }, o => o === null);
}

export function generateCommandValues(schematic: FileSystemSchematicDesc, guiOptions = [], cliConfig) {
  const blueprint: any
    = schematic.schemaJson.properties;

  return guiOptions
    .filter(option =>
      camelize(option.name) in blueprint)
    .reduce((dict, option) => ({
      ...dict,
      [ camelize(option.name) ]: option.value
    }), {});
}
