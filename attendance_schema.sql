-- 1. Add vehicle_id to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- 2. Update the student_fee_summary view to include vehicle_id
DROP VIEW IF EXISTS public.student_fee_summary;

CREATE OR REPLACE VIEW public.student_fee_summary WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.user_id,
    s.name,
    s.class,
    s.mobile,
    s.email,
    s.guardian_name,
    s.address,
    s.total_fee,
    COALESCE(s.previous_dues, 0) as previous_dues,
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0) as total_paid,
    (s.total_fee + COALESCE(s.previous_dues, 0) - COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0)) as remaining_fee,
    CASE 
        WHEN (s.total_fee + COALESCE(s.previous_dues, 0) - COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0)) <= 0 THEN 'paid'
        WHEN COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0) > 0 THEN 'partial'
        ELSE 'unpaid'
    END as payment_status,
    s.status,
    s.academic_year,
    s.diary_page_number,
    s.vehicle_id,
    s.created_at
FROM 
    public.students s;

-- 3. Create student_attendance table
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present', -- 'present', 'absent'
    type TEXT NOT NULL, -- 'class' or 'vehicle'
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL, -- relevant for 'vehicle' type
    marked_by UUID REFERENCES auth.users(id), -- user who marked it
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, date, type)
);

-- Enable RLS
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view all student attendance" ON public.student_attendance FOR SELECT USING (true);
CREATE POLICY "Users can insert student attendance" ON public.student_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update student attendance" ON public.student_attendance FOR UPDATE USING (true);
CREATE POLICY "Users can delete student attendance" ON public.student_attendance FOR DELETE USING (true);

-- (Policies are set to true to allow any authenticated staff to mark attendance. In a strict setup, we would check if auth.uid() is valid)
