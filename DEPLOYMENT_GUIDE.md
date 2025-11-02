# 🚀 Boss Pizza Mobile - Deployment Guide

## 📱 Deploy to Expo Cloud for Preview

### Prerequisites

1. **Expo Account**: Create one at [expo.dev](https://expo.dev)
2. **EAS CLI**: Already available in your project
3. **Git** (optional but recommended)

---

## 🎯 Quick Start - Publish to Expo Cloud

### **Option 1: EAS Update (Fastest - Recommended)**

This publishes your JavaScript bundle to Expo's cloud and generates a QR code for instant preview.

```bash
# Step 1: Login to Expo
npx expo login
# Enter your username and password

# Step 2: Publish update to cloud
npx eas update --branch preview --message "First cloud preview"

# Step 3: Generate QR code for preview
npx expo start --tunnel
```

**Result**: You'll get a QR code that anyone can scan with Expo Go app to preview your app!

---

### **Option 2: Build APK for Android (Full Build)**

This creates a complete Android APK that can be installed on any Android device.

```bash
# Step 1: Login to EAS
npx eas login

# Step 2: Build preview APK
npx eas build --profile preview --platform android

# Step 3: Wait for build to complete (5-15 minutes)
# You'll get a download link when done!
```

**Result**: Download link for APK file that can be installed on Android devices.

---

### **Option 3: Development Build (For Continuous Testing)**

This creates a development build with live reload capabilities.

```bash
# For Android
npx eas build --profile development --platform android

# For iOS (requires Apple Developer account)
npx eas build --profile development --platform ios
```

---

## 📋 Step-by-Step Instructions

### **Method 1: Using EAS Update (Recommended)**

#### Step 1: Ensure you're logged in
```bash
npx expo whoami
```

If not logged in:
```bash
npx expo login
```

#### Step 2: Configure project (already done!)
Your `eas.json` is already configured with:
- Development profile
- Preview profile  
- Production profile

#### Step 3: Publish update to cloud
```bash
# Publish to preview channel
npx eas update --branch preview --message "Beta preview build"

# Or publish to production
npx eas update --branch production --message "Production release"
```

#### Step 4: Share the preview
```bash
# Generate shareable link and QR code
npx expo start --tunnel
```

**Anyone can now scan the QR code with Expo Go app to test your app!**

---

### **Method 2: Build APK (Full Installation)**

#### Step 1: Start the build
```bash
npx eas build --profile preview --platform android
```

#### Step 2: Monitor build progress
The CLI will show you a URL to monitor the build:
```
🔗 Build details: https://expo.dev/accounts/robas/projects/bosspizzamobile/builds/xxxxx
```

#### Step 3: Download the APK
Once complete, you'll get:
- **Download link** for the APK file
- **QR code** to install directly on device
- **Shareable link** for others to download

#### Step 4: Install on Android device
1. Download the APK from the link
2. Enable "Install from unknown sources" on your Android device
3. Install the APK
4. Launch Boss Pizza Mobile!

---

## 🌐 Sharing Your App

### **Share via QR Code (Expo Go)**
```bash
npx expo start --tunnel
```
- Shows QR code
- Others scan with Expo Go app
- Instant preview!

### **Share via APK Link**
After building with EAS:
- Share the download link from build output
- Anyone can download and install
- Works on any Android device

### **Share via Expo Website**
1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Share the project URL
4. Others can scan QR code from website

---

## 🔧 Build Profiles Explained

### **Development** (`development`)
- For testing during development
- Includes developer menu
- Fast reload enabled
- Internal distribution only

### **Preview** (`preview`)
- For beta testing
- Creates installable APK
- No developer menu
- Internal distribution
- **Best for sharing with testers**

### **Production** (`production`)
- For app store releases
- Optimized and minified
- No debug features
- Ready for Google Play/App Store

---

## 📱 Testing Your Cloud Build

### **Using Expo Go App**

1. **Install Expo Go**:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Scan QR Code**:
   ```bash
   npx expo start --tunnel
   ```

3. **View Your App**:
   - App loads directly in Expo Go
   - All features work (except custom native modules)

### **Using Development Build**

1. **Build and install** development APK
2. **Publish updates**:
   ```bash
   npx eas update --branch development
   ```
3. **Reload app** to see changes

---

## 🎨 Current Build Configuration

Your `eas.json` is configured with:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "channel": "production"
    }
  }
}
```

---

## ⚡ Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npx expo login` | Login to Expo account |
| `npx expo whoami` | Check current user |
| `npx eas update --branch preview` | Publish to cloud (preview) |
| `npx eas build --profile preview --platform android` | Build APK |
| `npx expo start --tunnel` | Generate shareable QR code |
| `npx eas build:list` | View all builds |
| `npx eas update:list` | View all updates |

---

## 🐛 Troubleshooting

### **"Not logged in" error**
```bash
npx expo login
# or
npx eas login
```

### **"Project not configured" error**
Your project is already configured! The error shouldn't occur.

### **Build fails**
1. Check build logs in the Expo dashboard
2. Ensure all dependencies are installed:
   ```bash
   npm install
   ```
3. Try clearing cache:
   ```bash
   npx expo start -c
   ```

### **QR code doesn't work**
1. Ensure both devices are on same network
2. Use tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

---

## 🎯 Recommended Workflow

### **For Quick Sharing (No Installation Required)**
```bash
# 1. Publish to cloud
npx eas update --branch preview --message "Feature X added"

# 2. Generate QR code
npx expo start --tunnel

# 3. Share QR code with testers
```

### **For Beta Testing (Installable APK)**
```bash
# 1. Build preview APK
npx eas build --profile preview --platform android

# 2. Wait for build completion (~10 mins)

# 3. Share download link from build output
```

### **For Production Release**
```bash
# 1. Update version in app.json
# "version": "1.0.1"

# 2. Build production APK
npx eas build --profile production --platform android

# 3. Submit to Google Play Store
npx eas submit -p android
```

---

## 📊 Your Project Info

- **Project ID**: `b080776e-4978-46cb-9664-41401dd870d8`
- **Owner**: `robas`
- **Slug**: `bosspizzamobile`
- **Package**: `com.robas.bosspizzamobile`

---

## 🎉 Next Steps

1. **Login to Expo**:
   ```bash
   npx expo login
   ```

2. **Choose your method**:
   - Quick preview: `npx eas update --branch preview`
   - Full APK: `npx eas build --profile preview --platform android`

3. **Share with testers**:
   - QR code from `npx expo start --tunnel`
   - Or APK download link from build

4. **Iterate**:
   - Make changes
   - Publish updates: `npx eas update`
   - Testers get updates automatically!

---

## 🔗 Useful Links

- **Expo Dashboard**: https://expo.dev/accounts/robas/projects/bosspizzamobile
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Update Docs**: https://docs.expo.dev/eas-update/introduction/
- **Expo Go**: https://expo.dev/go

---

## 💡 Pro Tips

1. **Use updates for quick iterations** - No need to rebuild APK for every change
2. **Use channels** - Separate development, preview, and production
3. **Test on real devices** - Use Expo Go or development build
4. **Monitor analytics** - Check Expo dashboard for usage stats
5. **Version your updates** - Use meaningful commit messages

---

**You're all set to deploy Boss Pizza Mobile to the cloud! 🍕🚀**

