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

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_expenses ENABLE ROW LEVEL SECURITY;

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

-- Subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    USING (auth.uid() = user_id);

-- Teachers
CREATE POLICY "Users can manage their own teachers" ON public.teachers
    USING (auth.uid() = user_id);

-- Teacher Payments
CREATE POLICY "Users can manage their own teacher payments" ON public.teacher_payments
    USING (auth.uid() = user_id);

-- Vehicles
CREATE POLICY "Users can manage their own vehicles" ON public.vehicles
    USING (auth.uid() = user_id);

-- Vehicle Expenses
CREATE POLICY "Users can manage their own vehicle expenses" ON public.vehicle_expenses
    USING (auth.uid() = user_id);

-- Building Expenses
CREATE POLICY "Users can manage their own building expenses" ON public.building_expenses
    USING (auth.uid() = user_id);
