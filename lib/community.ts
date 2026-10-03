import { pool } from "@/lib/db";

export async function ensureCommunitySchema() {
  await pool.query(`
    create table if not exists qindex_users (
      id uuid primary key default gen_random_uuid(),
      username text not null unique,
      email text,
      password_hash text not null,
      backup_key_hash text,
      created_at timestamptz not null default now()
    );

    alter table qindex_users alter column email drop not null;
    alter table qindex_users add column if not exists backup_key_hash text;

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

    create index if not exists qindex_comments_project_status_idx
      on qindex_comments(project_id, status, created_at desc);
    create index if not exists qindex_comments_status_idx
      on qindex_comments(status, created_at desc);
    create index if not exists qindex_comments_user_idx
      on qindex_comments(user_id, created_at desc);
    create index if not exists qindex_sessions_user_idx
      on qindex_user_sessions(user_id);
    create index if not exists qindex_sessions_expires_idx
      on qindex_user_sessions(expires_at);
  `);
}