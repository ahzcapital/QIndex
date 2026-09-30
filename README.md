# QIndex

QIndex is an independent, community-powered directory for publicly discoverable websites, applications, tools and projects connected to the Quilibrium ecosystem.

## Current system

- Premium public discovery/search interface
- Community project submission form
- Server-side URL reachability + QStorage hostname verification
- PostgreSQL persistence for submissions and approved projects
- Private admin review dashboard at `/admin`
- Approve/reject moderation workflow
- Approved projects automatically appear in the public index
- Email notification for new submissions via Resend
- Data-honest verification: technical checks are separate from ownership and publication

## Production setup

The application now requires a PostgreSQL database and these Vercel environment variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `QINDEX_ADMIN_PASSWORD` | Password for the private `/admin` dashboard |
| `QINDEX_ADMIN_EMAIL` | Email address that receives submission notifications |
| `QINDEX_FROM_EMAIL` | Verified sender address for Resend |
| `RESEND_API_KEY` | Resend API key used for notification emails |
| `NEXT_PUBLIC_SITE_URL` | Public QIndex URL used in email links |

Copy `.env.example` when developing locally.

### Database

Run the SQL in `db/schema.sql` once against the production PostgreSQL database. It creates the `submissions` and `projects` tables and their indexes.

For Vercel, use a PostgreSQL provider such as Neon and add its connection string as `DATABASE_URL` in the project's Production environment.

### Email

QIndex uses Resend's HTTP API directly, so no email SDK is required. Configure:

- `RESEND_API_KEY`
- `QINDEX_ADMIN_EMAIL`
- `QINDEX_FROM_EMAIL`

The sender address/domain must be verified with the email provider.

## Admin workflow

1. A visitor submits a project.
2. QIndex checks the URL and records the verification result.
3. The submission is saved with status `pending`.
4. The admin receives an email notification.
5. The admin opens `/admin` and signs in with `QINDEX_ADMIN_PASSWORD`.
6. The admin reviews the URL, category, description and verification signals.
7. **Approve & publish** creates the public project record.
8. **Reject** keeps it out of the public index.

A QStorage hostname match is only a technical signal. It does not prove ownership, legitimacy or endorsement.

## Verification model

QIndex does not claim to enumerate every Quilibrium or QStorage object. A submitted public URL is checked for reachability and its final hostname is inspected. A URL is technically verified as QStorage only when it resolves to a hostname ending in `.qstorage.quilibrium.com`.

## Local development

1. Install Node.js.
2. Run `npm install`.
3. Create `.env.local` from `.env.example`.
4. Configure `DATABASE_URL` and the admin/email variables.
5. Run `npm run dev`.

## Roadmap

1. Owner claiming and verification.
2. Automated screenshots and periodic health checks.
3. Crawler/discovery workers.
4. QNS integration where supported by public APIs.
5. Search indexing, bookmarks, collections and project analytics.
6. Stronger admin authentication and audit logs.
7. Rate limiting and anti-spam protection for public submissions.
