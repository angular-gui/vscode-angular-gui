import { sort, type } from './utils';

export const app = {
  name: 'new',
  aliases: [ 'n' ],
  description: `Creates a new directory and a new Angular app eg. "ng new [name]".`,
  works: 'outsideProject',

  availableOptions: [
    {
      name: 'dry-run',
      type: Boolean,
      default: false,
      aliases: [ 'd' ],
      description: `Run through without making any changes. Will list all files that would have been created when running "ng new".`
    },
    {
      name: 'verbose',
      type: Boolean,
      default: false,
      aliases: [ 'v' ],
      description: 'Adds more details to output logging.'
    },
    {
      name: 'link-cli',
      type: Boolean,
      default: false,
      aliases: [ 'lc' ],
      description: 'Automatically link the `@angular/cli` package.',
      hidden: true
    },
    {
      name: 'skip-install',
      type: Boolean,
      default: false,
      aliases: [ 'si' ],
      description: 'Skip installing packages.'
    },
    {
      name: 'skip-commit',
      type: Boolean,
      default: false,
      aliases: [ 'sc' ],
      description: 'Skip committing the first commit to git.'
    },
    {
      name: 'collection',
      type: String,
      aliases: [ 'c' ],
      description: 'Schematics collection to use.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
