-- Allow users to delete their own workouts (logged_sets cascade automatically)
create policy "Users can delete their own workouts"
  on workouts for delete
  using (auth.uid() = user_id);

-- Allow users to delete their own logged sets directly
create policy "Users can delete their own sets"
  on logged_sets for delete
  using (auth.uid() = user_id);
