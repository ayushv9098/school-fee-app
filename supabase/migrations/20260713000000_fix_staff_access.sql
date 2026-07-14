-- 1. Update existing students belonging to the staff user to the admin user
UPDATE public.students 
SET user_id = '54d3f57f-6385-4281-895c-4e0004cf7fbf' 
WHERE user_id = '3da1aefc-58c0-4506-a2e7-67e390417948';

-- 2. Drop old policy on students
DROP POLICY IF EXISTS "Users can only access their own students" ON public.students;

-- 3. Create new RLS policy on students allowing owner and their attendance_staff
CREATE POLICY "Users can only access their own students or if they are staff" 
ON public.students 
FOR ALL 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE user_id = students.user_id)
);

-- 4. Drop old policy on vehicles
DROP POLICY IF EXISTS "Users can only access their own vehicles" ON public.vehicles;

-- 5. Create new RLS policy on vehicles allowing owner and their attendance_staff
CREATE POLICY "Users can only access their own vehicles or if they are staff" 
ON public.vehicles 
FOR ALL 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE user_id = vehicles.user_id)
);

-- 6. Drop old policy on school settings
DROP POLICY IF EXISTS "Users can only access their own school settings" ON public.school_settings;

-- 7. Create new RLS policy on school settings allowing owner and their attendance_staff
CREATE POLICY "Users can only access their own school settings or if they are staff" 
ON public.school_settings 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (SELECT auth_user_id FROM public.teachers WHERE user_id = school_settings.user_id)
);
