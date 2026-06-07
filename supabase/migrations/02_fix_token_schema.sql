-- Drop old logic
drop trigger if exists on_staff_movement_alert on public.staff_movements;
drop trigger if exists on_attendance_alert on public.attendance;
drop function if exists public.send_push_notification();

-- 1. Add push_token column to school_settings table (since users table doesn't exist)
alter table public.school_settings add column if not exists push_token text;

-- 2. Create the unified function
create or replace function public.send_push_notification()
returns trigger as $$
declare
  admin_data record;
  teacher_data record;
  payload json;
  request_id bigint;
  notification_title text;
  notification_body text;
  should_send boolean := false;
  t_id uuid;
begin

  -- SCENARIO 1: Boundary Exit
  if TG_TABLE_NAME = 'staff_movements' then
    if NEW.is_outside = true and NEW.return_time is null then
      t_id := NEW.teacher_id;
      select name, user_id into teacher_data from public.teachers where id = t_id;
      notification_title := '🚨 Boundary Alert';
      notification_body := teacher_data.name || ' has moved outside the school premises.';
      should_send := true;
    end if;
  end if;

  -- SCENARIO 2 & 3: Attendance (Late In / Early Out)
  if TG_TABLE_NAME = 'attendance' then
    t_id := NEW.teacher_id;
    select name, user_id into teacher_data from public.teachers where id = t_id;

    -- Late Check-in
    if TG_OP = 'INSERT' and NEW.late_entry = true then
      notification_title := '⏰ Late Check-In';
      notification_body := teacher_data.name || ' has checked in late today.';
      should_send := true;
    end if;

    -- Early Check-out
    if TG_OP = 'UPDATE' and OLD.check_out_time is null and NEW.check_out_time is not null and NEW.early_exit = true then
      notification_title := '🏃 Early Exit Alert';
      notification_body := teacher_data.name || ' has checked out before the shift ended.';
      should_send := true;
    end if;
  end if;

  -- Send Notification Action
  if should_send = true then
    -- GET PUSH TOKEN FROM school_settings INSTEAD OF users
    select push_token into admin_data from public.school_settings where user_id = teacher_data.user_id limit 1;

    if admin_data.push_token is not null then
      payload := json_build_object(
        'to', admin_data.push_token,
        'title', notification_title,
        'body', notification_body,
        'sound', 'default',
        'priority', 'high'
      );
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

-- Apply Triggers
create trigger on_staff_movement_alert
  after insert on public.staff_movements
  for each row
  execute function public.send_push_notification();

create trigger on_attendance_alert
  after insert or update on public.attendance
  for each row
  execute function public.send_push_notification();