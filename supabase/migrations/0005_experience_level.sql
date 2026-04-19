alter table profiles
  add column experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced'));
