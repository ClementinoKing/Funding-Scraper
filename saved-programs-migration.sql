-- Migration for saved_programs table
-- This creates the saved_programs table with proper constraints and RLS policies

-- Create the saved_programs table
CREATE TABLE IF NOT EXISTS public.saved_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NULL,
  subprogram_id uuid NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT saved_programs_pkey PRIMARY KEY (id),
  CONSTRAINT saved_programs_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE SET NULL,
  CONSTRAINT saved_programs_subprogram_id_fkey FOREIGN KEY (subprogram_id) REFERENCES subprograms (id) ON DELETE SET NULL,
  CONSTRAINT saved_programs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add unique constraint to prevent duplicate saves
-- A user can only save a program once, and a user can only save a subprogram once
CREATE UNIQUE INDEX IF NOT EXISTS saved_programs_user_program_unique 
  ON public.saved_programs (user_id, program_id) 
  WHERE program_id IS NOT NULL AND subprogram_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS saved_programs_user_subprogram_unique 
  ON public.saved_programs (user_id, subprogram_id) 
  WHERE subprogram_id IS NOT NULL AND program_id IS NULL;

-- Ensure exactly one of program_id or subprogram_id is set (check constraint)
ALTER TABLE public.saved_programs 
  DROP CONSTRAINT IF EXISTS saved_programs_program_or_subprogram_check;

ALTER TABLE public.saved_programs 
  ADD CONSTRAINT saved_programs_program_or_subprogram_check 
  CHECK (
    (program_id IS NOT NULL AND subprogram_id IS NULL) OR 
    (program_id IS NULL AND subprogram_id IS NOT NULL)
  );

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_programs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own saved programs" ON public.saved_programs;
DROP POLICY IF EXISTS "Users can insert own saved programs" ON public.saved_programs;
DROP POLICY IF EXISTS "Users can update own saved programs" ON public.saved_programs;
DROP POLICY IF EXISTS "Users can delete own saved programs" ON public.saved_programs;

-- Policy: Users can view their own saved programs
CREATE POLICY "Users can view own saved programs"
  ON public.saved_programs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved programs
CREATE POLICY "Users can insert own saved programs"
  ON public.saved_programs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own saved programs (e.g., notes)
CREATE POLICY "Users can update own saved programs"
  ON public.saved_programs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved programs
CREATE POLICY "Users can delete own saved programs"
  ON public.saved_programs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.saved_programs TO authenticated;
GRANT SELECT ON public.saved_programs TO anon;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS saved_programs_user_id_idx ON public.saved_programs(user_id);
CREATE INDEX IF NOT EXISTS saved_programs_program_id_idx ON public.saved_programs(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS saved_programs_subprogram_id_idx ON public.saved_programs(subprogram_id) WHERE subprogram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS saved_programs_created_at_idx ON public.saved_programs(created_at DESC);

-- Verify the setup
SELECT 'saved_programs table migration completed successfully!' AS status;

