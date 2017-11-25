# GUI for Angular extension for Visual Studio Code

## Take charge of your Angular CLI projects!

GUI for Angular helps you manage your Angular CLI projects with ease! `angular-gui` extension connects your Angular CLI project with https://angular-gui.firebaseapp.com allowing you to excute CLI commands from browser.

## Features

* Overview of all available command options with configurable defaults
* Reusable scripts with easy access to common options
* Multiple schematics with ability to modify templates
* Custom commands with shared options interface and access to project defaults

![Beta release](https://raw.githubusercontent.com/angular-gui/vscode-angular-gui/master/src/images/angular-gui-beta-0.4.2.gif)

## Activation

Extension will be activated for Angular CLI projects (if there is a `.angular-cli.json` in project root). `.angular-cli.json` **is required** and it is used to generate configuration file for the client.

1. Start local server (listening on localhost:4300, by default) from:
    * status bar icon: ![shield icon](https://raw.githubusercontent.com/angular-gui/vscode-angular-gui/master/src/images/octicon-shield.png)
    * command palette: `GUI for Angular: Start in Online mode`
2. Open https://angular-gui.firebaseapp.com
3. Enjoy!

## Extension Settings

This extension contributes the following settings:

* `angular-gui.port`: Port for socket connection
* `angular-gui.rootDir`: Workspace folder for GUI for Angular commands and settings
* `angular-gui.npmRunner`: Name for the runner script that can be used to excute commands from terminal by name
* `angular-gui.commandOptions`: Command options' values and defaults
  * `environment`: list of available environments
  * `target`: list of available targets
  * `collection`: list of available schematic collections
  * `styleext`: list of available style extensions
* `angular-gui.commands`: List of commands that will be displayed in client app.

Default value will be set to the first item from the list.

You can add any other CLI command option to `angular-gui.commandOptions`, for example:

    "angular-gui.commandOptions.prefix": [
        "app", 
        "abc"
    ]

will replace `prefix` option input from **text input** to **select box** for all commands that have prefix option. 

---

## Known Issues

* Generate `@nrwl/schematics:app` is creating a wrong paths. Move files manually and update `.angular-cli.json`.

## TODO:

* Tests!

## Release notes and Change log

* [GUI for Angular VSCode Extension](https://github.com/angular-gui/vscode-angular-gui/blob/master/CHANGELOG.md)
* [GUI for Angular Client](https://github.com/angular-gui/client-angular-gui/blob/master/CHANGELOG.md)

## Feedback

Please use following repositories to report bugs, ask questions and give feedback:

* [GUI for Angular VSCode Extension](https://github.com/angular-gui/vscode-angular-gui/issues)
* [GUI for Angular Client](https://github.com/angular-gui/client-angular-gui/issues)