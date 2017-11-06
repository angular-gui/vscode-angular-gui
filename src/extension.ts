'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as path from 'path';
import * as vscode from 'vscode';

import { AngularGUI, defaultConfiguration as config } from './core';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "angular-gui" is now active!');
  
  // TODO: use vscode configuration
  try {
    const rootUri = vscode.workspace.workspaceFolders[ 0 ];
    config[ 'workspaceRoot' ] = rootUri.uri.fsPath;
    config[ 'extensionRoot' ] = path.resolve(__dirname, '..');
  } catch  {
    config[ 'workspaceRoot' ] = config[ 'extensionRoot' ] = path.resolve(__dirname, '..');
  }

  const output = vscode.window.createOutputChannel('Angular GUI');
  function logger(message) {
    output.appendLine(message);
  }

  const gui = new AngularGUI(config, logger);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  status.text = '$(shield)';
  toggleStatus(false);
  status.show();

  function toggleStatus(connected: boolean) {
    if (connected === true) {
      status.command = 'extension.disconnect';
      status.tooltip = 'Angular GUI connected (click to disconnect)'
      status.color = '#2dcae2';
    } else if (connected === null) {
      status.command = 'extension.disconnect';
      status.tooltip = 'Waiting for connection (click to disconnect)';
      status.color = '#edb834';
    } else {
      status.command = 'extension.connectOnline';
      status.tooltip = 'Start Angular GUI';
      status.color = null;
    }
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const offline = vscode.commands
    .registerCommand('extension.connectOffline', () => {
      vscode.window.showWarningMessage('This feature is not available.');
    });

  // const { server, socket } = start({ port: 4321 }, output);
  const online = vscode.commands
    .registerCommand('extension.connectOnline', () =>
      gui.start(toggleStatus));

  const disconnect = vscode.commands
    .registerCommand('extension.disconnect', () =>
      gui.stop(toggleStatus));

  const rebuild = vscode.commands
    .registerCommand('extension.rebuildConfiguration', () => {
      vscode.window.showInformationMessage('Rebuilding Schematics and updating Client Configuration.')
        .then(() => gui.rebuild())
        .then(() => vscode.window.showInformationMessage('Rebuilding complete.'))
        .then(() => gui.socket.emit('reload'));
    });

  context.subscriptions.push(offline, online, rebuild, status);
}

// this method is called when your extension is deactivated
export function deactivate() {
}