create table if not exists public.household_budgets (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  budget_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.household_budgets enable row level security;

drop policy if exists "Household owner can read budget" on public.household_budgets;
create policy "Household owner can read budget"
  on public.household_budgets
  for select
  using (auth.uid() = owner_id);

drop policy if exists "Household owner can insert budget" on public.household_budgets;
create policy "Household owner can insert budget"
  on public.household_budgets
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Household owner can update budget" on public.household_budgets;
create policy "Household owner can update budget"
  on public.household_budgets
  for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Household owner can delete budget" on public.household_budgets;
create policy "Household owner can delete budget"
  on public.household_budgets
  for delete
  using (auth.uid() = owner_id);