import * as vscode from 'vscode';

const output = vscode.window.createOutputChannel('Angular GUI');
const useConsole = false; // console.log;

export function log(...values) {
  if (!useConsole) {
    output.appendLine(values.join(' '));
  } else {
    console.log(...values);
  }
}
