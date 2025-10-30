-- Add system_prompt column for AI agents if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ai_agents'
      AND column_name = 'system_prompt'
  ) THEN
    ALTER TABLE public.ai_agents ADD COLUMN system_prompt text;
  END IF;
END $$;

-- ============================================
-- SUPABASE DATABASE SCHEMA & RLS POLICIES FIX
-- ============================================
-- This migration fixes the RLS policy issue preventing OAuth users from being created

-- ============================================
-- 1. USERS TABLE
-- ============================================

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    call_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_mode TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

-- Create new policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = auth_user_id OR auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id OR auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = auth_user_id OR auth.uid() = id)
    WITH CHECK (auth.uid() = auth_user_id OR auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything"
    ON public.users
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- ============================================
-- 2. BUSINESS PROFILES TABLE
-- ============================================

-- Create business_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    business_name TEXT,
    business_category TEXT,
    default_language TEXT,
    timezone TEXT,
    use_business_hours BOOLEAN DEFAULT FALSE,
    ai_phone_number TEXT,
    phone_country_code TEXT,
    phone_area_code TEXT,
    voice_model TEXT,
    voice_tone TEXT,
    whatsapp_connected BOOLEAN DEFAULT FALSE,
    telegram_connected BOOLEAN DEFAULT FALSE,
    test_call_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own business profile" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can insert their own business profile" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profile" ON public.business_profiles;
DROP POLICY IF EXISTS "Users can delete their own business profile" ON public.business_profiles;

-- Create policies
CREATE POLICY "Users can view their own business profile"
    ON public.business_profiles
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own business profile"
    ON public.business_profiles
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own business profile"
    ON public.business_profiles
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own business profile"
    ON public.business_profiles
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);

-- ============================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;

-- Create triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at
    BEFORE UPDATE ON public.business_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.business_profiles TO authenticated;

-- Grant permissions to anon role (for public access if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.users TO anon;

-- ============================================
-- DONE!
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- After running, test the OAuth flow again

-- ============================================
-- 5. AI AGENT TRANSCRIPTS TABLE
-- ============================================

-- Create ai_agent_transcripts table if not exists
CREATE TABLE IF NOT EXISTS public.ai_agent_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  call_id TEXT,
  transcript_text TEXT NOT NULL,
  transcript_json JSONB,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_transcripts_agent_id ON public.ai_agent_transcripts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transcripts_user_id ON public.ai_agent_transcripts(user_id);

