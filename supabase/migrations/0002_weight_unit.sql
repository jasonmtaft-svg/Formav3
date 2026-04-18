alter table profiles
  add column if not exists weight_unit text not null default 'kg'
    check (weight_unit in ('kg', 'lbs'));
