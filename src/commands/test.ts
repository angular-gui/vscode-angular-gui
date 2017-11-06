import { sort, type } from '../core/utils';

export const test = {
  name: 'test',
  aliases: [ 't' ],
  description: 'Run unit tests in existing project.',
  works: 'insideProject',

  availableOptions: [
    {
      name: 'watch',
      type: Boolean,
      aliases: [ 'w' ],
      description: 'Run build when files change.'
    },
    {
      name: 'code-coverage',
      type: Boolean,
      default: false,
      aliases: [ 'cc' ],
      description: 'Coverage report will be in the coverage/ directory.'
    },
    {
      name: 'config',
      type: 'Path',
      aliases: [ 'c' ],
      description: `Use a specific config file. Defaults to the karma config file in .angular-cli.json.`
    },
    {
      name: 'single-run',
      type: Boolean,
      aliases: [ 'sr' ],
      description: 'Run tests a single time.'
    },
    {
      name: 'progress',
      type: Boolean,
      // default: testConfigDefaults['progress'],
      description: 'Log progress to the console while in progress.'
    },
    {
      name: 'browsers',
      type: String,
      description: 'Override which browsers tests are run against.'
    },
    {
      name: 'colors',
      type: Boolean,
      description: 'Enable or disable colors in the output (reporters and logs).'
    },
    {
      name: 'log-level',
      type: String,
      description: 'Level of logging.'
    },
    {
      name: 'port',
      type: Number,
      description: 'Port where the web server will be listening.'
    },
    {
      name: 'reporters',
      type: String,
      description: 'List of reporters to use.'
    },
    {
      name: 'sourcemaps',
      type: Boolean,
      default: true,
      aliases: [ 'sm', 'sourcemap' ],
      description: 'Output sourcemaps.'
    },
    {
      name: 'poll',
      type: Number,
      // default: testConfigDefaults['poll'],
      description: 'Enable and define the file watching poll time period (milliseconds).'
    },
    {
      name: 'environment',
      type: String,
      aliases: [ 'e' ],
      description: 'Defines the build environment.',
    },
    {
      name: 'preserve-symlinks',
      type: Boolean,
      description: 'Do not use the real path when resolving modules.',
      // default: testConfigDefaults['preserveSymlinks']
    },
    {
      name: 'app',
      type: String,
      aliases: [ 'a' ],
      description: 'Specifies app name to use.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
