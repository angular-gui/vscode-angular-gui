export const MESSAGE = {
  CLIENT_CONNECTED: origin => `Client connected from ${ origin }.`,
  CLIENT_DISCONNECTED: `Client disconnected.`,
  CLIENT_SHOULD_UPDATE: 'Client not connected. Please update settings manually.',

  CONFIG_CHANGE: 'GUI for Angular configuration changed. You should rebuild client configuration.',
  CONFIG_UNAVAILABLE: '".angular-cli.json" not found in workspace.',

  DELETE_START: name => `Deleting script: ${ name }.sh`,
  DELETE_SUCCESS: name => `Deleted script: ${ name }.sh`,
  DELETE_FAILURE: 'Delete failed',

  DOCUMENT_DOESNT_EXIST: 'Document does not exist.',

  DRY_RUN: 'NOTE: Run with "dry run" no changes were made.',

  EXEC_START: name => `Executing script: ${ name }`,
  EXEC_SUCCESS: name => `Executed script: ${ name }`,

  FEATURE_UNAVAILABLE: 'This feature is not available.',

  INVALID_COMMAND: 'Invalid command',

  KILL_START: name => `Terminating script: ${ name }`,
  KILL_SUCCESS: name => `Terminated script: ${ name }`,

  REBUILD_START: 'Rebuilding client configuration...',
  REBUILD_FINISH: 'Rebuilding complete.',

  SAVE_START: name => `Saving script: ${ name }.sh`,
  SAVE_SUCCESS: name => `Saved script: ${ name }.sh`,
  SAVE_FAILURE: 'Save failed',

  SCHEMATIC_CLONE: name =>
    `Blueprint "${ name }" is copied to the workspace.\n`
    + 'Modify files and <a class="rebuild">rebuild configuration</a> in order to use them.',
  SCHEMATIC_CLONE_SUCCESS: 'Copied schematic to workspace.',

  SERVER_CONNECTED: port => `Listening on localhost:${ port }...`,
  SERVER_DISCONNECTED: 'Server terminated',

  STATUS_CONNECTED: 'Client connected',
  STATUS_INACTIVE: 'Inactive',
  STATUS_LISTENING: 'Waiting for client connection',
  STATUS_START: '(click to Start GUI for Angular)',
  STATUS_STOP: '(click to Stop GUI for Angular)',
  STATUS_TEXT: '$(shield)',

  WORKSPACE_UNAVAILABLE: 'FATAL ERROR: Cannot access workspace.',
};
