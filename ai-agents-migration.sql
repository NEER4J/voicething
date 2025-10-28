-- ============================================
-- AI AGENTS TABLE MIGRATION
-- ============================================
-- This migration creates the ai_agents table for managing Vapi AI assistants

-- ============================================
-- 1. AI_AGENTS TABLE
-- ============================================

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    language TEXT NOT NULL,
    tone TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    voice_name TEXT NOT NULL,
    greeting_message TEXT,
    vapi_assistant_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Users can insert their own agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.ai_agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.ai_agents;

-- Create policies
CREATE POLICY "Users can view their own agents"
    ON public.ai_agents
    FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own agents"
    ON public.ai_agents
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own agents"
    ON public.ai_agents
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own agents"
    ON public.ai_agents
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_vapi_assistant_id ON public.ai_agents(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_is_active ON public.ai_agents(is_active);

-- ============================================
-- 2. UPDATED_AT TRIGGER
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON public.ai_agents;

-- Create trigger for updated_at
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.ai_agents TO authenticated;

-- ============================================
-- DONE!
-- ============================================
-- Run this SQL in your Supabase SQL Editor

