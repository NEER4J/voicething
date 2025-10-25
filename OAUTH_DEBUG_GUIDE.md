# OAuth Debug Guide

## Quick Debug Steps

### 1. Check the Debug Page
Visit `http://localhost:3000/auth/debug` to see:
- URL parameters received
- Current session status
- User authentication status
- Environment variables

### 2. Check Browser Console
Open browser dev tools and look for:
- OAuth redirect errors
- Network request failures
- Console error messages

### 3. Check Supabase Logs
1. Go to your Supabase dashboard
2. Navigate to **Logs > Auth**
3. Look for error messages during OAuth attempts

## Common Issues and Solutions

### Issue 1: "callback_error" - OAuth Callback Failing

**Possible Causes:**
1. **Wrong redirect URL in Supabase**
2. **Missing Google OAuth configuration**
3. **Environment variables not set**

**Solution:**
1. **Check Supabase Dashboard:**
   - Go to **Authentication > Settings > URL Configuration**
   - Ensure these URLs are added:
     ```
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback
     ```

2. **Check Google OAuth Setup:**
   - Go to **Authentication > Settings > Auth Providers**
   - Ensure Google is enabled
   - Verify Client ID and Client Secret are set

3. **Check Environment Variables:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Issue 2: OAuth Redirects to Wrong URL

**Check Google Cloud Console:**
1. Go to **APIs & Services > Credentials**
2. Edit your OAuth 2.0 Client ID
3. **Authorized redirect URIs** should include:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### Issue 3: Session Not Persisting

**Check Middleware Configuration:**
- Ensure middleware is not interfering with auth flow
- Check if cookies are being set correctly

## Step-by-Step Debugging

### Step 1: Test OAuth URL Manually
Try accessing this URL directly (replace with your project URL):
```
https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://localhost:3000/auth/callback
```

### Step 2: Check Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Try Google OAuth
4. Look for failed requests to:
   - `https://your-project.supabase.co/auth/v1/authorize`
   - `http://localhost:3000/auth/callback`

### Step 3: Verify Supabase Configuration
1. **Authentication > Settings > URL Configuration:**
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

2. **Authentication > Settings > Auth Providers:**
   - Google: ✅ Enabled
   - Client ID: ✅ Set
   - Client Secret: ✅ Set

### Step 4: Test with Debug Page
1. Go to `http://localhost:3000/auth/debug`
2. Check if environment variables are set
3. Try OAuth and see what parameters are received

## Expected OAuth Flow

1. **User clicks "Continue with Google"**
2. **Redirects to:** `https://your-project.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://localhost:3000/auth/callback`
3. **Google OAuth flow**
4. **Google redirects to:** `https://your-project.supabase.co/auth/v1/callback?code=...`
5. **Supabase processes OAuth**
6. **Supabase redirects to:** `http://localhost:3000/auth/callback?access_token=...&refresh_token=...`
7. **Your app processes callback**
8. **Redirects to dashboard**

## Quick Fixes

### Fix 1: Update Supabase Redirect URLs
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### Fix 2: Update Google OAuth Settings
```
Authorized redirect URIs:
https://your-project.supabase.co/auth/v1/callback
```

### Fix 3: Clear Browser Data
- Clear cookies and cache
- Try in incognito mode

### Fix 4: Restart Development Server
```bash
npm run dev
```

## Still Not Working?

1. **Check Supabase status page** for service issues
2. **Verify your Supabase project is active**
3. **Ensure Google OAuth app is not in testing mode**
4. **Check if your domain is verified** in Google Cloud Console
5. **Try the debug page** to see what's happening

## Production Considerations

For production:
1. **Update all URLs** to use your production domain
2. **Update Google OAuth settings** with production URLs
3. **Ensure HTTPS** is enabled
4. **Test in production environment**
