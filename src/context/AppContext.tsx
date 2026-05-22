import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SSHManager from '../utils/SSHManager';
import { APP_CONFIG, STORAGE_KEYS } from '../config/default';
import type {
  AppState,
  AppAction,
  AppContextValue,
  SSHHost,
  SSHConfig,
  CustomTool,
  CommandEntry,
  FileEntry,
} from '../types';

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  currentHostId: null,
  hosts: [],
  history: [],
  terminalLines: [],
  activeCommand: null,
  customTools: [],
  currentPath: '/',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload, connectionError: null };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        isConnecting: false,
        connectionError: null,
      };
    case 'SET_ERROR':
      return { ...state, connectionError: action.payload, isConnecting: false };
    case 'SET_CURRENT_HOST':
      return { ...state, currentHostId: action.payload };
    case 'ADD_HOST':
      return { ...state, hosts: [...state.hosts, action.payload] };
    case 'UPDATE_HOST':
      return {
        ...state,
        hosts: state.hosts.map(h => (h.id === action.payload.id ? action.payload : h)),
      };
    case 'DELETE_HOST':
      return {
        ...state,
        hosts: state.hosts.filter(h => h.id !== action.payload),
        currentHostId: state.currentHostId === action.payload ? null : state.currentHostId,
      };
    case 'SET_HOSTS':
      return { ...state, hosts: action.payload };
    case 'ADD_HISTORY':
      const newHistory = [action.payload, ...state.history].slice(0, APP_CONFIG.maxHistoryItems);
      return { ...state, history: newHistory };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'ADD_TERMINAL_LINE':
      const newLines = [...state.terminalLines, action.payload].slice(
        -APP_CONFIG.terminalMaxLines
      );
      return { ...state, terminalLines: newLines };
    case 'CLEAR_TERMINAL':
      return { ...state, terminalLines: [] };
    case 'SET_ACTIVE_COMMAND':
      return { ...state, activeCommand: action.payload };
    case 'SET_CUSTOM_TOOLS':
      return { ...state, customTools: action.payload };
    case 'ADD_CUSTOM_TOOL':
      return { ...state, customTools: [...state.customTools, action.payload] };
    case 'DELETE_CUSTOM_TOOL':
      return {
        ...state,
        customTools: state.customTools.filter(t => t.id !== action.payload),
      };
    case 'SET_CURRENT_PATH':
      return { ...state, currentPath: action.payload };
    default:
      return state;
  }
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadHosts();
    loadCustomTools();

    const offConnected = SSHManager.on('connected', () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    });
    const offDisconnected = SSHManager.on('disconnected', () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
    });
    const offError = SSHManager.on('error', (error: string) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    });
    const offShell = SSHManager.on('shellOutput', (text: string) => {
      const lines = text.split(/\r?\n/).filter((l): l is string => l !== undefined);
      lines.forEach(line => {
        dispatch({
          type: 'ADD_TERMINAL_LINE',
          payload: { text: line, type: 'output', ts: Date.now() },
        });
      });
    });

    return () => {
      offConnected();
      offDisconnected();
      offError();
      offShell();
    };
  }, []);

  const loadHosts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.HOSTS);
      if (stored) {
        const hosts: SSHHost[] = JSON.parse(stored);
        dispatch({ type: 'SET_HOSTS', payload: hosts });

        // Set default host if exists
        const defaultHost = hosts.find(h => h.isDefault) || hosts[0];
        if (defaultHost) {
          dispatch({ type: 'SET_CURRENT_HOST', payload: defaultHost.id });
          SSHManager.setHost(defaultHost);
        }
      }
    } catch (e) {
      console.error('Failed to load hosts:', e);
    }
  };

  const loadCustomTools = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TOOLS);
      if (stored) {
        dispatch({ type: 'SET_CUSTOM_TOOLS', payload: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load custom tools:', e);
    }
  };

  const saveHosts = async (hosts: SSHHost[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOSTS, JSON.stringify(hosts));
    } catch (e) {
      console.error('Failed to save hosts:', e);
    }
  };

  const connect = useCallback(
    async (hostIdOrConfig?: string | SSHConfig): Promise<boolean> => {
      let host: SSHHost | undefined;
      let targetHostId: string | null = null;

      // Legacy: config object passed directly
      if (hostIdOrConfig && typeof hostIdOrConfig === 'object') {
        const cfg = hostIdOrConfig;
        const existing = state.hosts.find(h => h.host === cfg.host && h.port === cfg.port);
        if (existing) {
          host = existing;
          targetHostId = existing.id;
        } else {
          const newHost: SSHHost = {
            id: `host_${Date.now()}`,
            name: cfg.host,
            host: cfg.host,
            port: cfg.port || 22,
            wsPort: cfg.wsPort || 8765,
            username: cfg.username,
            password: cfg.password,
            authToken: cfg.authToken,
            isDefault: state.hosts.length === 0,
          };
          const updatedHosts = [...state.hosts, newHost];
          dispatch({ type: 'ADD_HOST', payload: newHost });
          await saveHosts(updatedHosts);
          host = newHost;
          targetHostId = newHost.id;
        }
      } else {
        targetHostId = (hostIdOrConfig as string) || state.currentHostId;
        if (!targetHostId) {
          dispatch({ type: 'SET_ERROR', payload: 'No host selected' });
          return false;
        }
        host = state.hosts.find((h: SSHHost) => h.id === targetHostId);
      }

      if (!host) {
        dispatch({ type: 'SET_ERROR', payload: 'Host not found' });
        return false;
      }

      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'SET_CURRENT_HOST', payload: targetHostId });

      try {
        SSHManager.setHost(host);
        await SSHManager.connect();
        dispatch({ type: 'SET_CONNECTED', payload: true });
        return true;
      } catch (e: any) {
        dispatch({ type: 'SET_ERROR', payload: e.message || 'Connection failed' });
        return false;
      }
    },
    [state.hosts, state.currentHostId]
  );

  const disconnect = useCallback(async () => {
    await SSHManager.disconnect();
    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, []);

  const executeCommand = useCallback(
    async (command: string, toolName = ''): Promise<string> => {
      const entry: CommandEntry = {
        id: Date.now().toString(),
        command,
        toolName,
        timestamp: new Date().toISOString(),
        output: '',
        status: 'running',
      };

      dispatch({ type: 'SET_ACTIVE_COMMAND', payload: entry.id });
      dispatch({
        type: 'ADD_TERMINAL_LINE',
        payload: { text: `$ ${command}`, type: 'input', ts: Date.now() },
      });

      try {
        const output = await SSHManager.execute(command);
        const finalEntry: CommandEntry = { ...entry, output, status: 'done' };
        dispatch({ type: 'ADD_HISTORY', payload: finalEntry });
        dispatch({ type: 'SET_ACTIVE_COMMAND', payload: null });

        if (output) {
          output.split('\n').forEach((line: string) => {
            dispatch({
              type: 'ADD_TERMINAL_LINE',
              payload: { text: line, type: 'output', ts: Date.now() },
            });
          });
        }
        return output;
      } catch (e: any) {
        const errEntry: CommandEntry = {
          ...entry,
          output: e.message || 'Unknown error',
          status: 'error',
        };
        dispatch({ type: 'ADD_HISTORY', payload: errEntry });
        dispatch({ type: 'SET_ACTIVE_COMMAND', payload: null });
        dispatch({
          type: 'ADD_TERMINAL_LINE',
          payload: { text: `[ERROR] ${e.message}`, type: 'error', ts: Date.now() },
        });
        throw e;
      }
    },
    []
  );

  const addHost = useCallback(
    async (hostData: Omit<SSHHost, 'id'>): Promise<SSHHost> => {
      const newHost: SSHHost = {
        ...hostData,
        id: `host_${Date.now()}`,
      };

      const updatedHosts = [...state.hosts, newHost];
      dispatch({ type: 'ADD_HOST', payload: newHost });
      await saveHosts(updatedHosts);

      // If first host, set as default
      if (updatedHosts.length === 1) {
        await setDefaultHost(newHost.id);
      }

      return newHost;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.hosts]
  );

  const updateHost = useCallback(
    async (host: SSHHost): Promise<void> => {
      const updatedHosts = state.hosts.map((h: SSHHost) => (h.id === host.id ? host : h));
      dispatch({ type: 'UPDATE_HOST', payload: host });
      await saveHosts(updatedHosts);
    },
    [state.hosts]
  );

  const deleteHost = useCallback(
    async (hostId: string): Promise<void> => {
      const updatedHosts = state.hosts.filter((h: SSHHost) => h.id !== hostId);
      dispatch({ type: 'DELETE_HOST', payload: hostId });
      await saveHosts(updatedHosts);

      // Disconnect if deleting current host
      if (hostId === state.currentHostId) {
        await disconnect();
      }
    },
    [state.hosts, state.currentHostId, disconnect]
  );

  const setDefaultHost = useCallback(
    async (hostId: string): Promise<void> => {
      const updatedHosts = state.hosts.map((h: SSHHost) => ({
        ...h,
        isDefault: h.id === hostId,
      }));
      dispatch({ type: 'SET_HOSTS', payload: updatedHosts });
      await saveHosts(updatedHosts);
    },
    [state.hosts]
  );

  const addCustomTool = useCallback(
    async (toolData: Omit<CustomTool, 'id' | 'addedAt'>): Promise<CustomTool> => {
      const newTool: CustomTool = {
        ...toolData,
        id: `custom_${Date.now()}`,
        addedAt: new Date().toISOString(),
      };

      const updatedTools = [...state.customTools, newTool];
      dispatch({ type: 'ADD_CUSTOM_TOOL', payload: newTool });
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(updatedTools));
      return newTool;
    },
    [state.customTools]
  );

  const deleteCustomTool = useCallback(
    async (toolId: string): Promise<void> => {
      const updatedTools = state.customTools.filter((t: CustomTool) => t.id !== toolId);
      dispatch({ type: 'DELETE_CUSTOM_TOOL', payload: toolId });
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TOOLS, JSON.stringify(updatedTools));
    },
    [state.customTools]
  );

  // File browser functions
  const listFiles = useCallback(async (path = '.'): Promise<FileEntry[]> => {
    const command = `ls -la ${path} 2>/dev/null || ls -la`;
    const output = await SSHManager.execute(command);

    const files: FileEntry[] = [];
    const lines = output.split('\n').filter((line: string) => line.trim() && !line.startsWith('total'));

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 9) {
        const permissions = parts[0];
        const owner = parts[2];
        const group = parts[3];
        const size = parseInt(parts[4], 10) || 0;
        const modified = `${parts[5]} ${parts[6]} ${parts[7]}`;
        const name = parts.slice(8).join(' ');

        let type: FileEntry['type'] = 'file';
        if (permissions.startsWith('d')) type = 'directory';
        else if (permissions.startsWith('l')) type = 'link';

        files.push({
          name,
          path: `${path}/${name}`.replace(/\/+/g, '/'),
          type,
          size,
          permissions,
          owner,
          group,
          modified,
        });
      }
    }

    return files;
  }, []);

  const changeDirectory = useCallback(async (path: string): Promise<void> => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: path });
  }, []);

  const uploadFile = useCallback(async (_localPath: string, _remotePath: string): Promise<void> => {
    // TODO: Implement file upload via base64 encoding
    throw new Error('File upload not implemented yet');
  }, []);

  const downloadFile = useCallback(async (_remotePath: string, _localPath: string): Promise<void> => {
    // TODO: Implement file download via base64 encoding
    throw new Error('File download not implemented yet');
  }, []);

  // Legacy compatibility helpers
  const sshConfig: SSHConfig | null = useMemo(() => {
    const currentHost = state.hosts.find((host: SSHHost) => host.id === state.currentHostId);
    if (!currentHost) return null;
    return {
      host: currentHost.host,
      port: currentHost.port,
      wsPort: currentHost.wsPort,
      username: currentHost.username,
      password: currentHost.password,
      authToken: currentHost.authToken,
    };
  }, [state.hosts, state.currentHostId]);

  const saveConfig = useCallback(
    async (config: SSHConfig): Promise<void> => {
      const existing = state.hosts.find((existingHost: SSHHost) => existingHost.host === config.host);
      if (existing) {
        const updated: SSHHost = {
          ...existing,
          port: config.port || existing.port,
          wsPort: config.wsPort || existing.wsPort,
          username: config.username || existing.username,
          password: config.password,
          authToken: config.authToken,
        };
        await updateHost(updated);
      } else {
        await addHost({
          name: config.host,
          host: config.host,
          port: config.port || 22,
          wsPort: config.wsPort || 8765,
          username: config.username,
          password: config.password,
          authToken: config.authToken,
        });
      }
    },
    [state.hosts, addHost, updateHost]
  );

  const value: AppContextValue = {
    ...state,
    connect,
    disconnect,
    executeCommand,
    addHost,
    updateHost,
    deleteHost,
    setDefaultHost,
    addCustomTool,
    deleteCustomTool,
    dispatch,
    listFiles,
    changeDirectory,
    uploadFile,
    downloadFile,
    saveConfig,
    sshConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
