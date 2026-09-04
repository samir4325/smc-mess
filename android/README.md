# 📱 SMC GEC Palanpur — Android Application

Production-ready native Android wrapper for the **Hostel Students Mess Committee (SMC), Government Engineering College, Palanpur**.

---

## 🏛️ Architecture Overview

```
Existing Live SMC Website
         ↓
Live Vercel Deployment (https://smc-mess.vercel.app)
         ↓
Firebase Cloud Database (Live Multi-Device Sync)
         ↓
Android Application (com.smc.gecpalanpur)
```

- **Same Database & Authentication**: The app connects directly to the live production deployment. Any data added, edited, or deleted in the app or website updates instantly everywhere via Firebase Realtime Database.
- **Zero Duplicate Backend**: Uses the existing production system.
- **Role-Based Workspaces**: Full support for Admin, Storage, Procurement, and Account committees.

---

## 🚀 Quick Build Guide

### Prerequisites
- [Android Studio Iguana / Hedgehog or newer](https://developer.android.com/studio)
- JDK 17 or JDK 21 (included with Android Studio)
- Android SDK Platform 34 (Android 14)

### Method 1: Build Using Android Studio (Recommended)
1. Open **Android Studio**.
2. Click **Open** and select the folder:
   `c:\Users\patel\Desktop\final project\android`
3. Wait for Gradle Sync to complete automatically.
4. **To run on your phone/emulator**:
   - Connect your Android phone via USB (with USB Debugging enabled).
   - Click the green **Run (▶)** button.
5. **To generate APK for testing**:
   - Menu: `Build` ➔ `Build Bundle(s) / APK(s)` ➔ `Build APK(s)`.
   - Output will be in: `app/build/outputs/apk/debug/app-debug.apk`.
6. **To generate signed APK/AAB for Play Store**:
   - Menu: `Build` ➔ `Generate Signed Bundle / APK`.
   - Choose **Android App Bundle** (`.aab`) for Google Play Store.
   - Follow keystore prompts and click **Finish**.

---

### Method 2: Build from Command Line (Terminal)

#### Debug APK (For direct phone installation):
```bash
cd android
./gradlew assembleDebug
```
*Output:* `app/build/outputs/apk/debug/app-debug.apk`

#### Release APK:
```bash
cd android
./gradlew assembleRelease
```
*Output:* `app/build/outputs/apk/release/app-release-unsigned.apk`

#### Google Play Store AAB Bundle:
```bash
cd android
./gradlew bundleRelease
```
*Output:* `app/build/outputs/bundle/release/app-release.aab`

---

## ⚙️ Configuration & Customization

### Change the Production Vercel URL
The app URL is defined in a single central file:
`app/src/main/java/com/smc/gecpalanpur/AppConfig.java`

```java
public static final String PRODUCTION_URL = "https://smc-mess.vercel.app";
```
Simply change this string if your Vercel domain updates!

---

## 🛡️ Features Implemented

1. **Hardware Back Button Handling**:
   - Navigates back through in-app history.
   - Double-tap back on the root page exits cleanly with *"Press back again to exit"*.

2. **File & Camera Chooser**:
   - Works with all bill/voucher uploads.
   - Prompts for Camera photo capture or Gallery / PDF document selection.

3. **Offline & Network Recovery**:
   - Detects internet loss instantly.
   - Shows clean offline screen with *"Retry Connection"* button.

4. **Pull-to-Refresh**:
   - Swipe down from top of screen to refresh live cloud data.

5. **Download Support**:
   - Generates and downloads PDF vouchers, transaction statements, and Excel exports to the phone's `Downloads/` directory.

6. **Native Status Bar & Navigation Bar**:
   - Professional deep blue theme (`#1e3a8a`) matching the SMC branding.
