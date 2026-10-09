-- Email reminders for submission tracker deadlines.
-- Run this in the Supabase SQL editor, after 008.
--
-- The netlify/functions/deadline-reminders.js scheduled function reads these
-- columns with the service role key (which bypasses RLS) once a day.

begin;

-- Opt-out switch, shown in Settings. On by default: tracking a deadline is
-- itself the signal that the student wants to hit it.
alter table public.users
  add column if not exists email_reminders boolean not null default true;

-- Which reminder last went out for this row: 7 = "due in a week", 1 = "due
-- tomorrow". NULL means none yet. Stops the daily job from re-sending.
alter table public.venue_submissions
  add column if not exists reminded_stage smallint
  check (reminded_stage in (1, 7));

-- Moving the deadline should re-arm reminders for the new date.
create or replace function public.venue_submissions_rearm_reminder()
returns trigger
language plpgsql
as $$
begin
  if new.deadline is distinct from old.deadline then
    new.reminded_stage = null;
  end if;
  return new;
end
$$;

drop trigger if exists venue_submissions_rearm_reminder on public.venue_submissions;
create trigger venue_submissions_rearm_reminder
  before update on public.venue_submissions
  for each row execute function public.venue_submissions_rearm_reminder();

commit;
