'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { AngularGUI, test } from './core';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "angular-gui" is now active!');

  // TODO: use vscode configuration
  const gui = new AngularGUI({ port: 4321, rootDir: '.ng-gui' });

  const output = vscode.window.createOutputChannel('Angular GUI');
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

  function log(message) {
    output.appendLine(message);
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
      gui.start(toggleStatus, log));

  const disconnect = vscode.commands
    .registerCommand('extension.disconnect', () =>
      gui.stop(toggleStatus));

  context.subscriptions.push(offline, online, status);
  // test();
}

// this method is called when your extension is deactivated
export function deactivate() {
}