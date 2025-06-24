# Supabase OAuth Configuration

This guide explains how to configure Supabase as an OAuth provider in the TEL Cognitive Platform.

## Current Status

✅ **Ready to use without Supabase OAuth**: The application is configured to run with or without Supabase OAuth credentials.

✅ **Supabase Database**: Currently using Supabase PostgreSQL database for storage.

⚠️ **Supabase OAuth**: Optional - requires setup if you want Supabase as a login provider.

## Environment Variables Status

### Required (Already Configured)
- `DATABASE_URL`: ✅ Using Supabase PostgreSQL
- `BETTER_AUTH_SECRET`: ✅ Configured
- `BETTER_AUTH_URL`: ✅ Configured
- `NEXT_PUBLIC_APP_URL`: ✅ Configured

### Optional Supabase Variables
- `NEXT_PUBLIC_SUPABASE_URL`: ✅ Configured for Supabase client SDK
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: ✅ Configured for Supabase client SDK
- `SUPABASE_CLIENT_ID`: ⚠️ Currently commented out - needed only for OAuth login
- `SUPABASE_CLIENT_SECRET`: ⚠️ Currently commented out - needed only for OAuth login

## How to Enable Supabase OAuth (Optional)

If you want to allow users to log in using Supabase OAuth, follow these steps:

### 1. Create Supabase OAuth Application

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings → OAuth
3. Create a new OAuth application with these settings:
   - **Name**: TEL Cognitive Platform
   - **Redirect URI**: `http://localhost:3000/api/auth/oauth2/callback/supabase`
   - **Scopes**: `database.read`, `database.write`, `projects.read`

### 2. Update Environment Variables

Uncomment and set the following in your `.env` file:

```bash
SUPABASE_CLIENT_ID=your_supabase_oauth_client_id
SUPABASE_CLIENT_SECRET=your_supabase_oauth_client_secret
```

### 3. Restart the Application

After adding the credentials, restart your development server:

```bash
npm run dev
```

## Current Authentication Providers

The application currently supports these login methods:

✅ **Email/Password**: Direct registration and login
✅ **Google OAuth**: Using Google account
✅ **GitHub OAuth**: Using GitHub account  
✅ **Microsoft OAuth**: Using Microsoft account
⚠️ **Supabase OAuth**: Optional - requires setup above

## Database vs OAuth Provider

**Important**: Supabase serves two different roles in this application:

1. **Database Provider** (✅ Active): Supabase PostgreSQL is used for storing user data, sessions, and application data
2. **OAuth Provider** (⚠️ Optional): Supabase can also be used as a login method, but this requires separate OAuth app setup

You can use Supabase database without enabling Supabase OAuth login.

## Troubleshooting

### Error: "SUPABASE_CLIENT_ID is not defined"
- This means Supabase OAuth credentials are missing
- Either add the credentials or remove Supabase from the OAuth providers list
- The application will work fine without Supabase OAuth

### Error: "Cannot connect to database"
- Check your `DATABASE_URL` is correct
- Ensure your Supabase database is running
- Verify network connectivity to Supabase

### Users can't log in with existing providers
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify OAuth redirect URIs are configured correctly in Google Console
- Check that `BETTER_AUTH_SECRET` is set and is at least 32 characters

## Next Steps

1. **For basic usage**: Your current configuration is sufficient
2. **For Supabase OAuth**: Follow the setup guide above
3. **For production**: Update redirect URIs to your production domain
4. **For additional providers**: Check the auth.ts file for other available OAuth providers