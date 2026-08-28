-- Ejecutar en Supabase SQL Editor.
create extension if not exists "uuid-ossp";

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  sku text unique not null,
  name text not null,
  slug text unique not null,
  description text not null default '',
  short_description text not null default '',
  category text not null default 'packs',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock integer not null default 0 check (stock >= 0),
  images jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  is_new boolean not null default false,
  on_sale boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  city text not null,
  notes text,
  items jsonb not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  shipping numeric(10,2) not null default 0 check (shipping >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_provider text not null default 'demo',
  payment_reference text,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  business text,
  comment text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;

create policy "public can read active products" on public.products for select using (active = true);
create policy "public can read approved reviews" on public.reviews for select using (approved = true);
create policy "public can submit reviews" on public.reviews for insert with check (approved = false);

-- Los pedidos deben crearse desde una Edge Function segura para no exponer permisos.
