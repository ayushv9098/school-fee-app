-- Drop the old view if it exists
DROP VIEW IF EXISTS public.student_fee_summary CASCADE;

-- Create the updated view with payment_status
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
    s.created_at
FROM 
    public.students s;

-- Grant access
GRANT SELECT ON public.student_fee_summary TO authenticated;
GRANT SELECT ON public.student_fee_summary TO anon;
GRANT SELECT ON public.student_fee_summary TO service_role;
