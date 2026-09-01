-- Migration: Add Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    academic_year TEXT DEFAULT '2025-26',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own holidays" ON public.holidays
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT user_id FROM public.teachers WHERE auth_user_id = auth.uid())
    );
