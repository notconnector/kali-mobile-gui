import type { SSHHost } from '../types';

type EventType = 'connected' | 'disconnected' | 'error' | 'shellOutput';
type EventCallback = (data?: any) => void;

interface WebSocketMessage {
  id?: number;
  type?: string;
  output?: string;
  data?: string;
  error?: string;
}

/**
 * SSHManager - Manages WebSocket connection to Kali Bridge
 * Handles authentication, command execution, and shell sessions
 */
class SSHManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isShellOpen = false;
  private currentHost: SSHHost | null = null;
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private pendingResolvers: Map<number, { resolve: (value: string) => void; reject: (reason: Error) => void }> = new Map();
  private reqId = 0;

  constructor() {
    // Bind event listeners
    this.listeners.set('connected', new Set());
    this.listeners.set('disconnected', new Set());
    this.listeners.set('error', new Set());
    this.listeners.set('shellOutput', new Set());
  }

  private wsUrl(): string {
    if (!this.currentHost) {
      throw new Error('No host configured');
    }
    const protocol = 'ws://'; // TODO: Add WSS support
    return `${protocol}${this.currentHost.host}:${this.currentHost.wsPort || 8765}`;
  }

  private emit(event: EventType, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch {
          // Ignore callback errors
        }
      });
    }
  }

  on(event: EventType, callback: EventCallback): () => void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.add(callback);
    }
    return () => this.off(event, callback);
  }

  off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  setHost(host: SSHHost): void {
    this.currentHost = host;
  }

  getHost(): SSHHost | null {
    return this.currentHost;
  }

  getConfig(): SSHHost | null {
    return this.currentHost;
  }

  setConfig(config: Partial<SSHHost>): void {
    if (this.currentHost) {
      this.currentHost = { ...this.currentHost, ...config };
    } else {
      this.currentHost = config as SSHHost;
    }
  }

  connect(): Promise<void> {
    if (this.isConnected && this.ws) {
      return Promise.resolve();
    }

    if (!this.currentHost?.host?.trim()) {
      return Promise.reject(new Error('No host configured. Go to Settings first.'));
    }

    return new Promise((resolve, reject) => {
      const url = this.wsUrl();
      let settled = false;

      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        return reject(e instanceof Error ? e : new Error(String(e)));
      }

      if (!this.ws) {
        return reject(new Error('Failed to create WebSocket'));
      }

      this.ws.onopen = () => {
        if (settled) return;
        settled = true;
        this.isConnected = true;

        // Authenticate if token is set
        if (this.currentHost?.authToken) {
          this.send({ type: 'auth', auth_token: this.currentHost.authToken })
            .then(() => {
              this.emit('connected');
              resolve();
            })
            .catch(err => {
              this.emit('error', err.message);
              reject(err);
            });
        } else {
          this.emit('connected');
          resolve();
        }
      };

      this.ws.onerror = (_e: Event) => {
        if (!settled) {
          settled = true;
          reject(new Error(`WebSocket error: Cannot connect to ${url}`));
        }
        this.isConnected = false;
        this.emit('error', 'Connection error');
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isShellOpen = false;
        this.emit('disconnected');

        // Reject all pending requests
        this.pendingResolvers.forEach(({ reject: rejectPending }) => {
          rejectPending(new Error('Connection closed'));
        });
        this.pendingResolvers.clear();
      };

      this.ws.onmessage = (evt: any) => {
        try {
          const msg: WebSocketMessage = JSON.parse(evt.data);

          if (msg.type === 'shell_output' && msg.data) {
            this.emit('shellOutput', msg.data);
            return;
          }

          if (msg.type === 'pong') return;

          const id = msg.id;
          if (id === undefined) return;

          const pending = this.pendingResolvers.get(id);
          if (!pending) return;

          this.pendingResolvers.delete(id);

          if (msg.error) {
            pending.reject(new Error(msg.error));
          } else {
            pending.resolve(msg.output || '');
          }
        } catch {
          // Ignore parse errors
        }
      };
    });
  }

  disconnect(): Promise<void> {
    return new Promise(resolve => {
      this.isShellOpen = false;
      this.isConnected = false;
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // Ignore close errors
        }
        this.ws = null;
      }
      this.emit('disconnected');
      resolve();
    });
  }

  private send(payload: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        return reject(new Error('Not connected. Connect via Settings first.'));
      }

      const id = ++this.reqId;
      this.pendingResolvers.set(id, { resolve, reject });

      try {
        this.ws.send(JSON.stringify({ id, ...payload }));
      } catch (e) {
        this.pendingResolvers.delete(id);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  execute(command: string, timeout = 60): Promise<string> {
    return this.send({ type: 'exec', command, timeout });
  }

  startShell(): Promise<void> {
    return this.send({ type: 'shell_start' }).then(() => {
      this.isShellOpen = true;
    });
  }

  writeToShell(command: string): Promise<void> {
    const cmd = command.endsWith('\n') ? command : command + '\n';
    return this.send({ type: 'shell_write', data: cmd }).then(() => undefined);
  }

  closeShell(): Promise<void> {
    if (!this.isShellOpen) return Promise.resolve();
    this.isShellOpen = false;
    return this.send({ type: 'shell_close' }).then(() => undefined).catch(() => undefined);
  }

  ping(): Promise<string> {
    return this.send({ type: 'ping' });
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getIsShellOpen(): boolean {
    return this.isShellOpen;
  }
}

export default new SSHManager();
