# Detailed Setup Guide

Complete guide for building and deploying Kali Remote GUI on Android and Kali Linux.

---

## Table of Contents

1. [Building the Android App](#building-the-android-app)
2. [Setting up the Bridge](#setting-up-the-bridge)
3. [Security Configuration](#security-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Network Configuration](#network-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Building the Android App

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **JDK** 17 ([Download](https://adoptium.net/))
- **Android SDK** (via Android Studio or standalone)
- **ANDROID_HOME** environment variable set

### Windows Build Steps

```powershell
# 1. Clone and enter repository
git clone https://github.com/notconnector/kali-remote-gui.git
cd kali-remote-gui

# 2. Install dependencies
npm install

# 3. Generate signing keystore (first time only)
keytool -genkey -v -keystore android/app/my-release-key.keystore `
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 4. Bundle JavaScript
npx react-native bundle --platform android --dev false `
  --entry-file index.js `
  --bundle-output android/app/src/main/assets/index.android.bundle `
  --assets-dest android/app/src/main/res

# 5. Build release APK
cd android
.\gradlew.bat assembleRelease

# 6. Install on device via ADB
adb install -r ..\app\build\outputs\apk\release\app-release.apk
```

### Linux/macOS Build Steps

```bash
# Same steps as Windows, adapted for bash
npm install

# Generate keystore
keytool -genkey -v -keystore android/app/my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build
npx react-native bundle --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

cd android && ./gradlew assembleRelease

# Install
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## Setting up the Bridge

The bridge is a Python WebSocket server that runs on your Kali Linux machine and proxies commands between the Android app and the Kali system.

### Native Python Deployment

```bash
# 1. Install Python dependencies
pip3 install websockets

# 2. Copy bridge to Kali machine
cp kali-bridge.py /opt/kali-bridge/

# 3. Run the bridge
python3 /opt/kali-bridge/kali-bridge.py

# Default: listens on 0.0.0.0:8765
```

### Systemd Service (Recommended for Production)

Create `/etc/systemd/system/kali-bridge.service`:

```ini
[Unit]
Description=Kali Remote GUI Bridge
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/kali-bridge/kali-bridge.py
Restart=always
RestartSec=5
User=root
Environment=KALI_BRIDGE_HOST=0.0.0.0
Environment=KALI_BRIDGE_PORT=8765

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl daemon-reload
systemctl enable kali-bridge
systemctl start kali-bridge
systemctl status kali-bridge
```

---

## Security Configuration

> **WARNING:** The bridge provides full remote command execution. Improper configuration exposes your system to complete compromise.

### Threat Model

| Threat | Risk | Mitigation |
|--------|------|------------|
| Unauthorized remote access | Critical | Bind to localhost + SSH tunnel |
| MITM attack | High | Use TLS/WSS |
| Password brute force | Medium | SSH keys + rate limiting |
| Command injection | Medium | Input validation + parameterized commands |
| Privilege escalation | Medium | Run as unprivileged user with sudo |

### Recommended Security Setup

#### 1. Bind to Localhost + SSH Tunnel (Most Secure)

Edit `kali-bridge.py`:
```python
HOST = "127.0.0.1"  # NOT 0.0.0.0
PORT = 8765
```

Create SSH tunnel from Android network:
```bash
# From your Android device or intermediary host
ssh -L 8765:localhost:8765 kali@kali-host
```

Configure app to connect to `localhost:8765`

#### 2. SSH Key Authentication

Generate SSH key pair:
```bash
ssh-keygen -t ed25519 -C "kali-bridge"
```

Copy public key to authorized_keys:
```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

Configure bridge to verify keys (requires modified bridge with SSH support).

#### 3. Firewall Rules

```bash
# Block external access (if bridge on 0.0.0.0)
ufw default deny incoming
ufw allow from 192.168.1.0/24 to any port 8765
ufw enable

# Or use iptables
iptables -A INPUT -p tcp --dport 8765 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 8765 -j DROP
```

#### 4. Tailscale (Zero Config VPN)

Recommended for remote access without exposing ports:
```bash
# Install Tailscale on both devices
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate
tailscale up

# Use Tailscale IP in app (100.x.x.x)
# No port exposure needed
```

---

## Docker Deployment

Docker provides isolation and easier deployment.

### Quick Start with Docker

```bash
# Build image
docker build -t kali-bridge -f bridge/Dockerfile .

# Run container
docker run -d \
  --name kali-bridge \
  --network host \
  -p 8765:8765 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kali-bridge
```

### Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  bridge:
    build: ./bridge
    container_name: kali-bridge
    restart: unless-stopped
    ports:
      - "127.0.0.1:8765:8765"  # Bind to localhost only
    environment:
      - KALI_BRIDGE_HOST=0.0.0.0
      - KALI_BRIDGE_PORT=8765
      - KALI_BRIDGE_RATE_LIMIT=30
      - KALI_BRIDGE_AUTH_TOKEN=${BRIDGE_AUTH_TOKEN}
    volumes:
      - ./logs:/var/log/bridge
    networks:
      - kali-bridge
    # Security: Run as non-root
    user: "1000:1000"

networks:
  kali-bridge:
    driver: bridge
```

Start:
```bash
docker-compose up -d
```

---

## Network Configuration

### Port Requirements

| Port | Protocol | Purpose | Required |
|------|----------|---------|----------|
| 8765 | TCP | WebSocket bridge | Yes |
| 22 | TCP | SSH tunnel (optional) | Recommended |
| 41641 | UDP | Tailscale | Optional |

### Testing Connection

From Android device:
```bash
# Test WebSocket connectivity
nmap -p 8765 <kali-ip>

# Or use web testing tools
# ws://<kali-ip>:8765
```

### VPN Options

1. **Tailscale** (Recommended) — Zero-config mesh VPN
2. **WireGuard** — Fast, modern VPN
3. **OpenVPN** — Traditional VPN solution
4. **SSH Tunnel** — No additional software needed

---

## Troubleshooting

### Common Issues

#### "Connection refused" / "Unable to connect"

**Symptoms:** App shows connection error when testing SSH.

**Causes & Solutions:**

1. **Bridge not running**
   ```bash
   # Check bridge status
   systemctl status kali-bridge
   # or
   ps aux | grep kali-bridge
   ```

2. **Firewall blocking port**
   ```bash
   # Check firewall status
   ufw status
   # Temporarily disable for testing
   ufw disable
   ```

3. **Wrong IP address**
   ```bash
   # Verify Kali IP
   ip addr show
   # Use the correct network interface IP
   ```

4. **Different networks**
   - Ensure both devices are on the same WiFi
   - Or use VPN/Tailscale for remote access

#### "Command timeout" or "No output"

**Causes:**
1. Tool not installed on Kali
2. Command requires interactive input
3. Long-running command exceeds timeout

**Solutions:**
```bash
# Check if tool exists
which nmap
which gobuster

# For interactive tools, use the Terminal tab instead
```

#### "Module websockets not found"

```bash
# Install missing dependency
pip3 install websockets

# Or install system-wide
sudo apt-get install python3-websockets
```

#### Build errors (Android)

```powershell
# Clear caches
npx react-native start --reset-cache
cd android && ./gradlew clean

# Verify environment
echo $env:ANDROID_HOME
java -version
```

#### APK install fails

```bash
# Enable USB debugging on Android
# Settings > Developer Options > USB Debugging

# Try manual install with verbose output
adb install -r -t app-release.apk

# Check device compatibility
adb shell getprop ro.product.cpu.abi
```

### Debug Mode

Enable verbose logging in bridge:
```python
# Add to kali-bridge.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

View logs:
```bash
# Native
journalctl -u kali-bridge -f

# Docker
docker logs -f kali-bridge
```

### Still Having Issues?

1. Check [GitHub Issues](https://github.com/notconnector/kali-remote-gui/issues)
2. Enable debug logging and share output (remove sensitive data)
3. Include: OS versions, network setup, error messages

---

## Next Steps

- Review [SECURITY.md](SECURITY.md) for hardening
- See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Join [Discussions](https://github.com/notconnector/kali-remote-gui/discussions) for help
