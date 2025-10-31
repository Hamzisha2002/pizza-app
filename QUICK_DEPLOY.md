# ⚡ Quick Deploy Guide

## 🚀 Fastest Way to Deploy (3 Steps)

### **Step 1: Login (First Time Only)**
```bash
npx expo login
```
Enter your username and password.

---

### **Step 2: Publish to Cloud**
```bash
npm run deploy:preview
```
This publishes your app to Expo's cloud ☁️

---

### **Step 3: Share with QR Code**
```bash
npm run tunnel
```
This generates a QR code that anyone can scan with Expo Go app! 📱

---

## 📱 Using Expo Go App

1. **Download Expo Go** on your phone:
   - [Android - Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Scan the QR code** from `npm run tunnel`

3. **Your app loads instantly!** 🎉

---

## 🔨 Build Installable APK (Android)

For a standalone APK file that can be installed without Expo Go:

```bash
npm run build:preview
```

Wait 5-15 minutes, then download the APK from the link provided!

---

## 📋 All Available Commands

| Command | What it does |
|---------|-------------|
| `npm run deploy:preview` | Publish update to preview channel |
| `npm run deploy:production` | Publish update to production channel |
| `npm run build:preview` | Build installable APK |
| `npm run build:development` | Build dev APK with debug features |
| `npm run tunnel` | Generate shareable QR code |

---

## 🎯 Recommended Workflow

### For Quick Testing:
```bash
npm run deploy:preview && npm run tunnel
```

### For Beta Testers:
```bash
npm run build:preview
```
Share the download link!

### For Production:
```bash
npm run deploy:production
```

---

## 💡 Using the Deployment Scripts

### On Windows:
```bash
# Quick preview
deploy.bat preview

# Build APK
deploy.bat apk

# Production
deploy.bat production
```

### On Mac/Linux:
```bash
# Make executable (first time only)
chmod +x deploy.sh

# Quick preview
./deploy.sh preview

# Build APK
./deploy.sh apk

# Production
./deploy.sh production
```

---

## 🐛 Troubleshooting

### "Not logged in" error
```bash
npx expo login
```

### QR code doesn't work
```bash
# Use tunnel mode for better connectivity
npm run tunnel
```

### Build fails
1. Check your internet connection
2. Visit https://expo.dev to see build logs
3. Try again: `npm run build:preview`

---

## 🎉 That's it!

You're now ready to share Boss Pizza Mobile with the world! 🍕

For more details, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

