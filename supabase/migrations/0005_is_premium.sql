-- Add is_premium flag to profiles
-- Default false — all existing users start as free tier

alter table profiles
  add column if not exists is_premium boolean not null default false;
