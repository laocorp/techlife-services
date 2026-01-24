-- FIX: Allow users to insert their own profile during registration
create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());
