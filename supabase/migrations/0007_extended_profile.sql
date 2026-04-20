-- -----------------------------------------------------------------------
-- Extended profile fields for richer personalisation
-- -----------------------------------------------------------------------
alter table profiles
  add column age                     int,
  add column session_duration_minutes int,
  add column injuries                text,
  add column specific_focus          text,
  add column activity_level          text;
