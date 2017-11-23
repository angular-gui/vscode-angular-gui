export const MESSAGE = {
  CLIENT_CONNECTED: origin => `Client connected from ${ origin }.`,
  CLIENT_DISCONNECTED: `Client disconnected.`,
  CLIENT_SHOULD_UPDATE: 'Client not connected. Please update settings manually.',

  CONFIG_CHANGE: 'GUI for Angular configuration changed. You should rebuild client configuration.',

  DELETE_START: name => `Deleting script: ${ name }.sh`,
  DELETE_SUCCESS: name => `Deleted script: ${ name }.sh`,
  DELETE_FAILURE: 'Delete failed',

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
