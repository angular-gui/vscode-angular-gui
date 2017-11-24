import { sort, type } from '../core/utils';

export const shell = {
  name: 'shell',
  description: 'Create custom shell commands.',

  availableOptions: []
    .sort(sort('asc', o => o.name))
    .map(type)
};
