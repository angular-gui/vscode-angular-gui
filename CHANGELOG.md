# Change Log
All notable changes to the "angular-gui" extension will be documented in this file.

# Version 0.4.2: Minor fixes
* Fix: Race condition when rebuilding client configuration
* Fix: Check if file exists before opening it
* Fix: Don't include blueprints in configuration change check
* Fix: Use `forEach` instead of `subscribe` for action subject (fixes vscode's `TypeError: Converting circular structure to JSON`)

# Version 0.4.1: Minor fixes
* Fix: Update workspace and extension paths 
* Fix: Improved module resolution for generate command
* Fix: Improved handling of modified schematics
* Feature: Notify client about configuration changes

# Version 0.4.0: Beta release
## VSCode Extension
* Schematics: 
    * Run `express` schematic to set up serving from dist folder. Comes with support for gzip compression, and url rewrites.
    * Modify schematics templates and use them with generate command.
* Configuration:
    * Configure which commands appear in client app with `angular-gui.commands` VSCode setting
    * Improved notifications and messages

## Web Client
* Feature: Ability to run multiple commands in parallel
* Feature: Progress indicator for commands that emit progress
* Feature: Copy schematic files to your workspace and modify schematics templates

# Version 0.3.3:
* Fix: Open files from client with partial path

# Version 0.3.2:
* Fix: Module resolution for generate command
* Feature: Add `angular-gui` schematics (*experimental*: there's no way to execute these schematics yet)
* Add MIT licence

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
