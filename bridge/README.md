# Kali Remote GUI Bridge

Secure WebSocket bridge for remote command execution.

## Quick Start

```bash
# Run directly
pip3 install websockets
python3 kali-bridge.py

# Run with Docker
docker-compose up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KALI_BRIDGE_HOST` | `127.0.0.1` | Bind address (use localhost for security) |
| `KALI_BRIDGE_PORT` | `8765` | WebSocket port |
| `KALI_BRIDGE_AUTH_TOKEN` | - | Authentication token |
| `KALI_BRIDGE_RATE_LIMIT` | `30` | Max commands per minute per client |
| `KALI_BRIDGE_LOG_LEVEL` | `INFO` | Logging level |
| `KALI_BRIDGE_MAX_PAYLOAD` | `1048576` | Max WebSocket message size |

## Security

⚠️ **Never bind to 0.0.0.0 without authentication!**

### Recommended: Localhost + SSH Tunnel

```bash
# Bridge config
KALI_BRIDGE_HOST=127.0.0.1

# Create SSH tunnel from client
ssh -L 8765:localhost:8765 user@kali-host
```

### Production: Enable Authentication

```bash
export KALI_BRIDGE_AUTH_TOKEN=$(openssl rand -hex 32)
python3 kali-bridge.py
```

## Health Check

Health endpoint available at port + 1 (default: 8766):

```bash
curl http://localhost:8766/health
```

Response:
```json
{"status": "healthy", "active_connections": 2, "version": "1.0.0"}
```
