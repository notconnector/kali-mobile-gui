import React, {createContext, useContext, useReducer, useEffect, useCallback} from 'react';
import SSHManager from '../utils/SSHManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APP_CONFIG} from '../config/default';

const AppContext = createContext(null);

const initialState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  sshConfig: null,
  history: [],
  terminalLines: [],
  activeCommand: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {...state, isConnecting: action.payload, connectionError: null};
    case 'SET_CONNECTED':
      return {...state, isConnected: action.payload, isConnecting: false, connectionError: null};
    case 'SET_ERROR':
      return {...state, connectionError: action.payload, isConnecting: false};
    case 'SET_CONFIG':
      return {...state, sshConfig: action.payload};
    case 'ADD_HISTORY':
      const newHistory = [action.payload, ...state.history].slice(0, APP_CONFIG.maxHistoryItems);
      return {...state, history: newHistory};
    case 'CLEAR_HISTORY':
      return {...state, history: []};
    case 'ADD_TERMINAL_LINE':
      const newLines = [...state.terminalLines, action.payload].slice(-APP_CONFIG.terminalMaxLines);
      return {...state, terminalLines: newLines};
    case 'CLEAR_TERMINAL':
      return {...state, terminalLines: []};
    case 'SET_ACTIVE_COMMAND':
      return {...state, activeCommand: action.payload};
    default:
      return state;
  }
}

export function AppProvider({children}) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    loadConfig();

    const offConnected = SSHManager.on('connected', () => {
      dispatch({type: 'SET_CONNECTED', payload: true});
    });
    const offDisconnected = SSHManager.on('disconnected', () => {
      dispatch({type: 'SET_CONNECTED', payload: false});
    });
    const offShell = SSHManager.on('shellOutput', text => {
      const lines = text.split(/\r?\n/).filter(l => l !== undefined);
      lines.forEach(line => {
        dispatch({type: 'ADD_TERMINAL_LINE', payload: {text: line, type: 'output', ts: Date.now()}});
      });
    });

    return () => {
      offConnected();
      offDisconnected();
      offShell();
    };
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem('ssh_config');
      if (stored) {
        const config = JSON.parse(stored);
        SSHManager.setConfig(config);
        dispatch({type: 'SET_CONFIG', payload: config});
      } else {
        dispatch({type: 'SET_CONFIG', payload: SSHManager.getConfig()});
      }
    } catch (e) {}
  };

  const connect = useCallback(async (config = null) => {
    dispatch({type: 'SET_CONNECTING', payload: true});
    try {
      await SSHManager.connect(config);
      dispatch({type: 'SET_CONNECTED', payload: true});
      if (config) {
        await AsyncStorage.setItem('ssh_config', JSON.stringify(SSHManager.getConfig()));
        dispatch({type: 'SET_CONFIG', payload: SSHManager.getConfig()});
      }
      return true;
    } catch (e) {
      dispatch({type: 'SET_ERROR', payload: e.message});
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await SSHManager.disconnect();
    dispatch({type: 'SET_CONNECTED', payload: false});
  }, []);

  const executeCommand = useCallback(async (command, toolName = '') => {
    const entry = {
      id: Date.now().toString(),
      command,
      toolName,
      timestamp: new Date().toISOString(),
      output: '',
      status: 'running',
    };
    dispatch({type: 'SET_ACTIVE_COMMAND', payload: entry.id});
    dispatch({type: 'ADD_TERMINAL_LINE', payload: {text: `$ ${command}`, type: 'input', ts: Date.now()}});

    try {
      const output = await SSHManager.execute(command);
      const finalEntry = {...entry, output, status: 'done'};
      dispatch({type: 'ADD_HISTORY', payload: finalEntry});
      dispatch({type: 'SET_ACTIVE_COMMAND', payload: null});
      if (output) {
        output.split('\n').forEach(line => {
          dispatch({type: 'ADD_TERMINAL_LINE', payload: {text: line, type: 'output', ts: Date.now()}});
        });
      }
      return output;
    } catch (e) {
      const errEntry = {...entry, output: e.message, status: 'error'};
      dispatch({type: 'ADD_HISTORY', payload: errEntry});
      dispatch({type: 'SET_ACTIVE_COMMAND', payload: null});
      dispatch({type: 'ADD_TERMINAL_LINE', payload: {text: `[ERROR] ${e.message}`, type: 'error', ts: Date.now()}});
      throw e;
    }
  }, []);

  const saveConfig = useCallback(async config => {
    SSHManager.setConfig(config);
    dispatch({type: 'SET_CONFIG', payload: config});
    await AsyncStorage.setItem('ssh_config', JSON.stringify(config));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        executeCommand,
        saveConfig,
        dispatch,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
