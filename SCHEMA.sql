-- SQL Schema for School Fee App

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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Expenses Table (Legacy - keeping for compatibility if needed)
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

-- 7. Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    monthly_salary NUMERIC NOT NULL,
    email TEXT,
    auth_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Teacher Payments Table
CREATE TABLE IF NOT EXISTS public.teacher_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    note TEXT,
    paid_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Magic, Van, Auto, etc.
    license_plate TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Vehicle Expenses Table
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

-- 11. Building & Other Expenses Table
CREATE TABLE IF NOT EXISTS public.building_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    category TEXT NOT NULL, -- Rent, Electricity, Maintenance, Other
    amount NUMERIC NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Attendance Table
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
    last_lat NUMERIC, -- Live tracking
    last_lng NUMERIC, -- Live tracking
    selfie_url TEXT,
    status TEXT DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'on_leave'
    late_entry BOOLEAN DEFAULT FALSE,
    early_exit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(teacher_id, date)
);

-- 12b. Staff Movements Table
CREATE TABLE IF NOT EXISTS public.staff_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID REFERENCES public.attendance(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    exit_time TIMESTAMPTZ DEFAULT now(),
    return_time TIMESTAMPTZ,
    exit_lat NUMERIC,
    exit_lng NUMERIC,
    return_lat NUMERIC,
    return_lng NUMERIC,
    is_outside BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. School Settings Table
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    lat NUMERIC,
    lng NUMERIC,
    radius NUMERIC DEFAULT 100,
    school_start_time TIME DEFAULT '09:30:00',
    school_end_time TIME DEFAULT '15:40:00',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Leaves Table
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

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

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

-- RLS Policies

-- Students
CREATE POLICY "Users can manage their own students" ON public.students
    USING (auth.uid() = user_id);

-- Payments
CREATE POLICY "Users can manage their own payments" ON public.payments
    USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Users can manage their own expenses" ON public.expenses
    USING (auth.uid() = user_id);

-- School Settings
CREATE POLICY "Users can manage their own school settings" ON public.school_settings
    USING (auth.uid() = user_id);

-- Teachers
CREATE POLICY "Users can manage their own teachers" ON public.teachers
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view their own record" ON public.teachers
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Teacher Payments
CREATE POLICY "Users can manage their own teacher payments" ON public.teacher_payments
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view their own payments" ON public.teacher_payments
    FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- Vehicles
CREATE POLICY "Users can manage their own vehicles" ON public.vehicles
    USING (auth.uid() = user_id);

-- Vehicle Expenses
CREATE POLICY "Users can manage their own vehicle expenses" ON public.vehicle_expenses
    USING (auth.uid() = user_id);

-- Building Expenses
CREATE POLICY "Users can manage their own building expenses" ON public.building_expenses
    USING (auth.uid() = user_id);

-- Attendance
CREATE POLICY "Admins can manage attendance records" ON public.attendance
    FOR ALL USING (auth.uid() = admin_id);

CREATE POLICY "Teachers can insert their own attendance" ON public.attendance
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can update their own attendance" ON public.attendance
    FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

CREATE POLICY "Teachers can view their own attendance" ON public.attendance
    FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- Staff Movements
CREATE POLICY "Admins can view staff movements" ON public.staff_movements
    FOR SELECT USING (auth.uid() IN (SELECT admin_id FROM public.attendance WHERE id = attendance_id));

CREATE POLICY "Teachers can manage their own movements" ON public.staff_movements
    FOR ALL USING (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- Leaves
CREATE POLICY "Users can manage their own leaves" ON public.leaves
    USING (auth.uid() = admin_id);

CREATE POLICY "Teachers can manage their own leave requests" ON public.leaves
    FOR ALL USING (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- Notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can notify their admins" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE user_id = notifications.user_id));
