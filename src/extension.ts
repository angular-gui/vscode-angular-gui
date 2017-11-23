'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';

import { join, normalize, resolve } from './core/helpers';

import { AngularGUI } from './core/app';
import { MESSAGE } from './core/messages';
import { defaultConfiguration } from './core/config';

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
    return vscode.window.showErrorMessage(MESSAGE.WORKSPACE_UNAVAILABLE);
  }

  const output
    = vscode.window.createOutputChannel('GUI for Angular');
  const gui
    = new AngularGUI(config, message => output.appendLine(message));
  const status
    = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  status.text = MESSAGE.STATUS_TEXT;

  function statusUpdate(value: 'listening' | 'connected' | 'disconnected') {
    if (value === 'connected') {
      status.command = 'extension.disconnect';
      status.tooltip = `${ MESSAGE.STATUS_CONNECTED } ${ MESSAGE.STATUS_STOP }`;
      status.color = '#5f7c8a';

    } else if (value === 'listening') {
      status.command = 'extension.disconnect';
      status.tooltip = `${ MESSAGE.STATUS_LISTENING } ${ MESSAGE.STATUS_STOP }`;
      status.color = '#ffc107';

    } else if (value === 'disconnected') {
      status.command = 'extension.connectOnline';
      status.tooltip = `${ MESSAGE.STATUS_INACTIVE } ${ MESSAGE.STATUS_START }`;
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

  function configurationChanges(): { [ key: string ]: boolean } {
    const change = vscode.workspace.getConfiguration('angular-gui');
    return Object.keys(change)
      .filter(key => key in config)
      .reduce((dict, key) => {
        let a = change[ key ];
        let b = config[ key ];
        if (key === 'commandOptions') {
          a = { ...change[ key ], collection: null };
          b = { ...config[ key ], collection: null };
        }
        return { ...dict, [ key ]: JSON.stringify(a) !== JSON.stringify(b) }
      }, {} as any);
  }

  statusUpdate('disconnected');
  status.show();

  vscode.workspace.onDidChangeConfiguration((e) => {
    const changes = configurationChanges();

    if (Object.values(changes).some(o => !!o)) {
      const change = vscode.workspace.getConfiguration('angular-gui');
      gui.initialize({ ...config, ...change });

      if (changes.commandOptions || changes.commands) {
        vscode.window.showInformationMessage(MESSAGE.CONFIG_CHANGE, 'Rebuild')
          .then(rebuild =>
            rebuild
              ? vscode.commands
                .executeCommand('extension.rebuildConfiguration')
              : null);
      }

      if (changes.port) {
        if (gui.runner.socket) {
          gui.runner.socket.emit('settings', change.port);
        } else {
          vscode.window.showWarningMessage(MESSAGE.CLIENT_SHOULD_UPDATE);
        }
      }

    }
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const offline = vscode.commands
    .registerCommand('extension.connectOffline', () =>
      vscode.window.showWarningMessage(MESSAGE.FEATURE_UNAVAILABLE));

  const online = vscode.commands
    .registerCommand('extension.connectOnline', () =>
      subscription = gui.start(statusUpdate)
        .subscribe(processAction));

  const disconnect = vscode.commands
    .registerCommand('extension.disconnect', () => {
      gui.stop(statusUpdate);
      if (subscription) { subscription.unsubscribe(); }
    });

  const rebuild = vscode.commands
    .registerCommand('extension.rebuildConfiguration', () => {
      vscode.window.showInformationMessage(MESSAGE.REBUILD_START);
      gui.rebuild().then(() =>
        vscode.window.showInformationMessage(MESSAGE.REBUILD_FINISH));
    });

  context.subscriptions.push(offline, online, rebuild, status);
}

// this method is called when your extension is deactivated
export function deactivate() {
}