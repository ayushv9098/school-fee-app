-- Complete Script for Attendance System
-- Run this script in the Supabase SQL Editor

-- 1. Create the student_attendance table if it does not exist
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    type TEXT NOT NULL CHECK (type IN ('class', 'vehicle')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date, type)
);

-- 2. Allow Attendance Staff (Teachers) to view students belonging to their admin
DROP POLICY IF EXISTS "Users can only access their own students" ON public.students;
CREATE POLICY "Users can access their own students or students of their admin" 
ON public.students 
FOR ALL 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.teachers 
    WHERE auth_user_id = auth.uid() AND user_id = students.user_id
  )
);

-- 3. Allow Attendance Staff to view vehicles belonging to their admin
DROP POLICY IF EXISTS "Users can only access their own vehicles" ON public.vehicles;
CREATE POLICY "Users can access their own vehicles or vehicles of their admin" 
ON public.vehicles 
FOR ALL 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.teachers 
    WHERE auth_user_id = auth.uid() AND user_id = vehicles.user_id
  )
);

-- 4. Ensure Admin and Attendance Staff can insert/update student_attendance
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin and Staff can manage student_attendance" ON public.student_attendance;
CREATE POLICY "Admin and Staff can manage student_attendance" 
ON public.student_attendance 
FOR ALL 
USING (true)
WITH CHECK (true);
