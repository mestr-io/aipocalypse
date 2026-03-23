## ADDED Requirements

### Requirement: Package.json with Bun scripts
The project SHALL have a `package.json` with `name`, `type: "module"`, and scripts for `dev`, `db:migrate`, and `test`. Dependencies SHALL include `hono`. Dev dependencies SHALL include `@types/bun`.

#### Scenario: Install dependencies
- **WHEN** a developer runs `bun install`
- **THEN** all dependencies are installed and a `bun.lock` file is generated

#### Scenario: Dev script starts the server
- **WHEN** a developer runs `bun run dev`
- **THEN** the Hono server starts with hot-reload enabled on port 3000

#### Scenario: Test script runs Bun test runner
- **WHEN** a developer runs `bun test`
- **THEN** the Bun built-in test runner executes all `*.test.ts` files

### Requirement: TypeScript configuration
The project SHALL have a `tsconfig.json` that enables strict mode and targets the Bun runtime. It SHALL NOT require a separate `tsc` build step.

#### Scenario: TypeScript strict mode enforced
- **WHEN** code contains implicit `any` types or unchecked nulls
- **THEN** the IDE and type checker report errors

### Requirement: Environment variable template
The project SHALL have a `.env.example` file listing all required and optional environment variables with placeholder values.

#### Scenario: Developer sets up environment
- **WHEN** a developer copies `.env.example` to `.env`
- **THEN** the file contains `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_PASSWORD`, and `DATABASE_PATH` with descriptive placeholder values
