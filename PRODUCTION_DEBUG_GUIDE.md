# 🐛 Production Sign-Up Debug Guide

## 🚨 Issue: Sign-Up Works Locally but Fails in Production

### **Root Causes Identified & Fixed:**

#### ✅ **1. Fixed: `window.location.origin` Error**
**Problem**: `window.location.origin` doesn't exist in React Native production builds
**Solution**: Updated redirect URLs to use Expo's production URL

**Before:**
```typescript
emailRedirectTo: `${window.location.origin}/auth/callback`
```

**After:**
```typescript
emailRedirectTo: 'https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8/auth/callback'
```

---

#### ✅ **2. Fixed: Improved Error Handling**
**Problem**: Generic error messages made debugging difficult
**Solution**: Added detailed logging and specific error messages

**Before:**
```typescript
Alert.alert('Error', 'An unexpected error occurred');
```

**After:**
```typescript
console.log('Sign up result:', result);
if (result.error) {
  console.error('Sign up failed:', result.error);
  Alert.alert('Sign Up Failed', result.error.message || 'An error occurred during sign up.');
}
```

---

#### ✅ **3. Fixed: Better Exception Handling**
**Problem**: Unhandled exceptions caused silent failures
**Solution**: Added try-catch blocks with proper error logging

---

## 🔧 **Additional Fixes Needed**

### **4. Supabase Configuration Check**

You need to configure Supabase for production:

#### **A. Email Templates (Required)**
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/svgpmbhocwhcnqmyuhzv
2. Navigate to **Authentication > Email Templates**
3. Configure the **Confirm signup** template
4. Set the **Redirect URL** to: `https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8/auth/callback`

#### **B. Site URL Configuration**
1. In Supabase dashboard, go to **Authentication > Settings**
2. Set **Site URL** to: `https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8`
3. Add **Redirect URLs**:
   - `https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8/auth/callback`
   - `https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8/auth/reset-password`

