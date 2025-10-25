# Supabase Authentication Setup Guide

This guide will help you configure Supabase authentication for your Next.js admin dashboard.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project URL and anon key

## Environment Configuration

1. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project credentials.

## Supabase Dashboard Configuration

### 1. Enable Email Authentication

1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Settings**
3. Under **Auth Providers**, enable **Email**
4. Configure email settings:
   - **Enable email confirmations**: ✅ (Required for this setup)
   - **Enable email change confirmations**: ✅
   - **Enable password resets**: ✅

### 2. Configure Google OAuth (Optional)

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Under **Auth Providers**, enable **Google**
3. You'll need to:
   - Create a Google OAuth app in [Google Cloud Console](https://console.cloud.google.com)
   - Add your domain to authorized origins
   - Configure the OAuth consent screen
   - Add the Google OAuth credentials to Supabase

### 3. Configure Redirect URLs

1. Go to **Authentication** > **URL Configuration**
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
   - `http://localhost:3000/auth/reset-password` (for development)
   - `https://yourdomain.com/auth/reset-password` (for production)

### 4. Email Templates (Optional)

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirm signup
   - Reset password
   - Magic link

## Features Implemented

### ✅ Authentication Features
- [x] Email/password registration with email verification
- [x] Email/password login
- [x] Google OAuth sign-in
- [x] Password reset via email
- [x] Email verification flow
- [x] Protected dashboard routes
- [x] User session management
- [x] Logout functionality

### ✅ Pages Created
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form
- `/auth/verify-email` - Email verification status
- `/auth/callback` - OAuth callback handler

### ✅ Security Features
- [x] Route protection middleware
- [x] Server-side authentication validation
- [x] Automatic redirects for authenticated/unauthenticated users
- [x] Session persistence across page refreshes

## Testing the Implementation

### 1. Registration Flow
1. Go to `/auth/register`
2. Enter email and password
3. Check email for verification link
4. Click verification link
5. Should redirect to dashboard

### 2. Login Flow
1. Go to `/auth/login`
2. Enter verified email and password
3. Should redirect to dashboard

### 3. Google OAuth Flow
1. Go to `/auth/login`
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. Should redirect to dashboard

### 4. Password Reset Flow
1. Go to `/auth/forgot-password`
2. Enter email address
3. Check email for reset link
4. Click reset link
5. Set new password
6. Should redirect to login

### 5. Protected Routes
1. Try accessing `/dashboard` without login
2. Should redirect to `/auth/login`
3. After login, should access dashboard normally

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Check your `.env.local` file has correct Supabase credentials
   - Ensure environment variables are prefixed with `NEXT_PUBLIC_`

2. **OAuth redirect errors**
   - Verify redirect URLs in Supabase dashboard
   - Check Google OAuth configuration

3. **Email not sending**
   - Check Supabase email settings
   - Verify SMTP configuration in Supabase dashboard

4. **Middleware redirect loops**
   - Check middleware configuration
   - Verify route patterns in `middleware.ts`

### Debug Mode

To enable debug logging, add this to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## File Structure

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Client-side Supabase client
│   │   ├── server.ts          # Server-side Supabase client
│   │   └── middleware.ts       # Middleware auth helper
│   └── auth/
│       ├── auth-context.tsx    # Auth React context
│       └── use-auth.ts         # Auth hook
├── types/
│   └── auth.ts                 # Auth TypeScript types
├── server/
│   └── auth-actions.ts         # Server-side auth actions
├── app/(main)/auth/
│   ├── _components/            # Auth form components
│   ├── forgot-password/        # Password reset pages
│   ├── reset-password/
│   ├── verify-email/
│   └── callback/               # OAuth callback
└── middleware.ts               # Route protection middleware
```

## Next Steps

1. **Customize UI**: Modify the auth pages to match your design
2. **Add more OAuth providers**: Facebook, GitHub, etc.
3. **Implement user roles**: Add role-based access control
4. **Add MFA**: Implement multi-factor authentication
5. **Custom user profiles**: Add user profile management

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
