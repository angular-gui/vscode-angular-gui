# GUI for Angular extension for Visual Studio Code

Run Angular CLI from your browser!

`angular-gui` extension connects your Angular CLI project with https://angular-gui.firebaseapp.com allowing you to excute CLI commands from browser.

## Features

* Overview of all available command options
* Save and reuse commands
* Support for multiple schematics
* Access to command options that are locked in CLI
* Custom defaults for command options

![Alpha release](https://raw.githubusercontent.com/sasxa/vscode-angular-gui/master/src/images/angular-gui-alpha-0.1.2.gif)

## Installation and Usage

1. To install extension, [download VSIX file](https://raw.githubusercontent.com/sasxa/vscode-angular-gui/master/angular-gui-0.1.2.vsix) and install it with VSCode command `Extensions: Install from VSIX...` from **Command Palette**, [more info](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix). 

2. Extension will be activated for Angular CLI projects (if there is a `.angular-cli.json` in project root).

3. Start local server (listening on localhost:4300) by clicking on shild icon in VSCode status bar, or with VSCode command `GUI for Angular: Start in Online mode` from **Command Palette**.

4. Open https://angular-gui.firebaseapp.com

5. Enjoy!

## Extension Settings

> Extension Settings for `angular-gui` will be available in next release.

This extension contributes the following settings:

* `angular-gui.port`: port for Socket connection
* `angular-gui.rootDir`: folder for extension files
* `angular-gui.options`: options for selected CLI settings
  * `environment`: list of available environments
  * `target`: list of available targets
  * `collection`: list of available schematic collections
  * `styleext`: list of available style extensions

Default value will be set to the first item from the list.

You can add any other CLI command option to `angular-gui.options`, for example:

    "angular-gui.options.prefix": [
        "app", 
        "abc"
    ]

will replace `prefix` option input from **text input** to **select box** for all commands that have prefix option. 

---

## Known Issues

* Possible memory leak with `ng generate`.
* Commands should work for *happy-path*, there are no error messages or notifications. 

## TO-DO:

* Smarter defaults for schematics options
* Better Feedback and Error Handling for executed commands
* Support for custom shell commands
* Tests!

## Release notes

You can checkout release notes and changes in [change log](https://github.com/sasxa/vscode-angular-gui/blob/master/CHANGELOG.md).