'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import { join, resolve } from 'path';

import { AngularGUI } from './core/app';
import { defaultConfiguration } from './core/config';
import { normalize } from "@angular-devkit/core";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let subscription;

  const config
    = vscode.workspace.getConfiguration()
      .get('angular-gui', defaultConfiguration);

  try {
    const rootUri = vscode.workspace.workspaceFolders[ 0 ];
    config[ 'workspaceRoot' ] = rootUri.uri.fsPath;
    config[ 'extensionRoot' ] = resolve(__dirname, '..');
  } catch  {
    return vscode.window.showErrorMessage('FATAL ERROR: Cannot access workspace.');
  }

  const output = vscode.window.createOutputChannel('GUI for Angular');
  const gui = new AngularGUI(config, message => output.appendLine(message));
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  status.text = '$(shield)';

  function toggleStatus(value: 'listening' | 'connected' | 'disconnected') {
    if (value === 'connected') {
      status.command = 'extension.disconnect';
      status.tooltip = 'GUI for Angular connected (click to disconnect)'
      status.color = '#5f7c8a';
    } else if (value === 'listening') {
      status.command = 'extension.disconnect';
      status.tooltip = 'Waiting for connection (click to disconnect)';
      status.color = '#ffc107';
    } else if (value === 'disconnected') {
      status.command = 'extension.connectOnline';
      status.tooltip = 'Start GUI for Angular';
      status.color = null;
    }
  }

  function openDocumnent(path) {
    const fullPath
      = normalize(path).startsWith(normalize(config[ 'workspaceRoot' ]))
        ? path
        : normalize(join(config[ 'workspaceRoot' ], path));

    vscode.workspace
      .openTextDocument(fullPath)
      .then(doc => vscode.window.showTextDocument(doc))
  }

  function processAction(action) {
    switch (action.type) {
      case 'open':
        return openDocumnent(action.payload);
    }
  }

  toggleStatus('disconnected');
  status.show();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const offline = vscode.commands
    .registerCommand('extension.connectOffline', () =>
      vscode.window.showWarningMessage('This feature is not available.'));

  // const { server, socket } = start({ port: 4321 }, output);
  const online = vscode.commands
    .registerCommand('extension.connectOnline', () =>
      subscription = gui.start(toggleStatus)
        .subscribe(processAction));

  const disconnect = vscode.commands
    .registerCommand('extension.disconnect', () => {
      gui.stop(toggleStatus);
      if (subscription) { subscription.unsubscribe(); }
    });

  const rebuild = vscode.commands
    .registerCommand('extension.rebuildConfiguration', () =>
      vscode.window.showInformationMessage('Rebuilding Schematics and updating Client Configuration.')
        .then(() => gui.rebuild())
        .then(() => vscode.window.showInformationMessage('Rebuilding complete.'))
        .then(() => gui.socket.emit('reload')));

  context.subscriptions.push(offline, online, rebuild, status);
}

// this method is called when your extension is deactivated
export function deactivate() {
}