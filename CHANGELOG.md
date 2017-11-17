# Change Log
All notable changes to the "angular-gui" extension will be documented in this file.

# Version 0.3.0: Alpha release

## VSCode Extension

* Feature: Add ability to open files from client
* Fix: `commandOptions.environment` defaults are set to `['dev', 'prod']`
* Refactor: generate command options

## Web Client
* Feature: Open files from output panel in VSCode
* Design: Highlight important command options
* Design: Hide progress messages in output
* Fix: Generated command scripts can be correctly executed

# Version 0.2.0: Alpha release

* Emit notifications and error messages for commands
* Add ability to configure options and set defaults in VSCode settings
* Add npm script to run saved commands

You can now run saved commands by name, with:

    npm run . build.test

# Version 0.1.4: Minor fixes

* Workaround for `ng generate` issue with `engineHost.registerOptionsTransform()` [#266](https://github.com/angular/devkit/issues/266)
* Add support for multiple VSCode workspaces

# Version 0.1.3: Minor fixes

* Add `completion`, `e2e` and `eject` commands
* Remove `doc` and `version` commands
* Change default extension folder to `.angular-gui`

# Version 0.1.2: Alpha release
## Features:

**Reusable commands**

You can save commands as shell scripts and reuse them. Commands are saved in workspace folder `.angular-gui/commands` and can be executed from shell, for example:

    sh .angular-gui/commands/build.test.sh

**Overview of all available command options**

Command options are taken from Angular CLI source code; `ng generate` command options are loaded directly from project schematics. Any option can be configured with custom defaults.

**Support for multiple schematics**

Schematics options are normalized and extended schematics are resolved.

> @nrwl/schematics are supported
