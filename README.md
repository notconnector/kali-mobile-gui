# fsociety — Kali Linux Mobile GUI

A React Native Android app that provides a mobile GUI for Kali Linux penetration testing tools, connected via WebSocket bridge over SSH.

![fsociety](icons8-fsociety-mask-200.png)

---

## Features

- **130+ tools** across 12 pentest categories (Recon, Exploitation, Post-Exploitation, Password Cracking, Wireless, Web, OSINT, Forensics, and more)
- **SSH command execution** via WebSocket bridge (`kali-bridge.py`)
- **Live terminal** with real-time output streaming
- **Command history** with search
- **Connection management** — save SSH credentials, test connection
- Dark hacker-themed UI

---

## Requirements

### Android Device
- Android 8.0+ (minSdkVersion 26)
- USB debugging enabled or same network as Kali host

### Kali Linux Host
- Python 3.x
- `websockets` library: `pip3 install websockets`
- SSH server running

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/notconnector/kali-mobile-gui.git
cd fsociety
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the bridge on Kali Linux

Copy `kali-bridge.py` to your Kali machine and run:

```bash
pip3 install websockets
python3 kali-bridge.py
```

The bridge listens on port `8765` by default.

### 4. Configure SSH in the app

Open the app → **Settings** tab → enter your Kali host IP, port, username, and password → tap **Connect SSH**.

### 5. Build APK

```bash
# Bundle JS
npx react-native bundle --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build release APK
cd android && ./gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

---

## License

MIT — see [LICENSE](LICENSE)
