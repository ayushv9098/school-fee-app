-- Add missing columns to student_attendance
ALTER TABLE public.student_attendance ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES auth.users(id);
ALTER TABLE public.student_attendance ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id);
