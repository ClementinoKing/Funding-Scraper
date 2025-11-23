# Database Setup Guide

## Fixing the 500 Error During User Signup

If you're experiencing a 500 error when users try to sign up, it's likely because your Supabase database is missing the `profiles` table or has a broken trigger.

### Quick Fix (Two Steps)

**Step 1: Temporary Fix (Immediate)**
1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase-quick-fix.sql`
4. Run the SQL script
5. Try signing up again - this should work immediately

**Step 2: Permanent Fix (Recommended)**
1. Still in the SQL Editor
2. Copy and paste the contents of `supabase-migration.sql`
3. Run the SQL script
4. This sets up the proper database structure for long-term use

### What This Does

The migration script:
- Creates a `profiles` table to store user profile data
- Sets up Row Level Security (RLS) policies so users can only access their own data
- Creates a trigger that automatically creates a profile when a new user signs up
- Handles errors gracefully so user creation doesn't fail if the profile creation has issues

### Manual Profile Creation

If you prefer to create profiles manually (or if the trigger still fails), the app will automatically try to create a profile after signup using the `createUserProfile()` function in `src/lib/auth.js`.

### Troubleshooting

**Error: "relation 'profiles' does not exist"**
- Run the migration script to create the table

**Error: "permission denied for table profiles"**
- Check that RLS policies are set up correctly
- Verify that the `authenticated` role has permissions

**Error: "function handle_new_user() does not exist"**
- Run the migration script to create the function

**Still getting 500 errors?**
- Check the Supabase logs in the Dashboard under Logs > Postgres Logs
- Look for specific error messages that can help identify the issue
- The improved error handling in the app will now show more detailed error messages

### Alternative: Disable Automatic Profile Creation

If you want to disable the automatic profile creation trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

Then profiles will only be created manually through the app's `createUserProfile()` function.

