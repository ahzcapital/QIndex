# QIndex

QIndex is an independent, community-powered directory for publicly discoverable websites, applications, tools and projects connected to the Quilibrium ecosystem.

## v0.1

- Premium discovery/search interface
- Category and verification filters
- Project profile route
- Community submission flow
- Server-side URL reachability verification
- Basic QStorage hostname verification
- Responsive Next.js App Router foundation

## Verification model

QIndex does not claim to enumerate every Quilibrium or QStorage object. A submitted public URL is checked for reachability and its final hostname is inspected. A URL is technically verified as QStorage only when it resolves to a hostname ending in `.qstorage.quilibrium.com`.

Technical verification is separate from ownership and publication. The next stage should add persistent submissions, moderation, authentication, owner claims and a real project database.

## Local development

1. Install Node.js.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local Next.js URL.

## Deployment

The project is designed for Vercel and uses the Next.js App Router. The v0.1 demo does not require environment variables.

## Roadmap

1. PostgreSQL persistence for projects and submissions.
2. Authentication and project ownership/claim verification.
3. Admin moderation queue.
4. Automated screenshots and periodic health checks.
5. Crawler/discovery workers.
6. QNS integration where supported by public APIs.
7. Search indexing, bookmarks, collections and project analytics.
