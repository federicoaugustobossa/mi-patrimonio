-- =====================================================================
-- Mi Patrimonio · esquema de base de datos para Supabase
-- Pegá todo este archivo en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin romper nada.
-- =====================================================================

-- Fecha de última modificación, puesta siempre por el servidor
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Configuración (categorías, reglas, presupuestos) ----------
create table if not exists public.config (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- Cuentas ----------
-- Las cuentas no se borran: se archivan.
create table if not exists public.cuentas (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists cuentas_user_idx on public.cuentas (user_id);

-- ---------- Movimientos ----------
-- Los importes viven dentro de data en centavos enteros (nunca decimales).
-- Los movimientos no se borran: se anulan (estado = 'anulado').
create table if not exists public.movimientos (
  id         text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  fecha      date not null,
  tipo       text not null check (tipo in ('gasto','ingreso','transferencia','reembolso','ajuste')),
  estado     text not null default 'activo' check (estado in ('activo','anulado')),
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists movimientos_user_upd_idx   on public.movimientos (user_id, updated_at);
create index if not exists movimientos_user_fecha_idx on public.movimientos (user_id, fecha);

-- Auditoría: cada vez que se modifica un movimiento se guarda la versión anterior
create table if not exists public.movimientos_historial (
  id         bigint generated always as identity primary key,
  mov_id     text not null,
  user_id    uuid not null references auth.users on delete cascade,
  data       jsonb not null,
  changed_at timestamptz not null default now()
);
create index if not exists movhist_mov_idx on public.movimientos_historial (mov_id);

create or replace function public.log_movimiento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.data is distinct from new.data or old.estado is distinct from new.estado then
    insert into public.movimientos_historial (mov_id, user_id, data) values (old.id, old.user_id, old.data);
  end if;
  return new;
end $$;

-- ---------- Cotizaciones del dólar ----------
-- Automáticas (dólar oficial venta Banco Nación), compartidas, las escribe solo el servidor
create table if not exists public.cotizaciones_bna (
  fecha    date primary key,
  compra   numeric(14,2),
  venta    numeric(14,2) not null check (venta > 0),
  fuente   text not null,
  obtenida timestamptz not null default now()
);
-- Manuales, por usuario (pisan a la automática del mismo día)
create table if not exists public.cotizaciones (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  fecha      date not null,
  venta      numeric(14,2) not null check (venta > 0),
  fuente     text not null default 'manual',
  updated_at timestamptz not null default now(),
  primary key (user_id, fecha)
);

-- ---------- Triggers ----------
drop trigger if exists t_upd on public.config;       create trigger t_upd before update on public.config       for each row execute function public.set_updated_at();
drop trigger if exists t_upd on public.cuentas;      create trigger t_upd before update on public.cuentas      for each row execute function public.set_updated_at();
drop trigger if exists t_upd on public.movimientos;  create trigger t_upd before update on public.movimientos  for each row execute function public.set_updated_at();
drop trigger if exists t_upd on public.cotizaciones; create trigger t_upd before update on public.cotizaciones for each row execute function public.set_updated_at();
drop trigger if exists t_log on public.movimientos;  create trigger t_log before update on public.movimientos  for each row execute function public.log_movimiento();

-- ---------- Seguridad: cada usuario ve y toca solo lo suyo ----------
alter table public.config                enable row level security;
alter table public.cuentas               enable row level security;
alter table public.movimientos           enable row level security;
alter table public.movimientos_historial enable row level security;
alter table public.cotizaciones          enable row level security;
alter table public.cotizaciones_bna      enable row level security;

do $$
declare t text;
begin
  -- leer, crear y modificar lo propio (sin borrar)
  foreach t in array array['config','cuentas','movimientos'] loop
    execute format('drop policy if exists "propio_select" on public.%I', t);
    execute format('drop policy if exists "propio_insert" on public.%I', t);
    execute format('drop policy if exists "propio_update" on public.%I', t);
    execute format('create policy "propio_select" on public.%I for select to authenticated using (user_id = auth.uid())', t);
    execute format('create policy "propio_insert" on public.%I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "propio_update" on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

drop policy if exists "propio_todo" on public.cotizaciones;
create policy "propio_todo" on public.cotizaciones for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "propio_select" on public.movimientos_historial;
create policy "propio_select" on public.movimientos_historial for select to authenticated using (user_id = auth.uid());

drop policy if exists "leer_bna" on public.cotizaciones_bna;
create policy "leer_bna" on public.cotizaciones_bna for select to authenticated using (true);

-- Permisos explícitos para la API (sin borrar movimientos ni cuentas)
revoke all on public.config, public.cuentas, public.movimientos, public.movimientos_historial, public.cotizaciones, public.cotizaciones_bna from anon;
grant select, insert, update          on public.config, public.cuentas, public.movimientos to authenticated;
grant select, insert, update, delete  on public.cotizaciones to authenticated;
grant select                          on public.movimientos_historial, public.cotizaciones_bna to authenticated;
grant all                             on public.config, public.cuentas, public.movimientos, public.movimientos_historial, public.cotizaciones, public.cotizaciones_bna to service_role;
