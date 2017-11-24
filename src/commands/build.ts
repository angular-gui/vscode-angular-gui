import { sort, type } from '../core/utils';

export const build = {
  name: 'build',
  description: 'Builds your app and places it into the output path.',
  aliases: [ 'b' ],

  availableOptions: [
    {
      name: 'stats-json',
      type: Boolean,
      default: false,
      description: 'Generates a \`stats.json\` file which can be analyzed using tools'
      + 'such as: \`webpack-bundle-analyzer\` or https://webpack.github.io/analyse.'
    },
    {
      name: 'target',
      type: String,
      default: 'development',
      aliases: [ 't', { 'dev': 'development' }, { 'prod': 'production' }],
      description: 'Defines the build target.',
    },
    {
      name: 'environment',
      type: String,
      aliases: [ 'e' ],
      description: 'Defines the build environment.',
    },
    {
      name: 'output-path',
      type: String,
      aliases: [ 'op' ],
      description: 'Path where output will be placed.'
    },
    {
      name: 'aot',
      default: false,
      type: Boolean,
      description: 'Build using Ahead of Time compilation.'
    },
    {
      name: 'sourcemaps',
      type: Boolean,
      aliases: [ 'sm', 'sourcemap' ],
      description: 'Output sourcemaps.',
      // default: buildConfigDefaults[ 'sourcemaps' ]
    },
    {
      name: 'vendor-chunk',
      type: Boolean,
      aliases: [ 'vc' ],
      description: 'Use a separate bundle containing only vendor libraries.',
      default: true,
    },
    {
      name: 'common-chunk',
      type: Boolean,
      default: true,
      aliases: [ 'cc' ],
      description: 'Use a separate bundle containing code used across multiple bundles.'
    },
    {
      name: 'base-href',
      type: String,
      aliases: [ 'bh' ],
      description: 'Base url for the application being built.',
      // default: buildConfigDefaults[ 'baseHref' ]
    },
    {
      name: 'deploy-url',
      type: String,
      aliases: [ 'd' ],
      description: 'URL where files will be deployed.'
    },
    {
      name: 'verbose',
      type: Boolean,
      default: false,
      aliases: [ 'v' ],
      description: 'Adds more details to output logging.'
    },
    {
      name: 'progress',
      type: Boolean,
      aliases: [ 'pr' ],
      description: 'Log progress to the console while building.',
      default: true,
    },
    {
      name: 'i18n-file',
      type: String,
      description: 'Localization file to use for i18n.'
    },
    {
      name: 'i18n-format',
      type: String,
      default: 'xlf',
      values: [ 'xmb', 'xlf' ],
      description: 'Format of the localization file specified with --i18n-file.'
    },
    {
      name: 'locale',
      type: String,
      description: 'Locale to use for i18n.'
    },
    {
      name: 'missing-translation',
      type: String,
      description: 'How to handle missing translations for i18n.',
      values: [ 'error', 'warning', 'ignore' ],
    },
    {
      name: 'extract-css',
      type: Boolean,
      aliases: [ 'ec' ],
      description: 'Extract css from global styles onto css files instead of js ones.'
    },
    {
      name: 'watch',
      type: Boolean,
      default: false,
      aliases: [ 'w' ],
      description: 'Run build when files change.'
    },
    {
      name: 'output-hashing',
      type: String,
      values: [ 'none', 'all', 'media', 'bundles' ],
      description: 'Define the output filename cache-busting hashing mode.',
      aliases: [ 'oh' ]
    },
    {
      name: 'poll',
      type: Number,
      description: 'Enable and define the file watching poll time period (milliseconds).',
      // default: buildConfigDefaults[ 'poll' ]
    },
    {
      name: 'app',
      type: String,
      aliases: [ 'a' ],
      description: 'Specifies app name or index to use.'
    },
    {
      name: 'delete-output-path',
      type: Boolean,
      aliases: [ 'dop' ],
      description: 'Delete output path before build.',
      default: true,
    },
    {
      name: 'preserve-symlinks',
      type: Boolean,
      description: 'Do not use the real path when resolving modules.',
      // default: buildConfigDefaults[ 'preserveSymlinks' ]
    },
    {
      name: 'extract-licenses',
      type: Boolean,
      default: true,
      description: 'Extract all licenses in a separate file, in the case of production builds only.'
    },
    {
      name: 'show-circular-dependencies',
      type: Boolean,
      aliases: [ 'scd' ],
      description: 'Show circular dependency warnings on builds.',
      // default: buildConfigDefaults[ 'showCircularDependencies' ]
    },
    {
      name: 'build-optimizer',
      type: Boolean,
      description: 'Enables @angular-devkit/build-optimizer optimizations when using `--aot`.'
    },
    {
      name: 'named-chunks',
      type: Boolean,
      aliases: [ 'nc' ],
      description: 'Use file name for lazy loaded chunks.',
      // default: buildConfigDefaults[ 'namedChunks' ]
    },
    {
      name: 'subresource-integrity',
      type: Boolean,
      default: false,
      aliases: [ 'sri' ],
      description: 'Enables the use of subresource integrity validation.'
    },
    {
      name: 'bundle-dependencies',
      type: String,
      values: [ 'none', 'all' ],
      default: 'none',
      description: 'Available on server platform only. Which external dependencies to bundle into '
      + 'the module. By default, all of node_modules will be kept as requires.'
    }
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};

