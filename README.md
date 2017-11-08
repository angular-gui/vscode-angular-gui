# GUI for Angular extension for Visual Studio Code

Run Angular CLI from your browser!

`angular-gui` extension connects your Angular CLI project with https://angular-gui.firebaseapp.com allowing you to excute CLI commands from browser.

## Features

* Overview of all available command options
* Save and reuse commands
* Support for multiple schematics
* Access to command options that are locked in CLI
* Custom defaults for command options

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

Calling out known issues can help limit users opening duplicate issues against your extension.

## TO-DO:

* Smarter defaults for schematics options
* Better Feedback and Error Handling for executed commands
* Support for custom shell commands
* Tests!

## Release notes

You can checkout release notes and changes in [change log](#).