-- Drop the old trigger so we can cleanly replace the logic
drop trigger if exists on_staff_movement_exit on public.staff_movements;
drop function if exists public.send_push_notification();

-- Create the updated, unified function that handles all 3 scenarios:
-- 1. Staff Movement (Exit Boundary)
-- 2. Late Check-in
-- 3. Early Check-out
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

  -------------------------------------------------------------
  -- SCENARIO 1: Boundary Exit (staff_movements table)
  -------------------------------------------------------------
  if TG_TABLE_NAME = 'staff_movements' then
    if NEW.is_outside = true and NEW.return_time is null then
      t_id := NEW.teacher_id;
      select name, user_id into teacher_data from public.teachers where id = t_id;
      
      notification_title := '🚨 Boundary Alert';
      notification_body := teacher_data.name || ' has moved outside the school premises.';
      should_send := true;
    end if;
  end if;

  -------------------------------------------------------------
  -- SCENARIO 2 & 3: Attendance (attendance table)
  -------------------------------------------------------------
  if TG_TABLE_NAME = 'attendance' then
    t_id := NEW.teacher_id;
    select name, user_id into teacher_data from public.teachers where id = t_id;

    -- Scenario 2: Late Check-in (Insert)
    if TG_OP = 'INSERT' and NEW.late_entry = true then
      notification_title := '⏰ Late Check-In';
      notification_body := teacher_data.name || ' has checked in late today.';
      should_send := true;
    end if;

    -- Scenario 3: Early Check-out (Update)
    if TG_OP = 'UPDATE' and OLD.check_out_time is null and NEW.check_out_time is not null and NEW.early_exit = true then
      notification_title := '🏃 Early Exit Alert';
      notification_body := teacher_data.name || ' has checked out before the shift ended.';
      should_send := true;
    end if;
  end if;

  -------------------------------------------------------------
  -- SEND NOTIFICATION
  -------------------------------------------------------------
  if should_send = true then
    -- Get the admin's push token
    select push_token into admin_data from public.users where id = teacher_data.user_id;

    if admin_data.push_token is not null then
      payload := json_build_object(
        'to', admin_data.push_token,
        'title', notification_title,
        'body', notification_body,
        'sound', 'default',
        'priority', 'high'
      );

      -- Fire request to Expo
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

-- Re-create Triggers for all tables

-- Trigger 1: Staff Movements (Exits)
create trigger on_staff_movement_alert
  after insert on public.staff_movements
  for each row
  execute function public.send_push_notification();

-- Trigger 2: Attendance (Late In / Early Out)
drop trigger if exists on_attendance_alert on public.attendance;
create trigger on_attendance_alert
  after insert or update on public.attendance
  for each row
  execute function public.send_push_notification();
