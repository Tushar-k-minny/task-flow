# Task Flow Monorepo

Full-stack task management platform that combines a Next.js frontend with an Express + Prisma backend. The backend exposes a documented REST API for authentication and task workflows, while the frontend provides a modern dashboard built with Tailwind CSS and Radix UI.

## Prerequisites

- Node.js 20 or newer (LTS recommended)
- pnpm `10.18.1` (matches the workspace lockfiles)
- PostgreSQL 14+
- Optional: curl and jq for quick API testing

## Quick Start

1. Install dependencies for both apps in one shot:
   ```bash
   pnpm install
   ```
2. Configure environment variables (see below) for `backend/.env` and `frontend/.env`.
3. Apply database migrations:
   ```bash
   pnpm --filter task-management-backend prisma:migrate
   ```
4. Start everything from the repo root:
   ```bash
   pnpm dev
   ```
   - `pnpm dev:backend` runs only the API server.
   - `pnpm dev:frontend` runs only the Next.js app.

## Environment Variables

### `backend/.env`

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_flow"
PORT=5000
JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
FRONTEND_URL="http://localhost:3000"
```

- `DATABASE_URL` must point to a PostgreSQL database.
- JWT secrets should be long, random strings in production.
- `FRONTEND_URL` is used by CORS; adjust if deploying elsewhere.

### `frontend/.env`

```
API_URL="http://localhost:5000/api"
```

- The Next.js app expects the backend API at `/api`.
- You can add other public environment variables as needed using the `NEXT_PUBLIC_` prefix.

## Available Scripts

All commands run from the repository root:

- `pnpm dev` - start backend and frontend in parallel.
- `pnpm dev:backend` / `pnpm dev:frontend` - run a single target.
- `pnpm build` - build both apps (Next.js build + TypeScript compile).
- `pnpm --filter task-management-backend prisma:studio` - open Prisma Studio to inspect data.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Radix UI, React Hook Form, Zod, Axios.
- **Backend:** Node.js, Express 5, Prisma ORM, PostgreSQL, Zod validation, JWT authentication.
- **Tooling:** TypeScript, pnpm workspaces, Biome formatter/linter, Swagger UI (`/api-docs`), Nodemon for local development.

## Folder Structure

```
task-/flow
  backend/
    prisma/          # Prisma schema and migrations
    src/
      controllers/   # Express controllers
      routes/        # Route definitions (auth, tasks)
      services/      # Business logic
      middlewares/   # Error handling, auth, validation
      docs/          # Swagger/OpenAPI configuration
      utils/         # Helpers (JWT, password hashing)
  frontend/
    public/          # Static assets
    src/             # Next.js pages, components, and features
  pnpm-workspace.yaml
  package.json
```

## API Reference (Quick Tests)

The backend defaults to `http://localhost:5000`. Use the cURL snippets below for smoke testing. Replace values as needed.

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "secret123",
    "name": "Jane Doe"
  }'
```

### Log In and Capture Tokens
```bash
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "secret123"
  }')
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.data.refreshToken')
echo "$ACCESS_TOKEN"
```

### Create a Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Prepare project brief",
    "description": "Capture goals and milestones",
    "status": "IN_PROGRESS"
  }'
```

### List Tasks with Filters
```bash
curl "http://localhost:5000/api/tasks?status=PENDING&limit=5" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Refresh the Access Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

For interactive API docs, visit `http://localhost:5000/api-docs` once the backend is running.
