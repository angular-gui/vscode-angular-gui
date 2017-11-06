import { sort, type } from '../core/utils';

export const lint = {
  name: 'lint',
  aliases: [ 'l' ],
  description: 'Lints code in existing project.',
  works: 'insideProject',

  availableOptions: [
    {
      name: 'fix',
      type: Boolean,
      default: false,
      description: 'Fixes linting errors (may overwrite linted files).'
    },
    {
      name: 'type-check',
      type: Boolean,
      default: false,
      description: 'Controls the type check for linting.'
    },
    {
      name: 'force',
      type: Boolean,
      default: false,
      description: 'Succeeds even if there was linting errors.'
    },
    {
      name: 'format',
      aliases: [ 't' ],
      type: String,
      default: 'prose',
      values: [ 'prose', 'json', 'stylish', 'verbose', 'pmd', 'msbuild', 'checkstyle', 'vso', 'fileslist' ],
      description: `Output format (prose, json, stylish, verbose, pmd, msbuild, checkstyle, vso, fileslist).`
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
