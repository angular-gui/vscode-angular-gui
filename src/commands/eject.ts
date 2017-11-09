import { sort, type } from '../core/utils';

import { build } from './build';

export const eject = {
  name: 'eject',
  description: 'Ejects your app and output the proper webpack configuration and scripts.',

  availableOptions: [
    {
      name: 'force',
      type: Boolean,
      description: 'Overwrite any webpack.config.js and npm scripts already existing.'
    },
    {
      name: 'app',
      type: String,
      aliases: ['a'],
      description: 'Specifies app name to use.'
    },
    ...build.availableOptions
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
