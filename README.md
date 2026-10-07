# Modett Atelier Academy

Monorepo (pnpm workspaces + Turborepo) for the Modett Atelier Academy platform.

## Requirements

- Node 22 (see `.nvmrc`)
- pnpm 9
- Docker (for Postgres 16 and Redis 7)

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres and Redis (creates the modett and modett_test databases)
docker compose up -d

# 3. Create your local env file
cp .env.example .env

# 4. Run the API in watch mode
pnpm --filter @modett/api dev

# 5. Run the tests
pnpm test
```

## Useful scripts

- `pnpm dev` – run all app dev tasks through Turborepo
- `pnpm build` – build every workspace
- `pnpm lint` – lint every workspace
- `pnpm typecheck` – type-check every workspace
- `pnpm test` – run every workspace test suite
- `pnpm format` – format the repo with Prettier
