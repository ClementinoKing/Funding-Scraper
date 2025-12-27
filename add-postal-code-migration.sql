-- Migration: Add postal_code field and make registration fields mandatory
-- Run this in your Supabase SQL Editor

-- Step 1: Add postal_code column to user_profiles table (if it doesn't exist)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Step 2: Add comment to postal_code column
COMMENT ON COLUMN public.user_profiles.postal_code IS 'South African postal code (4 digits)';

-- Step 3: Note about making fields mandatory
-- Note: Making columns NOT NULL requires all existing rows to have values
-- If you have existing data, you'll need to:
-- 1. Update existing rows with default values first
-- 2. Then alter the columns to be NOT NULL
-- 
-- Example (uncomment and modify if needed):
-- UPDATE public.user_profiles 
-- SET company_registration_number = 'TBD' 
-- WHERE company_registration_number IS NULL;
-- 
-- UPDATE public.user_profiles 
-- SET business_registration_date = CURRENT_DATE 
-- WHERE business_registration_date IS NULL;
-- 
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN company_registration_number SET NOT NULL;
-- 
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN business_registration_date SET NOT NULL;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('postal_code', 'company_registration_number', 'business_registration_date')
ORDER BY column_name;

SELECT 'Migration completed successfully!' AS status;

