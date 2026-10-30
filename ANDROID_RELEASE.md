# Arrow Escape Puzzle — Android Release & Build Guide

## 1. Application Identity & Metadata
- **Application Name**: Arrow Escape Puzzle
- **Package Name / Application ID**: `com.arrowescape.puzzle`
- **Version**: `1.0.0`
- **Version Code**: `1`
- **Target SDK**: Android 14 (API 34)
- **Minimum SDK**: Android 7.0 (API 24)
- **Orientation**: Portrait (`portrait`)
- **Theme Color**: `#0F172A`

---

## 2. Permissions & Child Safety Compliance
- **Declared Permissions**:
  - `android.permission.VIBRATE` (for tactile haptic feedback)
- **Removed / Prohibited Permissions**:
  - NO Internet access required (100% offline gameplay)
  - NO Location (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`)
  - NO Camera / Audio recording
  - NO Storage / Contacts / Phone state
  - Fully compliant with Google Play Families Policy & COPPA guidelines (no third-party SDKs, no behavioral tracking, no ads).

---

## 3. Building Android Artifacts via Capacitor

To generate the native Android project and APK / AAB artifacts:

### Step 1: Install Capacitor CLI & Core
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor Configuration (`capacitor.config.json`)
```json
{
  "appId": "com.arrowescape.puzzle",
  "appName": "Arrow Escape Puzzle",
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
