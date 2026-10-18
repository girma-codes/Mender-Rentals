# Mender Rentals — Backend API

Node.js + Express + PostgreSQL backend for the Mender Rentals platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A running PostgreSQL instance with a database named `mender_rentals`

## Setup

1. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Set `DATABASE_URL` to your PostgreSQL connection string and `JWT_SECRET`
   to a long random string (use `openssl rand -hex 32`).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migration (creates tables):
   ```bash
   npm run migrate
   ```

4. Seed demo data (optional):
   ```bash
   npm run seed
   ```
   Creates demo lender account: `demo@mender.et` / `demo1234`

5. Start development server:
   ```bash
   npm run dev
   ```
   API runs on `http://localhost:3001`

## API Endpoints

| Method | Path                    | Auth Required | Description                         |
|--------|-------------------------|:-------------:|-------------------------------------|
| POST   | /api/auth/signup        | No            | Register a new account              |
| POST   | /api/auth/login         | No            | Login and receive JWT token         |
| GET    | /api/equipment          | No            | List equipment (filterable)         |
| GET    | /api/equipment/:id      | No            | Get single equipment item           |
| POST   | /api/equipment          | Yes           | Create a new equipment listing      |
| PUT    | /api/equipment/:id      | Yes (owner)   | Update listing                      |
| DELETE | /api/equipment/:id      | Yes (owner)   | Delete listing                      |
| POST   | /api/rentals            | Yes           | Create a rental request             |
| GET    | /api/rentals/my         | Yes           | My rental requests (as renter)      |
| GET    | /api/rentals/incoming   | Yes           | Incoming requests for my equipment  |
| PATCH  | /api/rentals/:id/status | Yes (owner)   | Update request status               |
| GET    | /api/health             | No            | Server health check                 |

### Authentication

Protected routes require an `Authorization` header:
```
Authorization: Bearer <token>
```

### Filtering Equipment

`GET /api/equipment` accepts optional query parameters:
- `?category=Tents%20%26%20Canopies`
- `?city=Addis%20Ababa`
- `?neighborhood=Bole`
- `?available=true`

## Connecting the Frontend

In the frontend root, create a `.env` file:
```
VITE_API_URL=http://localhost:3001
```

The `AuthContext` will automatically use this URL for login/signup calls.
If the variable is not set or the API is unreachable, it falls back to local mock auth.

## Environment Variables

| Variable       | Default               | Description                          |
|----------------|-----------------------|--------------------------------------|
| PORT           | 3001                  | HTTP port to listen on               |
| DATABASE_URL   | (required)            | PostgreSQL connection string         |
| JWT_SECRET     | (required)            | Secret key for JWT signing           |
| JWT_EXPIRES_IN | 7d                    | JWT token expiry duration            |
| BCRYPT_ROUNDS  | 12                    | bcrypt cost factor                   |
| CORS_ORIGIN    | http://localhost:5173 | Allowed CORS origin (frontend URL)   |

## Demo Credentials

After running `npm run seed`:

- **Email**: `demo@mender.et`
- **Password**: `demo1234`
- **Role**: lender
