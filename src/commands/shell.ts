import { sort, type } from '../core/utils';

export const shell = {
  name: 'shell',
  description: 'Create custom shell commands.',

  availableOptions: [
    {
      name: 'app',
      type: String,
      aliases: [ 'a' ],
      description: 'Specifies app name or index to use.'
    },
    {
      name: 'command',
      type: String,
      description: 'Name of the shell command or program to execute.'
    },
    {
      name: 'file',
      type: 'Path',
      description: `Specify a file to be used as command argument.`
    },
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
