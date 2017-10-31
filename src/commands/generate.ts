import { sort, type } from './utils';

export const generate = {
  name: 'generate',
  description: 'Generates and/or modifies files based on a schematic.',
  aliases: [ 'g' ],

  availableOptions: [
    {
      name: 'dry-run',
      type: Boolean,
      default: false,
      aliases: [ 'd' ],
      description: 'Run through without making any changes.'
    },
    {
      name: 'force',
      type: Boolean,
      default: false,
      aliases: [ 'f' ],
      description: 'Forces overwriting of files.'
    },
    {
      name: 'app',
      type: String,
      aliases: [ 'a' ],
      description: 'Specifies app name to use.'
    },
    {
      name: 'collection',
      type: String,
      aliases: [ 'c' ],
      description: 'Schematics collection to use.'
    },
    {
      name: 'lint-fix',
      type: Boolean,
      aliases: [ 'lf' ],
      description: 'Use lint to fix files after generation.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
