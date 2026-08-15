# AbleSpace API

NestJS backend for the AbleSpace assessment.

## Features

- Guest login endpoint with cookie-based sessions
- Task CRUD endpoints
- DTO validation via `class-validator`
- Prisma-backed persistence
- Guarded routes using session tokens

## Structure

```text
src/
  auth/    # Guest login, current user, logout
  tasks/   # Task controllers, services, DTOs
  prisma/  # Prisma integration
  common/  # Guards, decorators, shared interfaces
```

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run start:dev
```

## Environment Variables

```bash
DATABASE_URL=your-database-connection-string
FRONTEND_ORIGIN=http://localhost:3000
PORT=3001
```

Production:

```bash
FRONTEND_ORIGIN=https://your-vercel-app.vercel.app
```

## Validation

- `main.ts` enables global validation with whitelist and transform.
- Task DTOs define allowed request payloads.

## API Endpoints

- `POST /api/auth/guest`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
