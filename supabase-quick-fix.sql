-- Quick Fix: Disable problematic trigger temporarily
-- This will allow user signup to work while you fix the trigger

-- Option 1: Drop the trigger completely (safest)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Option 2: If you want to keep the trigger but make it non-blocking,
-- update the function to handle errors gracefully (already done in migration.sql)

-- After running this, try signing up again.
-- Then run the full migration.sql to properly set up the profiles table and trigger.

