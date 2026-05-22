import { SSHConfig, SSHHost } from '../types';

export const DEFAULT_SSH_CONFIG: SSHConfig = {
  host: '',
  port: 22,
  wsPort: 8765,
  username: '',
  password: '',
};

export const DEFAULT_HOST: Omit<SSHHost, 'id'> = {
  name: 'Default Kali',
  host: '',
  port: 22,
  wsPort: 8765,
  username: '',
  password: '',
  useKeyAuth: false,
  isDefault: true,
};

export const APP_CONFIG = {
  commandTimeout: 30000,
  maxHistoryItems: 200,
  terminalMaxLines: 1000,
  reconnectDelay: 3000,
  maxReconnectAttempts: 3,
  maxPayloadSize: 1048576, // 1MB
  rateLimitPerMinute: 30,
};

export const STORAGE_KEYS = {
  HOSTS: '@kali_remote_hosts',
  CURRENT_HOST: '@kali_remote_current_host',
  HISTORY: '@kali_remote_history',
  CUSTOM_TOOLS: '@kali_remote_custom_tools',
  SETTINGS: '@kali_remote_settings',
};
