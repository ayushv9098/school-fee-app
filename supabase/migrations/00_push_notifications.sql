-- Enable the pg_net extension if it's not already enabled (requires Supabase project to have it enabled)
create extension if not exists pg_net;

-- 1. Add push_token column to users table if it doesn't exist
alter table users add column if not exists push_token text;

-- 2. Create the function that will make the HTTP request to Expo
create or replace function public.send_push_notification()
returns trigger as $$
declare
  admin_data record;
  teacher_data record;
  payload json;
  request_id bigint;
begin
  -- Only trigger for geofence exits (is_outside = true and return_time is null)
  if NEW.is_outside = true and NEW.return_time is null then
    
    -- Get the teacher's name and admin_id
    select name, user_id into teacher_data from public.teachers where id = NEW.teacher_id;
    
    -- Get the admin's push token
    select push_token into admin_data from public.users where id = teacher_data.user_id;

    -- If the admin has a push token, send the notification via Expo
    if admin_data.push_token is not null then
      
      payload := json_build_object(
        'to', admin_data.push_token,
        'title', '🚨 Staff Boundary Alert',
        'body', teacher_data.name || ' has moved outside the school premises.',
        'sound', 'default',
        'priority', 'high',
        'data', json_build_object('movement_id', NEW.id, 'teacher_id', NEW.teacher_id)
      );

      -- Use pg_net to send an asynchronous POST request
      select net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := payload::jsonb
      ) into request_id;
      
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

-- 3. Create the trigger on the staff_movements table
drop trigger if exists on_staff_movement_exit on public.staff_movements;
create trigger on_staff_movement_exit
  after insert on public.staff_movements
  for each row
  execute function public.send_push_notification();
