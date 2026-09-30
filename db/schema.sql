create extension if not exists pgcrypto;

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  url text not null,
  normalized_url text not null unique,
  category text not null default 'Other',
  description text,
  github_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verification_status text not null default 'unverified',
  final_url text,
  http_status integer,
  response_time_ms integer,
  hosting text,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid unique references submissions(id) on delete set null,
  slug text not null unique,
  project_name text not null,
  url text not null unique,
  category text not null default 'Other',
  description text,
  github_url text,
  verification_status text not null default 'unverified',
  final_url text,
  http_status integer,
  response_time_ms integer,
  hosting text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_status_idx on submissions(status);
create index if not exists projects_category_idx on projects(category);
create index if not exists projects_created_idx on projects(created_at desc);
