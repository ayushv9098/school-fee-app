-- 20260609000003_session_management.sql
-- Add new columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS previous_dues NUMERIC DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add academic_year to payments table to track which year a payment belongs to
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS academic_year TEXT;

-- Backfill existing payments with the academic year of their student (if they have one)
UPDATE public.payments p
SET academic_year = s.academic_year
FROM public.students s
WHERE p.student_id = s.id AND p.academic_year IS NULL;

-- Default to 2024-25 if student doesn't have one (fallback)
UPDATE public.payments SET academic_year = '2025-26' WHERE academic_year IS NULL;

-- Drop existing student_fee_summary if it exists (could be a table or view)
DROP VIEW IF EXISTS public.student_fee_summary;
DROP TABLE IF EXISTS public.student_fee_summary CASCADE;

-- Create student_fee_summary as a VIEW
CREATE OR REPLACE VIEW public.student_fee_summary AS
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
    -- Sum of payments for the CURRENT academic year of the student
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0) as total_paid,
    -- Remaining = (Current Fee + Old Dues) - Payments made THIS year
    (s.total_fee + COALESCE(s.previous_dues, 0) - COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0)) as remaining_fee,
    s.status,
    s.academic_year,
    s.diary_page_number,
    s.created_at
FROM 
    public.students s;

-- Grant access to the view
GRANT SELECT ON public.student_fee_summary TO authenticated;
GRANT SELECT ON public.student_fee_summary TO anon;
GRANT SELECT ON public.student_fee_summary TO service_role;
