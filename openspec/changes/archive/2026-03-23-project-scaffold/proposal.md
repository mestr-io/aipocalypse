## Why

The project has comprehensive documentation (README, AGENTS.md, architecture, models, OAuth docs) but zero source code. Before any features can be built, the project needs a working foundation: package management, TypeScript configuration, database schema, migration tooling, a running Hono server, and the Advent of Code-inspired visual theme. Without this scaffold, no feature work can begin.

## What Changes

- Initialize Bun project with `package.json`, `tsconfig.json`, and `.env.example`
- Install Hono as the web framework dependency
- Create the SQLite database module with connection singleton and migration runner
- Write the initial migration with all 4 tables (users, polls, questions, answers)
- Build the shared HTML layout with Advent of Code terminal aesthetic (dark background, monospace font, green/gold palette)
- Create the CSS stylesheet implementing the AoC visual style, including `[*******     ]` progress bar styling
- Set up the Hono app entry point with route group stubs (`/`, `/poll/:id`, `/auth/*`, `/vote/*`, `/admin/*`)
- Serve static assets and render a styled home page placeholder

## Capabilities

### New Capabilities
- `project-init`: Package.json, tsconfig, .env.example, and Bun project configuration
- `database-foundation`: SQLite connection singleton, migration runner, and initial schema (users, polls, questions, answers)
- `app-skeleton`: Hono entry point with route stubs, static file serving, and middleware placeholders
- `aoc-theme`: Shared HTML layout and CSS stylesheet implementing the Advent of Code terminal aesthetic

### Modified Capabilities
<!-- None — this is a greenfield project with no existing specs -->

## Impact

- **New files**: ~10 source files across `src/`, plus `package.json`, `tsconfig.json`, `.env.example`
- **Dependencies**: `hono` (runtime), `@types/bun` (dev)
- **Database**: Creates `data/` directory and initial SQLite schema with 4 tables
- **Dev workflow**: After this change, `bun run dev` starts a working server and `bun run db:migrate` initializes the database