#### **C. Email Settings**
1. Go to **Authentication > Settings > Email**
2. Ensure **Enable email confirmations** is ON
3. Configure SMTP settings (or use Supabase's default)

---

### **5. Environment-Specific Configuration**

Create environment-specific Supabase configuration:

#### **A. Create Environment Variables**
Create a `.env` file in your project root:

```bash
# Development
EXPO_PUBLIC_SUPABASE_URL=https://svgpmbhocwhcnqmyuhzv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Z3BtYmhvY3doY25xbXl1aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDAyMDUsImV4cCI6MjA2OTQ3NjIwNX0.bjIG4_5vqTtQbraCvdaqn3-jaT7iB6m-Q1G7jL71I6M

# Production redirect URLs
EXPO_PUBLIC_PROD_REDIRECT_URL=https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8
```

#### **B. Update Supabase Configuration**
Update `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://svgpmbhocwhcnqmyuhzv.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'your-anon-key';

// Get the redirect URL based on environment
const getRedirectUrl = () => {
  if (__DEV__) {
    return 'http://localhost:8081'; // Development
  }
  return 'https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8'; // Production
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rnAsyncStorage,
    autoRefreshToken: !isNodeEnvironment,
    persistSession: !isNodeEnvironment,
    detectSessionInUrl: false,
  },
});

export { getRedirectUrl };
```

---

## 🧪 **Testing Steps**

### **1. Test in Development**
```bash
# Start development server
npm start

# Test sign-up with logging
# Check console for detailed error messages
```

### **2. Test Production Build**
```bash
# Build preview
npm run build:preview

# Or publish update
npm run deploy:preview

# Test on device with Expo Go or installed APK
```

### **3. Monitor Logs**
```bash
# View Expo logs
npx expo start --tunnel

# Check Supabase logs in dashboard
# Authentication > Logs
```

---

## 🔍 **Debugging Checklist**

### **Before Testing:**
- [ ] Supabase site URL configured
- [ ] Redirect URLs added to Supabase
- [ ] Email templates configured
- [ ] SMTP settings configured
- [ ] Environment variables set

### **During Testing:**
- [ ] Check console logs for detailed errors
- [ ] Verify network connectivity
- [ ] Test with different email addresses
- [ ] Check Supabase authentication logs
- [ ] Verify email delivery

### **Common Issues:**

#### **"Invalid redirect URL"**
- Add the exact URL to Supabase redirect URLs
- Ensure URL matches exactly (including protocol)

#### **"Email not confirmed"**
- Check email templates in Supabase
- Verify SMTP configuration
- Check spam folder

#### **"Network error"**
- Check internet connection
- Verify Supabase URL is accessible
- Check for firewall restrictions

#### **"Invalid credentials"**
- Verify Supabase anon key
- Check if project is active
- Ensure API keys are correct

---

## 🚀 **Quick Fix Commands**

### **1. Update Supabase Configuration**
```bash
# Check current Supabase status
curl -I https://svgpmbhocwhcnqmyuhzv.supabase.co/rest/v1/

# Test authentication endpoint
curl -X POST https://svgpmbhocwhcnqmyuhzv.supabase.co/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Z3BtYmhvY3doY25xbXl1aHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MDAyMDUsImV4cCI6MjA2OTQ3NjIwNX0.bjIG4_5vqTtQbraCvdaqn3-jaT7iB6m-Q1G7jL71I6M" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **2. Deploy with Debugging**
```bash
# Deploy with detailed logging
npm run deploy:preview

# Test immediately
npm run tunnel
```

### **3. Monitor in Real-Time**
```bash
# Watch logs while testing
npx expo start --tunnel

# In another terminal, monitor Supabase
# Go to: https://supabase.com/dashboard/project/svgpmbhocwhcnqmyuhzv/auth/logs
```

---

## 📱 **Production Testing Workflow**

### **Step 1: Deploy Updated Code**
```bash
npm run deploy:preview
```

### **Step 2: Test Sign-Up**
1. Open app on device
2. Try to sign up with a test email
3. Check console logs for detailed error messages
4. Verify email is sent (check inbox/spam)

### **Step 3: Check Supabase Logs**
1. Go to Supabase dashboard
2. Navigate to **Authentication > Logs**
3. Look for sign-up attempts and errors

### **Step 4: Verify Email Delivery**
1. Check email inbox
2. Check spam folder
3. Verify email template is correct

---

## 🎯 **Expected Results After Fixes**

### **Successful Sign-Up Flow:**
1. User enters email/password
2. App shows "Attempting sign up..." in console
3. Supabase processes request
4. User receives confirmation email
5. App shows success message
6. User can verify email and sign in

### **Console Logs Should Show:**
```
Attempting sign up...
Sign up result: { error: null }
SignUp successful
```

### **If Still Failing:**
- Check Supabase authentication logs
- Verify email configuration
- Test with different email providers
- Check network connectivity

---

## 🆘 **If Issues Persist**

### **1. Check Supabase Status**
- Visit: https://status.supabase.com/
- Ensure all services are operational

### **2. Verify Project Settings**
- Go to: https://supabase.com/dashboard/project/svgpmbhocwhcnqmyuhzv/settings/general
- Ensure project is not paused or suspended

### **3. Test API Directly**
```bash
# Test sign-up API directly
curl -X POST 'https://svgpmbhocwhcnqmyuhzv.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "options": {
      "emailRedirectTo": "https://u.expo.dev/b080776e-4978-46cb-9664-41401dd870d8/auth/callback"
    }
  }'
```

### **4. Contact Support**
- Expo: https://forums.expo.dev/
- Supabase: https://github.com/supabase/supabase/discussions

---

## ✅ **Summary of Changes Made**

1. **Fixed `window.location.origin` errors** in production
2. **Updated redirect URLs** to use Expo's production URL
3. **Added comprehensive error logging** for debugging
4. **Improved error messages** for better user experience
5. **Added try-catch blocks** for exception handling

**Next Steps:**
1. Configure Supabase redirect URLs
2. Deploy updated code
3. Test sign-up in production
4. Monitor logs for any remaining issues

---

**The sign-up should now work in production! 🎉**
