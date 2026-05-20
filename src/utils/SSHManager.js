import {DEFAULT_SSH_CONFIG} from '../config/default';

/**
 * SSHManager — komunikacja przez WebSocket z mostem na Kali Linux.
 * Na Kali uruchom: python3 kali-bridge.py
 * Adres: ws://<host>:8765
 */
class SSHManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isShellOpen = false;
    this.config = {...DEFAULT_SSH_CONFIG};
    this._listeners = {};
    this._pendingResolvers = {};
    this._reqId = 0;
    this._reconnectTimer = null;
  }

  _wsUrl() {
    return `ws://${this.config.host}:${this.config.wsPort || 8765}`;
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (_) {}
    });
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  setConfig(config) {
    this.config = {...this.config, ...config};
  }

  getConfig() {
    return {...this.config};
  }

  connect(config = null) {
    if (config) this.config = {...this.config, ...config};
    if (this.isConnected && this.ws) return Promise.resolve();

    if (!this.config.host || !this.config.host.trim()) {
      return Promise.reject(new Error('No SSH host configured. Go to Settings first.'));
    }

    return new Promise((resolve, reject) => {
      const url = this._wsUrl();
      let settled = false;

      try {
        this.ws = new WebSocket(url);
      } catch (e) {
        return reject(e);
      }

      this.ws.onopen = () => {
        if (settled) return;
        settled = true;
        this.isConnected = true;
        this._emit('connected', this.config);
        resolve();
      };

      this.ws.onerror = e => {
        if (!settled) {
          settled = true;
          reject(new Error(`Blad WebSocket: ${e.message || 'nie mozna polaczyc'}\nURL: ${url}`));
        }
        this.isConnected = false;
        this._emit('error', e.message);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isShellOpen = false;
        this._emit('disconnected', null);
        Object.values(this._pendingResolvers).forEach(({reject: r}) =>
          r(new Error('Polaczenie zamkniete'))
        );
        this._pendingResolvers = {};
      };

      this.ws.onmessage = evt => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'shell_output') {
            this._emit('shellOutput', msg.data);
            return;
          }
          const pending = this._pendingResolvers[msg.id];
          if (!pending) return;
          delete this._pendingResolvers[msg.id];
          if (msg.error) {
            pending.reject(new Error(msg.error));
          } else {
            pending.resolve(msg.output || '');
          }
        } catch (_) {}
      };
    });
  }

  disconnect() {
    return new Promise(resolve => {
      this.isShellOpen = false;
      this.isConnected = false;
      if (this.ws) {
        try { this.ws.close(); } catch (_) {}
        this.ws = null;
      }
      this._emit('disconnected', null);
      resolve();
    });
  }

  _send(payload) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.ws) {
        return reject(new Error('Brak polaczenia. Polacz sie przez Ustawienia.'));
      }
      const id = ++this._reqId;
      this._pendingResolvers[id] = {resolve, reject};
      try {
        this.ws.send(JSON.stringify({id, ...payload}));
      } catch (e) {
        delete this._pendingResolvers[id];
        reject(e);
      }
    });
  }

  execute(command) {
    return this._send({type: 'exec', command});
  }

  startShell() {
    return this._send({type: 'shell_start'}).then(() => {
      this.isShellOpen = true;
    });
  }

  writeToShell(command) {
    const cmd = command.endsWith('\n') ? command : command + '\n';
    return this._send({type: 'shell_write', data: cmd});
  }

  closeShell() {
    if (!this.isShellOpen) return Promise.resolve();
    this.isShellOpen = false;
    return this._send({type: 'shell_close'}).catch(() => {});
  }
}

export default new SSHManager();
