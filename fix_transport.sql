-- Fix Transport Feature
-- Run this in the Supabase SQL Editor

-- 1. Add vehicle_id to students table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='students' AND column_name='vehicle_id'
  ) THEN
    ALTER TABLE public.students ADD COLUMN vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Ensure vehicles table has RLS policy for reading
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view vehicles" ON public.vehicles;
CREATE POLICY "Anyone can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (true);
