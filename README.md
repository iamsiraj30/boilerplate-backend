# tprice-backend

A production-ready NestJS service designed for handling transaction pricing. Built with NestJS 11, Prisma ORM, and Pino logger.

---

## Technical Stack & Features

- **Core Framework**: NestJS 11
- **Database ORM**: Prisma ORM 6 (PostgreSQL target)
- **Logger**: Pino (`nestjs-pino`) for fast, structured JSON logging
- **Configuration**: Strictly-typed configurations using Zod validation
- **API Documentation**: Swagger/OpenAPI (`/api/docs`)
- **Security**:
  - Helmet headers enabled
  - CORS whitelist support
  - Rate limiting via `@nestjs/throttler` (100 req / minute global window)
- **Quality & Workflows**:
  - Strict TypeScript configuration
  - Git pre-commit hooks (Husky + lint-staged) enforcing Prettier & ESLint formatting

---

## Setup & Local Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (or Docker for running a containerized instance)

### 1. Project Setup

```bash
# Clone the repository and install dependencies
$ npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
$ cp .env.example .env
```

| Env Variable      | Description                          | Default       | Example                                                                 |
| :---------------- | :----------------------------------- | :------------ | :---------------------------------------------------------------------- |
| `PORT`            | Port the API server listens on       | `3000`        | `3000`                                                                  |
| `NODE_ENV`        | Environment context                  | `development` | `development`, `production`, `test`                                     |
| `DATABASE_URL`    | PostgreSQL connection URL            | N/A           | `postgresql://postgres:postgres@localhost:5432/tprice_db?schema=public` |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | N/A           | `http://localhost:3000,http://localhost:5173`                           |

### 3. Database Migration

Apply the database migrations to prepare the database schema:

```bash
$ npx prisma migrate dev
```

---

## Scripts & Operations

### Compile and Run

```bash
# Development (with watch mode)
$ npm run start:dev

# Production build
$ npm run build

# Start production server
$ npm run start:prod
```

### Formatting & Linting

```bash
# Format files
$ npm run format

# Run linter
$ npm run lint
```

### Testing

```bash
# Run unit tests
$ npm run test

# Run End-to-End (E2E) tests
$ npm run test:e2e

# Run test coverage
$ npm run test:cov
```

---

## API Endpoints

- **Health Probe**: `GET /api/v1/health`
- **Swagger Documentation**: `GET /api/docs` (only available in non-production environments)
# boilerplate-backend
