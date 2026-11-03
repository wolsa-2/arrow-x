# ARROW X — Android Release & Build Guide

## 1. Application Identity & Metadata
- **Application Name**: ARROW X
- **Package Name / Application ID**: `com.arrowx.game`
- **Version**: `1.0.0`
- **Version Code**: `1`
- **Target SDK**: Android 14 (API 34)
- **Minimum SDK**: Android 7.0 (API 24)
- **Orientation**: Portrait (`portrait`)
- **Theme Color**: `#FFFFFF`
- **AdMob Android App ID**: `ca-app-pub-3940256099942544~3347511713`
- **AdMob Rewarded Video Test Unit ID**: `ca-app-pub-3940256099942544/5224354917`

---

## 2. Permissions & Safety Compliance
- **Declared Permissions**:
  - `android.permission.VIBRATE` (for responsive haptic feedback)
  - `android.permission.INTERNET` (optional for Google AdMob rewarded ads)
  - `android.permission.ACCESS_NETWORK_STATE` (for online/offline network detection)
- **Prohibited Permissions**:
  - NO Location (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`)
  - NO Camera / Audio recording
  - NO Storage / Contacts / Phone state

---

## 3. Building Android Artifacts via Capacitor

To generate the native Android project and APK / AAB artifacts:

### Step 1: Install Capacitor CLI & Core
```bash
npm install @capacitor/core @capacitor-community/admob
npm install -D @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor Configuration (`capacitor.config.json`)
```json
{
  "appId": "com.arrowx.game",
  "appName": "ARROW X",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  }
}
```

### Step 3: Compile Web Production Assets
```bash
npm run build
npx cap add android
npx cap copy android
```

### Step 4: Build Debug APK
```bash
cd android
./gradlew assembleDebug
```
Output artifact: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Build Signed Android App Bundle (AAB) for Google Play
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore release.jks -alias arrow_escape -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Build release bundle:
   ```bash
   ./gradlew bundleRelease
   ```
Output artifact: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Google Play Store Assets & App Icon
- **App Icon High-Res Specification**: 1024 × 1024 px, 32-bit PNG/JPEG, maximum 8MB.
- **Active Icon Assets**:
  - Light Canvas (Flagship): `/public/arrow-x-icon-1024.jpg`
  - Dark Squircle (Alternate): `/public/arrow-x-icon-dark-1024.jpg`
- **Design Identity**:
  - Minimalist two-tone palette (Midnight Navy `#0A1931` & Electric Royal Blue `#0077FE`).
  - Central bold geometric "X" enclosed within orthogonal winding escape arrows.
  - Subtle ambient occlusion shadows and micro-beveled tactile finish.

