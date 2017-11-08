# Change Log
All notable changes to the "angular-gui" extension will be documented in this file.

# Version 0.1.2: Alpha release

## Features:

### Reusable commands

You can save commands as shell scripts and reuse them. Commands are saved in workspace folder `.ng-gui/commands` and can be executed from shell, for example:

    sh .ng-gui/commands/build.test.sh

> Comming soon: NPM script to run commands by name

    npm run . build.test

### Overview of all available command options

Command options are taken from Angular CLI source code; `ng generate` command options are loaded directly from project schematics. Any option can be configured with custom defaults.

> Comming soon: Ability to set defaults in VSCode settings

### Support for multiple schematics

Schematics options are normalized and extended schematics are resolved.

> @nrwl/schematics are supported

# Version 0.0.1: Proof of concept

![Proof of concept](https://raw.githubusercontent.com/sasxa/vscode-angular-gui/master/src/images/angular-gui-alpha-0.0.1.gif)