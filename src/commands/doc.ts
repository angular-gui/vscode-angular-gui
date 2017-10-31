import { sort, type } from './utils';

export const doc = {
  name: 'doc',
  description: 'Opens the official Angular API documentation for a given keyword.',
  works: 'everywhere',

  availableOptions: [
    {
      name: 'search',
      aliases: [ 's' ],
      type: Boolean,
      default: false,
      description: 'Search whole angular.io instead of just api.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
