# Kali Pentest Suite - Setup Script
# Uruchom jako: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "========================================" -ForegroundColor Green
Write-Host "   KALI PENTEST SUITE - SETUP           " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. Sprawdz Node.js
Write-Host "[1/5] Sprawdzanie Node.js..." -ForegroundColor Cyan
$nodeOk = $false
try {
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK Node.js: $nodeVersion" -ForegroundColor Green
        $nodeOk = $true
    }
} catch {
    $nodeOk = $false
}
if (-not $nodeOk) {
    Write-Host "  BLAD: Node.js nie znaleziony! Zainstaluj z https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Sprawdz Java
Write-Host "[2/5] Sprawdzanie Java..." -ForegroundColor Cyan
try {
    & java -version 2>&1 | Out-Null
    Write-Host "  OK Java dostepna" -ForegroundColor Green
} catch {
    Write-Host "  UWAGA: Java nie znaleziona! Zainstaluj JDK 17 z https://adoptium.net" -ForegroundColor Yellow
    Write-Host "  Ustaw zmienna JAVA_HOME na katalog JDK" -ForegroundColor Yellow
}

# 3. Instalacja pakietow npm
Write-Host "[3/5] Instalowanie pakietow npm..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Pakiety zainstalowane pomyslnie" -ForegroundColor Green
} else {
    Write-Host "  BLAD instalacji npm! Sprawdz logi." -ForegroundColor Red
    exit 1
}

# 3b. Pobierz gradle-wrapper.jar
Write-Host "[3b] Pobieranie gradle-wrapper.jar..." -ForegroundColor Cyan
$wrapperJar = "android\gradle\wrapper\gradle-wrapper.jar"
if (-not (Test-Path $wrapperJar)) {
    $jarUrl = "https://raw.githubusercontent.com/gradle/gradle/v8.3.0/gradle/wrapper/gradle-wrapper.jar"
    try {
        Invoke-WebRequest -Uri $jarUrl -OutFile $wrapperJar -UseBasicParsing
        Write-Host "  OK gradle-wrapper.jar pobrany" -ForegroundColor Green
    } catch {
        Write-Host "  UWAGA: Nie udalo sie pobrac gradle-wrapper.jar." -ForegroundColor Yellow
        Write-Host "  Pobierz recznie: $jarUrl" -ForegroundColor Gray
        Write-Host "  Zapisz jako: $wrapperJar" -ForegroundColor Gray
    }
} else {
    Write-Host "  OK gradle-wrapper.jar juz istnieje" -ForegroundColor Green
}

# 3c. Stworz local.properties
Write-Host "[3c] Konfiguracja local.properties..." -ForegroundColor Cyan
$localProps = "android\local.properties"
if (-not (Test-Path $localProps)) {
    $sdkPath = Join-Path $env:USERPROFILE "AppData\Local\Android\Sdk"
    if (Test-Path $sdkPath) {
        $escapedPath = $sdkPath -replace "\\", "\\\\"
        "sdk.dir=$escapedPath" | Out-File -FilePath $localProps -Encoding utf8
        Write-Host "  OK local.properties utworzony: $sdkPath" -ForegroundColor Green
    } else {
        Write-Host "  UWAGA: Android SDK nie znaleziony w domyslnej sciezce." -ForegroundColor Yellow
        Write-Host "  Utworz android\local.properties z zawartoscia:" -ForegroundColor Yellow
        Write-Host "  sdk.dir=C:\\Users\\$env:USERNAME\\AppData\\Local\\Android\\Sdk" -ForegroundColor Gray
    }
} else {
    Write-Host "  OK local.properties juz istnieje" -ForegroundColor Green
}

# 4. Konfiguracja keystore
Write-Host "[4/5] Konfiguracja keystore..." -ForegroundColor Cyan
$keystorePath = "android\app\debug.keystore"
if (-not (Test-Path $keystorePath)) {
    $androidKeystore = Join-Path $env:USERPROFILE ".android\debug.keystore"
    if (Test-Path $androidKeystore) {
        Copy-Item $androidKeystore $keystorePath
        Write-Host "  OK debug.keystore skopiowany z .android/" -ForegroundColor Green
    } else {
        Write-Host "  Generowanie debug.keystore..." -ForegroundColor Yellow
        try {
            $keytoolArgs = @(
                "-genkeypair", "-v",
                "-keystore", $keystorePath,
                "-alias", "androiddebugkey",
                "-keyalg", "RSA",
                "-keysize", "2048",
                "-validity", "10000",
                "-storepass", "android",
                "-keypass", "android",
                "-dname", "CN=Android Debug,O=Android,C=US"
            )
            & keytool @keytoolArgs 2>&1 | Out-Null
            Write-Host "  OK debug.keystore wygenerowany" -ForegroundColor Green
        } catch {
            Write-Host "  UWAGA: keytool nie znaleziony." -ForegroundColor Yellow
            Write-Host "  Skopiuj recznie debug.keystore do android\app\" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  OK debug.keystore juz istnieje" -ForegroundColor Green
}

# 5. Sprawdz SDK Android
Write-Host "[5/5] Weryfikacja SDK Android..." -ForegroundColor Cyan
if ($env:ANDROID_HOME) {
    Write-Host "  OK ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} elseif ($env:ANDROID_SDK_ROOT) {
    Write-Host "  OK ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor Green
} else {
    Write-Host "  UWAGA: ANDROID_HOME nie ustawiony!" -ForegroundColor Yellow
    Write-Host "  Ustaw w: Ustawienia systemowe > Zmienne srodowiskowe" -ForegroundColor Yellow
    $defaultSdk = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    Write-Host "  Typowa sciezka: $defaultSdk" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP ZAKONCZONY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Dalsze kroki:" -ForegroundColor White
Write-Host "  1. Podlacz telefon USB z wlaczonym Debugowaniem USB" -ForegroundColor Cyan
Write-Host "     (Ustawienia > O telefonie > kliknij 7x na numer kompilacji)" -ForegroundColor Gray
Write-Host "  2. Uruchom aplikacje:" -ForegroundColor Cyan
Write-Host "     npx react-native run-android" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Lub zbuduj APK release:" -ForegroundColor Cyan
Write-Host "     cd android && .\gradlew assembleRelease" -ForegroundColor Yellow
Write-Host "     APK: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Gray
Write-Host ""
