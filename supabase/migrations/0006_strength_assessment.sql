-- -----------------------------------------------------------------------
-- Add strength assessment result to profiles
-- Photo is never stored — only the AI-generated assessment JSON is saved
-- -----------------------------------------------------------------------
alter table profiles
  add column strength_assessment jsonb;
