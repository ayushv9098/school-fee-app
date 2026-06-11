-- Fix for Data Isolation (RLS Policies)
-- Run this in your Supabase SQL Editor to prevent users from seeing each other's data.

-- 1. Students
CREATE POLICY "Users can only access their own students"
ON public.students
FOR ALL USING (auth.uid() = user_id);

-- 2. Payments
CREATE POLICY "Users can only access their own payments"
ON public.payments
FOR ALL USING (auth.uid() = user_id);

-- 3. Expenses
CREATE POLICY "Users can only access their own expenses"
ON public.expenses
FOR ALL USING (auth.uid() = user_id);

-- 4. Teachers
CREATE POLICY "Users can only access their own teachers or if they are the teacher"
ON public.teachers
FOR ALL USING (auth.uid() = user_id OR auth.uid() = auth_user_id);

-- 5. Teacher Payments
CREATE POLICY "Users can only access their own teacher payments"
ON public.teacher_payments
FOR ALL USING (auth.uid() = user_id);

-- 6. Vehicles
CREATE POLICY "Users can only access their own vehicles"
ON public.vehicles
FOR ALL USING (auth.uid() = user_id);

-- 7. Vehicle Expenses
CREATE POLICY "Users can only access their own vehicle expenses"
ON public.vehicle_expenses
FOR ALL USING (auth.uid() = user_id);

-- 8. Building & Other Expenses
CREATE POLICY "Users can only access their own building expenses"
ON public.building_expenses
FOR ALL USING (auth.uid() = user_id);

-- 9. Attendance
CREATE POLICY "Users can only access their own attendance records"
ON public.attendance
FOR ALL USING (auth.uid() = admin_id OR auth.uid() = admin_user_id OR auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- 10. Staff Movements
CREATE POLICY "Users can only access their own staff movements"
ON public.staff_movements
FOR ALL USING (
  auth.uid() IN (SELECT admin_id FROM public.attendance WHERE id = attendance_id) OR
  auth.uid() IN (SELECT admin_user_id FROM public.attendance WHERE id = attendance_id) OR
  auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id)
);

-- 11. School Settings
CREATE POLICY "Users can only access their own school settings"
ON public.school_settings
FOR ALL USING (auth.uid() = user_id);

-- 12. Leaves
CREATE POLICY "Users can only access their own leaves"
ON public.leaves
FOR ALL USING (auth.uid() = admin_id OR auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE id = teacher_id));

-- 13. Notifications
CREATE POLICY "Users can only access their own notifications"
ON public.notifications
FOR ALL USING (auth.uid() = user_id);

-- 14. Subscriptions
CREATE POLICY "Users can only access their own subscriptions"
ON public.subscriptions
FOR ALL USING (auth.uid() = user_id);

-- 15. Fix View to use Security Invoker (so it respects the RLS of underlying tables)
ALTER VIEW public.student_fee_summary SET (security_invoker = true);
