import { sort, type } from '../core/utils';

import { serve } from './serve';

export const e2e = {
  name: 'e2e',
  aliases: [ 'e' ],
  description: 'Run e2e tests in existing project.',
  works: 'insideProject',

  availableOptions: [
    {
      name: 'config',
      type: String,
      aliases: [ 'c' ],
      description: `Use a specific config file.`
        + `Defaults to the protractor config file in angular-cli.json.`
    },
    {
      name: 'specs',
      type: Array,
      default: [],
      aliases: [ 'sp' ],
      description: `Override specs in the protractor config.`
        + `Can send in multiple specs by repeating flag (ng e2e --specs=spec1.ts --specs=spec2.ts).`
    },
    {
      name: 'element-explorer',
      type: Boolean,
      default: false,
      aliases: [ 'ee' ],
      description: 'Start Protractor\'s Element Explorer for debugging.'
    },
    {
      name: 'webdriver-update',
      type: Boolean,
      default: true,
      aliases: [ 'wu' ],
      description: 'Try to update webdriver.'
    },
    {
      name: 'serve',
      type: Boolean,
      default: true,
      aliases: [ 's' ],
      description: `Compile and Serve the app.`
        + `All non-reload related serve options are also available (e.g. --port=4400).`
    },
    ...serve.availableOptions
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
