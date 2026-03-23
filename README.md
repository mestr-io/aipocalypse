# AIPocalypse

A community poll to predict where the arrival of coding agents will drive the profession to.

As agentic coding tools like Claude Code, Codex, and Gemini reshape how software gets built, AIPocalypse tracks what developers *actually think* will happen — to jobs, to reliability, to the craft itself.

Vote on time-bound predictions. See where the community stands. Come back when the deadline hits and find out who called it.

## How it works

- Polls go live with a **due date** — a point in the future when the prediction can be verified.
- Each poll has a single question with multiple-choice answers. You pick one.
- **Anyone can browse** — all active polls are listed on the home page. No login required to see questions and aggregate results.
- **Sign in with GitHub to vote** — voting requires authentication. One vote per user per poll.
- Each poll has its own page where logged-in users can see **who voted on each answer** (up to 10 users shown) and a **responses-over-time timeline** rendered as AoC-style text graphics.
- When a poll closes, outcomes are evaluated and a **gamified ranking** tracks who has the best prediction record over time.

## Sample polls

> **What will be the labour market impact at end of year 2026?**
> - Companies are hiring more than in 2025
> - No significant changes
> - Accumulated layoffs hit the 10% mark
> - Accumulated layoffs hit the 25% mark

> **Has the reliability of your company's systems been altered?**
> - All services are more stable than before
> - No significant changes
> - We suffer more outages and bugs than before
> - Vibe-coded services are destabilizing our company

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh/) |
| Framework | [Hono](https://hono.dev) |
| Rendering | Server-side (plain HTML templates, no React) |
| Auth | GitHub OAuth |
| Database | SQLite via [`bun:sqlite`](https://bun.sh/docs/api/sqlite) (local, in-repo) |
| Testing | [Bun test runner](https://bun.sh/docs/cli/test) |

## Admin panel

The `/admin` route exposes a management interface protected by a hardcoded password (set via the `ADMIN_PASSWORD` environment variable). From the admin panel you can:

- **Create and remove polls** — add new questions with answer options and due dates, or delete existing ones.
- **Edit poll metadata** — update question text, answers, due dates, and poll status (open/closed).
- **Ban users** — block GitHub accounts from voting.

Authentication is a simple password form (no OAuth). This is intentional for v1 — a single operator manages the polls.

## Design

The visual style is an **homage to [Advent of Code](https://adventofcode.com/)** — monospace font, dark background, minimal chrome, green-on-black terminal aesthetic. Same spirit: a small, focused page for a community of developers.

## Getting started

```bash
# install dependencies
bun install

# set up environment variables
cp .env.example .env
# fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and ADMIN_PASSWORD

# run database migrations
bun run db:migrate

# start the dev server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Running tests

```bash
bun test
```

### GitHub OAuth setup

1. Go to **GitHub > Settings > Developer settings > OAuth Apps > New OAuth App**.
2. Set the callback URL to `http://localhost:3000/auth/callback`.
3. Copy the Client ID and Client Secret into your `.env` file.

## Project structure

```
src/
  index.ts          # Hono app entry point and route definitions
  auth/             # GitHub OAuth flow
  admin/            # Admin panel routes and middleware
  db/               # SQLite schema, migrations, and queries
  views/            # HTML templates (server-side rendered)
  public/           # Static assets (CSS, fonts)
```

## License

MIT
