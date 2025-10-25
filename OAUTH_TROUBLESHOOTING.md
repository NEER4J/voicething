# Google OAuth Troubleshooting Guide

## Common Issues and Solutions

### 1. "callback_error" when using Google OAuth

This error occurs when the OAuth callback fails. Here are the most common causes and solutions:

#### A. Supabase Configuration Issues

**Check your Supabase dashboard:**

1. **Go to Authentication > Settings > URL Configuration**
2. **Add these redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

3. **Go to Authentication > Settings > Auth Providers**
4. **Enable Google provider and configure:**
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

#### B. Google Cloud Console Configuration

**In your Google Cloud Console:**

1. **Go to APIs & Services > Credentials**
2. **Create OAuth 2.0 Client ID (if not exists)**
3. **Configure Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
4. **Configure Authorized redirect URIs:**
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

#### C. Environment Variables

**Check your `.env.local` file:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Debug Steps

#### Step 1: Check Browser Console
Open browser dev tools and look for errors when clicking "Continue with Google"

#### Step 2: Check Network Tab
Look for failed requests to:
- `https://your-project.supabase.co/auth/v1/authorize`
- `http://localhost:3000/auth/callback`

#### Step 3: Check Supabase Logs
1. Go to your Supabase dashboard
2. Navigate to **Logs > Auth**
3. Look for error messages during OAuth attempts

#### Step 4: Test OAuth URL
Try accessing this URL directly (replace with your project URL):
```
https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://localhost:3000/auth/callback
```

### 3. Common Configuration Mistakes

#### ❌ Wrong Redirect URL in Supabase
```
❌ http://localhost:3000/auth/callback
✅ https://your-project.supabase.co/auth/v1/callback
```

#### ❌ Missing Google OAuth Setup
- Google OAuth app not created
- Client ID/Secret not added to Supabase
- OAuth consent screen not configured

#### ❌ Domain Mismatch
- Google OAuth app domain doesn't match your app
- Authorized origins don't include your domain

### 4. Step-by-Step Setup

#### A. Google Cloud Console Setup

1. **Create a new project or select existing**
2. **Enable Google+ API**
3. **Go to Credentials > Create Credentials > OAuth 2.0 Client ID**
4. **Application type: Web application**
5. **Name: Your App Name**
6. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://yourdomain.com
   ```
7. **Authorized redirect URIs:**
   ```
   https://your-project.supabase.co/auth/v1/callback
8. **Save and copy Client ID and Client Secret**

#### B. Supabase Dashboard Setup

1. **Go to Authentication > Settings**
2. **Enable Google provider**
3. **Add Google OAuth credentials:**
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)
4. **Go to URL Configuration**
5. **Add redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

### 5. Testing the Fix

1. **Clear browser cache and cookies**
2. **Restart your development server**
3. **Try Google OAuth again**
4. **Check browser console for errors**
5. **Check Supabase logs for detailed error messages**

### 6. Alternative Debugging

If the issue persists, try this debug version of the Google button:

```tsx
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  
  try {
    console.log('Starting Google OAuth...');
    const { error } = await signInWithGoogle();
    
    if (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed", {
        description: error,
      });
    } else {
      console.log('Google OAuth initiated successfully');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    toast.error("An unexpected error occurred");
  }
  
  setIsLoading(false);
};
```

### 7. Still Having Issues?

1. **Check Supabase status page** for service issues
2. **Verify your Supabase project is active**
3. **Ensure your Google OAuth app is not in testing mode** (if you want to allow all users)
4. **Check if your domain is verified** in Google Cloud Console

### 8. Production Considerations

For production deployment:

1. **Update redirect URLs** to include your production domain
2. **Update Google OAuth settings** with production URLs
3. **Ensure HTTPS** is enabled for production
4. **Test OAuth flow** in production environment

## Quick Checklist

- [ ] Supabase Google provider enabled
- [ ] Google OAuth credentials added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Google Cloud Console OAuth app created
- [ ] Authorized origins configured in Google
- [ ] Environment variables set correctly
- [ ] Browser cache cleared
- [ ] Development server restarted
