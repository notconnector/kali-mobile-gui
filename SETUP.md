# Detailed Setup Guide

## Windows (Build Machine)

### Prerequisites
- Node.js 18+
- JDK 17
- Android SDK (via Android Studio or standalone)
- `ANDROID_HOME` environment variable set

### Steps

```powershell
# Install dependencies
npm install

# Generate keystore for signing
keytool -genkey -v -keystore android/app/my-release-key.keystore `
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Bundle + build
npx react-native bundle --platform android --dev false `
  --entry-file index.js `
  --bundle-output android/app/src/main/assets/index.android.bundle `
  --assets-dest android/app/src/main/res

cd android
.\gradlew.bat assembleRelease
```

### Install on device via ADB

```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

---

## Kali Linux Bridge

### Install dependencies

```bash
pip3 install websockets
```

### Run the bridge

```bash
python3 kali-bridge.py
```

Default: listens on `0.0.0.0:8765`

### Run as systemd service (optional)

```ini
# /etc/systemd/system/kali-bridge.service
[Unit]
Description=Kali Bridge WebSocket
After=network.target

[Service]
ExecStart=/usr/bin/python3 /root/kali-bridge.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable kali-bridge
systemctl start kali-bridge
```

---

## Network

The app connects to `ws://<host>:8765`. Ensure:
- Port `8765` is open (or tunneled via SSH)
- Both devices on same network, or use Tailscale/VPN (I recommend Tailscale)
