-- SQL Schema for School Fee App (Synced with Live Database)

-- 1. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    guardian_name TEXT,
    address TEXT,
    total_fee NUMERIC DEFAULT 0,
    previous_dues NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    academic_year TEXT DEFAULT '2025-26',
    diary_page_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT now(),
    mode TEXT NOT NULL, -- 'Cash', 'UPI', 'Bank Transfer', 'Cheque'
    note TEXT,
    fee_for TEXT,
    receipt_number TEXT,
    payment_date DATE,
    academic_year TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    monthly_salary NUMERIC NOT NULL,
    email TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'teacher',
    shift_start_time TIME,
    shift_end_time TIME,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Teacher Payments Table
CREATE TABLE IF NOT EXISTS public.teacher_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    mode TEXT DEFAULT 'Cash',
    note TEXT,
    paid_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Magic, Van, Auto, etc.
    license_plate TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Vehicle Expenses Table
CREATE TABLE IF NOT EXISTS public.vehicle_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    expense_type TEXT NOT NULL, -- Diesel, Petrol, Maintenance, Other
    amount NUMERIC NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Building & Other Expenses Table
CREATE TABLE IF NOT EXISTS public.building_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    category TEXT NOT NULL, -- Rent, Electricity, Maintenance, Other
    amount NUMERIC NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    admin_user_id UUID REFERENCES auth.users(id),
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_lat NUMERIC,
    check_in_lng NUMERIC,
    check_out_lat NUMERIC,
    check_out_lng NUMERIC,
    lat NUMERIC, -- Legacy/Specific lat
    lng NUMERIC, -- Legacy/Specific lng
    last_lat DOUBLE PRECISION, -- Live tracking
    last_lng DOUBLE PRECISION, -- Live tracking
    selfie_url TEXT,
    status TEXT DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'on_leave'
    late_entry BOOLEAN DEFAULT FALSE,
    early_exit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(teacher_id, date)
);

-- 10. Staff Movements Table
CREATE TABLE IF NOT EXISTS public.staff_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    exit_time TIMESTAMPTZ DEFAULT now(),
    return_time TIMESTAMPTZ,
    exit_lat DOUBLE PRECISION,
    exit_lng DOUBLE PRECISION,
    return_lat DOUBLE PRECISION,
    return_lng DOUBLE PRECISION,
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    is_outside BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. School Settings Table
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    school_name TEXT,
    address TEXT,
    mobile TEXT,
    instagram TEXT,
    lat NUMERIC,
    lng NUMERIC,
    radius NUMERIC DEFAULT 100,
    push_token TEXT,
    school_start_time TIME DEFAULT '09:30:00',
    school_end_time TIME DEFAULT '15:40:00',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL, -- 'full', 'half'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    email TEXT,
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    status TEXT,
    plan TEXT,
    amount NUMERIC,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Student Fee Summary (View)
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
    -- Sum of payments for the CURRENT academic year of the student
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE student_id = s.id AND academic_year = s.academic_year), 0) as total_paid,
    -- Remaining = (Current Fee + Old Dues) - Payments made THIS year
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- student_fee_summary inherits RLS from students and payments tables.

-- RLS Policies

CREATE POLICY "Users can only access their own students" ON public.students FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own teachers or if they are the teacher" ON public.teachers FOR ALL USING (auth.uid() = user_id OR auth.uid() = auth_user_id);
CREATE POLICY "Users can only access their own teacher payments" ON public.teacher_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own vehicle expenses" ON public.vehicle_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own building expenses" ON public.building_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own attendance records" ON public.attendance FOR ALL USING (auth.uid() = admin_id OR auth.uid() = admin_user_id OR auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));
CREATE POLICY "Users can only access their own staff movements" ON public.staff_movements FOR ALL USING (auth.uid() IN (SELECT admin_id FROM public.attendance WHERE id = attendance_id) OR auth.uid() IN (SELECT admin_user_id FROM public.attendance WHERE id = attendance_id) OR auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));
CREATE POLICY "Users can only access their own school settings" ON public.school_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own leaves" ON public.leaves FOR ALL USING (auth.uid() = admin_id OR auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));
CREATE POLICY "Users can only access their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);
