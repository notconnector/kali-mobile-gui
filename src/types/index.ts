// Main types for Kali Remote GUI
import type { Dispatch } from 'react';

export interface SSHHost {
  id: string;
  name: string;
  host: string;
  port: number;
  wsPort: number;
  username: string;
  password?: string;
  useKeyAuth?: boolean;
  privateKey?: string;
  authToken?: string;
  isDefault?: boolean;
}

export interface SSHConfig {
  host: string;
  port: number;
  wsPort: number;
  username: string;
  password?: string;
  authToken?: string;
}

export interface CommandEntry {
  id: string;
  command: string;
  toolName: string;
  timestamp: string;
  output: string;
  status: 'running' | 'done' | 'error';
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error';
  ts: number;
}

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  command: string;
  category: string;
  addedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  command: string;
  website?: string;
  installCmd?: string;
  exampleCmd?: string;
  flags?: ToolFlag[];
}

export interface ToolFlag {
  flag: string;
  description: string;
  requiresValue?: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'link';
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified: string;
}

export interface AppState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentHostId: string | null;
  hosts: SSHHost[];
  history: CommandEntry[];
  terminalLines: TerminalLine[];
  activeCommand: string | null;
  customTools: CustomTool[];
  currentPath: string;
}

export type AppAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_HOST'; payload: string | null }
  | { type: 'ADD_HOST'; payload: SSHHost }
  | { type: 'UPDATE_HOST'; payload: SSHHost }
  | { type: 'DELETE_HOST'; payload: string }
  | { type: 'SET_HOSTS'; payload: SSHHost[] }
  | { type: 'ADD_HISTORY'; payload: CommandEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_TERMINAL_LINE'; payload: TerminalLine }
  | { type: 'CLEAR_TERMINAL' }
  | { type: 'SET_ACTIVE_COMMAND'; payload: string | null }
  | { type: 'SET_CUSTOM_TOOLS'; payload: CustomTool[] }
  | { type: 'ADD_CUSTOM_TOOL'; payload: CustomTool }
  | { type: 'DELETE_CUSTOM_TOOL'; payload: string }
  | { type: 'SET_CURRENT_PATH'; payload: string };

export interface AppContextValue extends AppState {
  connect: (hostIdOrConfig?: string | SSHConfig) => Promise<boolean>;
  disconnect: () => Promise<void>;
  executeCommand: (command: string, toolName?: string) => Promise<string>;
  addHost: (host: Omit<SSHHost, 'id'>) => Promise<SSHHost>;
  updateHost: (host: SSHHost) => Promise<void>;
  deleteHost: (hostId: string) => Promise<void>;
  setDefaultHost: (hostId: string) => Promise<void>;
  addCustomTool: (tool: Omit<CustomTool, 'id' | 'addedAt'>) => Promise<CustomTool>;
  deleteCustomTool: (toolId: string) => Promise<void>;
  dispatch: Dispatch<AppAction>;
  listFiles: (path?: string) => Promise<FileEntry[]>;
  changeDirectory: (path: string) => Promise<void>;
  uploadFile: (localPath: string, remotePath: string) => Promise<void>;
  downloadFile: (remotePath: string, localPath: string) => Promise<void>;
  // Legacy compatibility
  saveConfig: (config: SSHConfig) => Promise<void>;
  sshConfig: SSHConfig | null;
}
