import { sort, type } from './utils';
import { build } from './build';

export const serve = {
  name: 'serve',
  description: 'Builds and serves your app, rebuilding on file changes.',
  aliases: [ 'server', 's' ],

  availableOptions: [
    {
      name: 'port',
      type: Number,
      default: 4200,
      aliases: [ 'p' ],
      description: 'Port to listen to for serving.'
    },
    {
      name: 'host',
      type: String,
      default: 'localhost',
      aliases: [ 'H' ],
      description: `Listens only on localhost by default.`
    },
    {
      name: 'proxy-config',
      type: 'Path',
      // default: serveConfigDefaults[ 'proxyConfig' ],
      aliases: [ 'pc' ],
      description: 'Proxy configuration file.'
    },
    {
      name: 'ssl',
      type: Boolean,
      // default: serveConfigDefaults[ 'ssl' ],
      description: 'Serve using HTTPS.'
    },
    {
      name: 'ssl-key',
      type: String,
      // default: serveConfigDefaults[ 'sslKey' ],
      description: 'SSL key to use for serving HTTPS.'
    },
    {
      name: 'ssl-cert',
      type: String,
      // default: serveConfigDefaults[ 'sslCert' ],
      description: 'SSL certificate to use for serving HTTPS.'
    },
    {
      name: 'open',
      type: Boolean,
      default: false,
      aliases: [ 'o' ],
      description: 'Opens the url in default browser.',
    },
    {
      name: 'live-reload',
      type: Boolean,
      default: true,
      aliases: [ 'lr' ],
      description: 'Whether to reload the page on change, using live-reload.'
    },
    {
      name: 'public-host',
      type: String,
      aliases: [ 'live-reload-client' ],
      description: 'Specify the URL that the browser client will use.'
    },
    {
      name: 'disable-host-check',
      type: Boolean,
      default: false,
      description: 'Don\'t verify connected clients are part of allowed hosts.',
    },
    {
      name: 'serve-path',
      type: String,
      description: 'The pathname where the app will be served.'
    },
    {
      name: 'hmr',
      type: Boolean,
      default: false,
      description: 'Enable hot module replacement.',
    },
    ...build.availableOptions
  ]
    .sort(sort('asc', o => o.name))
    .map(type)
};
