import { sort, type } from '../core/utils';

export const completion = {
  name: 'completion',
  description: 'Adds autocomplete functionality to `ng` commands and subcommands.',
  works: 'everywhere',

  availableOptions: [
    {
      name: 'all',
      type: Boolean,
      default: true,
      aliases: [ 'a' ],
      description: 'Generate a completion script compatible with both bash and zsh.'
    },
    {
      name: 'bash',
      type: Boolean,
      default: false,
      aliases: [ 'b' ],
      description: 'Generate a completion script for bash.'
    },
    {
      name: 'zsh',
      type: Boolean,
      default: false,
      aliases: [ 'z' ],
      description: 'Generate a completion script for zsh.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
