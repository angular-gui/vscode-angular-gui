import { sort, type } from './utils';

export const version = {
  name: 'version',
  description: 'Outputs Angular CLI version.',
  aliases: [ 'v', '--version', '-v' ],
  works: 'everywhere',

  availableOptions: [
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
