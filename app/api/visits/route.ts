import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db";

const COOKIE_NAME = "qindex_vid";
const WINDOW_MINUTES = 30;

async function ensureTable() {
  await pool.query(`
    create table if not exists visitor_visits (
      id bigserial primary key,
      visitor_id text not null,
      visited_at timestamptz not null default now()
    );
    create index if not exists visitor_visits_visited_at_idx on visitor_visits(visited_at);
    create index if not exists visitor_visits_visitor_time_idx on visitor_visits(visitor_id, visited_at desc);
  `);
}

function todayStartUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET() {
  try {
    await ensureTable();
    const result = await pool.query(
      "select count(*)::int as count from visitor_visits where visited_at >= $1",
      [todayStartUtc()]
    );
    return NextResponse.json({ count: result.rows[0]?.count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 503 });
  }
}

export async function POST() {
  try {
    await ensureTable();

    const cookieStore = await cookies();
    let visitorId = cookieStore.get(COOKIE_NAME)?.value;
    let isNewCookie = false;

    if (!visitorId || visitorId.length > 80) {
      visitorId = crypto.randomUUID();
      isNewCookie = true;
    }

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [visitorId]);

      const recent = await client.query(
        "select visited_at from visitor_visits where visitor_id = $1 order by visited_at desc limit 1",
        [visitorId]
      );

      const lastVisit = recent.rows[0]?.visited_at
        ? new Date(recent.rows[0].visited_at)
        : null;

      if (!lastVisit || Date.now() - lastVisit.getTime() >= WINDOW_MINUTES * 60 * 1000) {
        await client.query(
          "insert into visitor_visits (visitor_id, visited_at) values ($1, now())",
          [visitorId]
        );
      }

      const result = await client.query(
        "select count(*)::int as count from visitor_visits where visited_at >= $1",
        [todayStartUtc()]
      );

      await client.query("commit");

      const response = NextResponse.json({
        count: result.rows[0]?.count ?? 0,
        live: true,
      });

      if (isNewCookie) {
        response.cookies.set(COOKIE_NAME, visitorId, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });
      }

      return response;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return NextResponse.json({ count: 0, live: false }, { status: 503 });
  }
}
