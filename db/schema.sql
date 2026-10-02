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
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submissions_status_idx on submissions(status);
create index if not exists projects_category_idx on projects(category);
create index if not exists projects_created_idx on projects(created_at desc);
create index if not exists projects_sort_order_idx on projects(sort_order asc);

create table if not exists visitor_visits (
  id bigserial primary key,
  visitor_id text not null,
  visited_at timestamptz not null default now()
);

create index if not exists visitor_visits_visited_at_idx on visitor_visits(visited_at);
create index if not exists visitor_visits_visitor_time_idx on visitor_visits(visitor_id, visited_at desc);


create table if not exists qindex_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists qindex_user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references qindex_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists qindex_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references qindex_users(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qindex_comments_project_status_idx on qindex_comments(project_id, status, created_at desc);
create index if not exists qindex_comments_status_idx on qindex_comments(status, created_at desc);
create index if not exists qindex_comments_user_idx on qindex_comments(user_id, created_at desc);
create index if not exists qindex_sessions_user_idx on qindex_user_sessions(user_id);
create index if not exists qindex_sessions_expires_idx on qindex_user_sessions(expires_at);
