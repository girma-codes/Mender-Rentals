# Implementation Plan — Mender Rentals Backend Scaffold + Frontend Wiring

## Context

- **Frontend root**: `d:\kiro project\po\mender-rentals-platform`
- **Backend root**: `d:\kiro project\po\mender-rentals-platform\server`
- **Frontend build command**: `npm run build` (runs `tsc -b && vite build`)
- **Frontend TypeScript checker**: `npx tsc -b` (project references, noEmit already set in tsconfig.app.json)
- **Backend TypeScript checker**: `npx tsc --noEmit` (run inside `server/`)
- **Auth context file**: `src/context/AuthContext.tsx` — pure mock today, no API calls
- **Seed data**: `src/data/seedData.ts` — 10 Ethiopian equipment listings; first 5 used in backend seed
- **Path alias**: frontend uses `@/*` → `src/*` (vite + tsconfig.app.json)
- **TypeScript version (frontend)**: ~6.0.2; backend uses its own 5.5.3

---

## Ordered Plan

---

- [ ] 1. Create `server/package.json` with all pinned dependencies.

  This is the first file because every subsequent `npm install` and build step inside `server/` depends on it. Pin every version exactly as specified; no `^` or `~` ranges.

  **File**: `server/package.json`

  ```json
  {
    "name": "mender-rentals-server",
    "version": "1.0.0",
    "description": "Mender Rentals — Node.js/Express/PostgreSQL backend",
    "main": "dist/index.js",
    "scripts": {
      "dev": "tsx watch src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "migrate": "tsx src/db/migrate.ts",
      "seed": "tsx src/db/seed.ts"
    },
    "dependencies": {
      "bcryptjs": "2.4.3",
      "cors": "2.8.5",
      "dotenv": "16.4.5",
      "express": "4.19.2",
      "jsonwebtoken": "9.0.2",
      "pg": "8.12.0",
      "zod": "3.23.8"
    },
    "devDependencies": {
      "@types/bcryptjs": "2.4.6",
      "@types/cors": "2.8.17",
      "@types/express": "4.17.21",
      "@types/jsonwebtoken": "9.0.6",
      "@types/node": "20.14.10",
      "@types/pg": "8.11.6",
      "tsx": "4.16.2",
      "typescript": "5.5.3"
    }
  }
  ```

  **Verify**: `cd server && npm install` completes without errors; `node_modules/express` exists.

---

- [ ] 2. Create `server/tsconfig.json` with CommonJS output settings.

  The backend compiles to CommonJS (Node.js native). `rootDir` is `./src`, `outDir` is `./dist`. Strict mode on; `skipLibCheck` true to avoid conflicts across `@types` packages. `resolveJsonModule` true for any JSON imports.

  **File**: `server/tsconfig.json`

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "lib": ["ES2022"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "resolveJsonModule": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

  **Verify**: After `npm install` in step 1, `npx tsc --noEmit` in `server/` reports no errors (once all source files exist after step 11).

---

- [ ] 3. Create `server/.env.example` documenting all required environment variables.

  This file is committed to the repo. It documents every variable the backend reads. Developers copy it to `.env` and fill in real values before running the server.

  **File**: `server/.env.example`

  ```
  PORT=3001
  DATABASE_URL=postgresql://postgres:password@localhost:5432/mender_rentals
  JWT_SECRET=change-me-to-a-long-random-string-in-production
  JWT_EXPIRES_IN=7d
  BCRYPT_ROUNDS=12
  CORS_ORIGIN=http://localhost:5173
  ```

  **Verify**: File exists; contains all six variables.

---

- [ ] 4. Create `server/src/db/schema.sql` with all three table definitions, constraints, and indexes.

  Schema is pure SQL executed by the migrate script. Use `CREATE TABLE IF NOT EXISTS` so re-runs are safe. UUIDs for all PKs (use `gen_random_uuid()` which requires PostgreSQL 13+). Use `CHECK` constraints exactly as specified. Include `created_at`/`updated_at` with `DEFAULT NOW()`.

  **File**: `server/src/db/schema.sql`

  ```sql
  -- Enable pgcrypto if gen_random_uuid() is not natively available
  -- (PostgreSQL 13+ has it built-in; this is a no-op on 13+)
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  -- Users
  CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    phone         VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'renter'
                    CHECK (role IN ('renter', 'lender', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Equipment
  CREATE TABLE IF NOT EXISTS equipment (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(255) NOT NULL,
    category      VARCHAR(100) NOT NULL,
    description   TEXT,
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day > 0),
    city          VARCHAR(100) NOT NULL,
    neighborhood  VARCHAR(100),
    latitude      NUMERIC(9, 6),
    longitude     NUMERIC(9, 6),
    images        JSONB NOT NULL DEFAULT '[]',
    condition     VARCHAR(20) NOT NULL DEFAULT 'good'
                    CHECK (condition IN ('excellent', 'good', 'fair')),
    available     BOOLEAN NOT NULL DEFAULT TRUE,
    owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_equipment_owner_id   ON equipment(owner_id);
  CREATE INDEX IF NOT EXISTS idx_equipment_category   ON equipment(category);
  CREATE INDEX IF NOT EXISTS idx_equipment_city       ON equipment(city);

  -- Rental Requests
  CREATE TABLE IF NOT EXISTS rental_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id  UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    renter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    total_price   NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    message       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
  );

  CREATE INDEX IF NOT EXISTS idx_rental_renter_id     ON rental_requests(renter_id);
  CREATE INDEX IF NOT EXISTS idx_rental_equipment_id  ON rental_requests(equipment_id);
  CREATE INDEX IF NOT EXISTS idx_rental_status        ON rental_requests(status);
  ```

  **Verify**: Schema file exists. After migration in step 13, `psql` `\dt` shows all three tables.

---

- [ ] 5. Create `server/src/db/connection.ts` — pg Pool and query helper.

  Reads `DATABASE_URL` from environment. Exports a named `pool` and a `query` convenience wrapper so route handlers never import `pg` directly.

  **File**: `server/src/db/connection.ts`

  ```typescript
  import { Pool } from 'pg';
  import dotenv from 'dotenv';

  dotenv.config();

  export const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  export async function query<T = unknown>(
    text: string,
    params?: unknown[]
  ): Promise<import('pg').QueryResult<T extends object ? T : never>> {
    const start = Date.now();
    const res = await pool.query<T extends object ? T : never>(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
    return res;
  }
  ```

  > **Note**: The generic is bounded to `object` because `pg` requires `QueryResultRow extends object`. Callers that need a plain result can use `query<Record<string, unknown>>(...)`.

  **Verify**: TypeScript compiles without error after all files exist (`npx tsc --noEmit` in `server/`).

---

- [ ] 6. Create `server/src/db/migrate.ts` — reads schema.sql and executes it against the database.

  Uses `fs.readFileSync` to load the SQL file relative to the script's own location (`__dirname`), then runs it in a single `pool.query` call. Logs success and exits with code 0; logs error and exits with code 1 on failure.

  **File**: `server/src/db/migrate.ts`

  ```typescript
  import fs from 'fs';
  import path from 'path';
  import { pool } from './connection';

  async function migrate(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Running migration…');
    await pool.query(sql);
    console.log('Migration complete.');
    await pool.end();
    process.exit(0);
  }

  migrate().catch((err: unknown) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
  ```

  **Verify**: With a running PostgreSQL instance and a valid `.env`, `npm run migrate` inside `server/` logs "Migration complete." without errors.

---

- [ ] 7. Create `server/src/db/seed.ts` — inserts demo lender and first 5 equipment items.

  Creates one demo lender account (`demo@mender.et` / `demo1234`) using `bcryptjs.hash`. Then inserts the first 5 Ethiopian equipment items from `seedData.ts` values (hardcoded as constants in this file — do NOT import from the frontend `src/` tree). Uses `INSERT ... ON CONFLICT DO NOTHING` so the script is idempotent.

  **File**: `server/src/db/seed.ts`

  ```typescript
  import bcrypt from 'bcryptjs';
  import { pool } from './connection';

  const DEMO_EMAIL = 'demo@mender.et';
  const DEMO_PASSWORD = 'demo1234';
  const DEMO_NAME = 'Demo Lender';
  const BCRYPT_ROUNDS = 12;

  interface SeedItem {
    title: string;
    category: string;
    description: string;
    price_per_day: number;
    city: string;
    neighborhood: string;
    latitude: number;
    longitude: number;
  }

  const SEED_ITEMS: SeedItem[] = [
    {
      title: 'Large Wedding Tent (10m × 20m)',
      category: 'Tents & Canopies',
      description: 'Heavy-duty event tent, includes stakes and ropes. Seats up to 200 guests.',
      price_per_day: 2500,
      city: 'Addis Ababa',
      neighborhood: 'Bole',
      latitude: 8.9806,
      longitude: 38.7578,
    },
    {
      title: 'Plastic Folding Chairs (Set of 50)',
      category: 'Seating',
      description: 'White plastic folding chairs, clean and stackable.',
      price_per_day: 300,
      city: 'Hawassa',
      neighborhood: 'Tabor',
      latitude: 7.0621,
      longitude: 38.4768,
    },
    {
      title: 'Professional PA Sound System',
      category: 'Sound & Lighting',
      description: '2000W PA system with two speakers, subwoofer, mixer and microphones.',
      price_per_day: 1800,
      city: 'Bahir Dar',
      neighborhood: 'Tana Sub-city',
      latitude: 11.5742,
      longitude: 37.3614,
    },
    {
      title: 'Catering Buffet Serving Set',
      category: 'Catering',
      description: 'Full buffet serving set: chafing dishes, ladles, tongs, and display stands.',
      price_per_day: 900,
      city: 'Addis Ababa',
      neighborhood: 'Kazanchis',
      latitude: 9.0127,
      longitude: 38.7614,
    },
    {
      title: "Traditional Habesha Kemis (Women's, Size M)",
      category: 'Traditional Attire',
      description: 'Authentic hand-woven Habesha Kemis with matching netela. Perfect for weddings.',
      price_per_day: 450,
      city: 'Gondar',
      neighborhood: 'Fasilo',
      latitude: 11.5937,
      longitude: 37.3882,
    },
  ];

  async function seed(): Promise<void> {
    // 1. Upsert demo lender
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
    const userResult = await pool.query<{ id: string }>(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'lender')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [DEMO_NAME, DEMO_EMAIL, passwordHash]
    );
    const ownerId = userResult.rows[0]?.id;
    if (!ownerId) throw new Error('Failed to upsert demo lender');
    console.log(`Demo lender id: ${ownerId}`);

    // 2. Insert seed equipment
    for (const item of SEED_ITEMS) {
      await pool.query(
        `INSERT INTO equipment
           (title, category, description, price_per_day, city, neighborhood,
            latitude, longitude, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [
          item.title,
          item.category,
          item.description,
          item.price_per_day,
          item.city,
          item.neighborhood,
          item.latitude,
          item.longitude,
          ownerId,
        ]
      );
    }
    console.log(`Seeded ${SEED_ITEMS.length} equipment items.`);
    await pool.end();
    process.exit(0);
  }

  seed().catch((err: unknown) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
  ```

  **Verify**: With migration already run, `npm run seed` inside `server/` logs "Seeded 5 equipment items." and exits 0.

---

- [ ] 8. Create `server/src/types/express.d.ts` — augment Express Request with `user`.

  Adds a `user` property to Express's `Request` interface so `req.user` is typed everywhere without casting.

  **File**: `server/src/types/express.d.ts`

  ```typescript
  import 'express';

  declare global {
    namespace Express {
      interface Request {
        user?: {
          userId: string;
          email: string;
          role: string;
        };
      }
    }
  }
  ```

  **Verify**: `npx tsc --noEmit` in `server/` — no errors about `req.user` in middleware.

---

- [ ] 9. Create `server/src/middleware/auth.ts` — JWT authentication middleware.

  Reads the `Authorization: Bearer <token>` header. If missing or malformed → 401. Verifies with `JWT_SECRET` from env. Attaches `{userId, email, role}` to `req.user`. If verification fails → 401 with a clear message.

  **File**: `server/src/middleware/auth.ts`

  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import jwt from 'jsonwebtoken';

  interface JwtPayload {
    userId: string;
    email: string;
    role: string;
  }

  export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
  }
  ```

  **Verify**: TypeScript compiles cleanly; `req.user` is typed via the express.d.ts augmentation from step 8.

---

- [ ] 10. Create `server/src/middleware/errorHandler.ts` — global Express error handler.

  Express's four-argument error handler signature `(err, req, res, next)`. Logs the error server-side and returns a 500 JSON response. Never leaks stack traces to the client.

  **File**: `server/src/middleware/errorHandler.ts`

  ```typescript
  import { Request, Response, NextFunction } from 'express';

  export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    console.error('[Error]', err);
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    res.status(500).json({ error: message });
  }
  ```

  **Verify**: TypeScript compiles cleanly.

---

- [ ] 11. Create `server/src/middleware/validate.ts` — Zod request body validation helper.

  Returns an Express middleware function that parses `req.body` against a Zod schema. On failure, responds 400 with a structured list of issues. On success, overwrites `req.body` with the parsed (typed) result and calls `next()`.

  **File**: `server/src/middleware/validate.ts`

  ```typescript
  import { Request, Response, NextFunction } from 'express';
  import { ZodSchema, ZodError } from 'zod';

  export function validate<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issues = (result.error as ZodError).issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        res.status(400).json({ error: 'Validation failed', issues });
        return;
      }
      req.body = result.data;
      next();
    };
  }
  ```

  **Verify**: TypeScript compiles cleanly.

---

- [ ] 12. Create `server/src/routes/auth.ts` — `/api/auth/signup` and `/api/auth/login`.

  Both routes use the `validate` middleware with Zod schemas. Signup checks email uniqueness (409 on conflict), hashes password with bcrypt, inserts user, returns JWT + user object. Login finds user by email (401 with "No account found for this email. Please sign up first." if missing), compares hash (401 "Invalid password" on mismatch), returns JWT + user object. JWT payload: `{userId, email, role}`.

  **File**: `server/src/routes/auth.ts`

  ```typescript
  import { Router, Request, Response } from 'express';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import { z } from 'zod';
  import { query } from '../db/connection';
  import { validate } from '../middleware/validate';

  const router = Router();

  // ── Schemas ──────────────────────────────────────────────────────────────

  const signupSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email:     z.string().email('Invalid email address'),
    phone:     z.string().optional(),
    password:  z.string().min(6, 'Password must be at least 6 characters'),
    role:      z.enum(['renter', 'lender']).optional().default('renter'),
  });

  const loginSchema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  function signToken(userId: string, email: string, role: string): string {
    const secret = process.env['JWT_SECRET'] ?? 'fallback-secret';
    const expiresIn = (process.env['JWT_EXPIRES_IN'] ?? '7d') as jwt.SignOptions['expiresIn'];
    return jwt.sign({ userId, email, role }, secret, { expiresIn });
  }

  // ── POST /api/auth/signup ─────────────────────────────────────────────────

  router.post('/signup', validate(signupSchema), async (req: Request, res: Response) => {
    const { full_name, email, phone, password, role } = req.body as z.infer<typeof signupSchema>;

    // Check uniqueness
    const existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if ((existing.rowCount ?? 0) > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const rounds = parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10);
    const password_hash = await bcrypt.hash(password, rounds);

    const result = await query<{ id: string; full_name: string; email: string; phone: string | null; role: string }>(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role`,
      [full_name, email, phone ?? null, password_hash, role]
    );

    const newUser = result.rows[0];
    if (!newUser) {
      res.status(500).json({ error: 'Failed to create account.' });
      return;
    }

    const token = signToken(newUser.id, newUser.email, newUser.role);
    res.status(201).json({
      token,
      user: {
        id:        newUser.id,
        full_name: newUser.full_name,
        email:     newUser.email,
        phone:     newUser.phone,
        role:      newUser.role,
      },
    });
  });

  // ── POST /api/auth/login ──────────────────────────────────────────────────

  router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const result = await query<{ id: string; full_name: string; email: string; phone: string | null; role: string; password_hash: string }>(
      'SELECT id, full_name, email, phone, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if ((result.rowCount ?? 0) === 0) {
      res.status(401).json({ error: 'No account found for this email. Please sign up first.' });
      return;
    }

    const user = result.rows[0]!;
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid password.' });
      return;
    }

    const token = signToken(user.id, user.email, user.role);
    res.status(200).json({
      token,
      user: {
        id:        user.id,
        full_name: user.full_name,
        email:     user.email,
        phone:     user.phone,
        role:      user.role,
      },
    });
  });

  export default router;
  ```

  **Verify**: TypeScript compiles cleanly.

---

- [ ] 13. Create `server/src/routes/equipment.ts` — CRUD for equipment listings.

  GET `/` and GET `/:id` are public. POST `/`, PUT `/:id`, DELETE `/:id` require `authenticateToken`. Owner-only checks on PUT/DELETE use `req.user.userId` against the equipment's `owner_id`. Supports query params `?category=&city=&neighborhood=&available=`.

  **File**: `server/src/routes/equipment.ts`

  ```typescript
  import { Router, Request, Response } from 'express';
  import { z } from 'zod';
  import { query } from '../db/connection';
  import { authenticateToken } from '../middleware/auth';
  import { validate } from '../middleware/validate';

  const router = Router();

  const equipmentSchema = z.object({
    title:         z.string().min(3),
    category:      z.string().min(1),
    description:   z.string().optional(),
    price_per_day: z.number().positive(),
    city:          z.string().min(1),
    neighborhood:  z.string().optional(),
    latitude:      z.number().optional(),
    longitude:     z.number().optional(),
    images:        z.array(z.string()).optional().default([]),
    condition:     z.enum(['excellent', 'good', 'fair']).optional().default('good'),
    available:     z.boolean().optional().default(true),
  });

  // GET /api/equipment — public, optional filters
  router.get('/', async (req: Request, res: Response) => {
    const { category, city, neighborhood, available } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (category)     { conditions.push(`category = $${i++}`);     params.push(category); }
    if (city)         { conditions.push(`city ILIKE $${i++}`);      params.push(`%${city}%`); }
    if (neighborhood) { conditions.push(`neighborhood ILIKE $${i++}`); params.push(`%${neighborhood}%`); }
    if (available !== undefined) {
      conditions.push(`available = $${i++}`);
      params.push(available === 'true');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT e.*, u.full_name AS owner_name
         FROM equipment e
         JOIN users u ON u.id = e.owner_id
         ${where}
         ORDER BY e.created_at DESC`,
      params
    );
    res.json(result.rows);
  });

  // GET /api/equipment/:id — public
  router.get('/:id', async (req: Request, res: Response) => {
    const result = await query(
      `SELECT e.*, u.full_name AS owner_name
         FROM equipment e
         JOIN users u ON u.id = e.owner_id
         WHERE e.id = $1`,
      [req.params['id']]
    );
    if ((result.rowCount ?? 0) === 0) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }
    res.json(result.rows[0]);
  });

  // POST /api/equipment — protected
  router.post('/', authenticateToken, validate(equipmentSchema), async (req: Request, res: Response) => {
    const d = req.body as z.infer<typeof equipmentSchema>;
    const result = await query(
      `INSERT INTO equipment
         (title, category, description, price_per_day, city, neighborhood,
          latitude, longitude, images, condition, available, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        d.title, d.category, d.description ?? null, d.price_per_day,
        d.city, d.neighborhood ?? null, d.latitude ?? null, d.longitude ?? null,
        JSON.stringify(d.images), d.condition, d.available, req.user!.userId,
      ]
    );
    res.status(201).json(result.rows[0]);
  });

  // PUT /api/equipment/:id — protected, owner only
  router.put('/:id', authenticateToken, validate(equipmentSchema.partial()), async (req: Request, res: Response) => {
    const check = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) { res.status(404).json({ error: 'Equipment not found.' }); return; }
    if (check.rows[0]!.owner_id !== req.user!.userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    const d = req.body as Partial<z.infer<typeof equipmentSchema>>;
    const fields = Object.entries(d)
      .map(([k], idx) => `${k} = $${idx + 2}`)
      .join(', ');
    const values = Object.values(d);

    const result = await query(
      `UPDATE equipment SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params['id'], ...values]
    );
    res.json(result.rows[0]);
  });

  // DELETE /api/equipment/:id — protected, owner only
  router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    const check = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) { res.status(404).json({ error: 'Equipment not found.' }); return; }
    if (check.rows[0]!.owner_id !== req.user!.userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    await query('DELETE FROM equipment WHERE id = $1', [req.params['id']]);
    res.status(204).send();
  });

  export default router;
  ```

  **Verify**: TypeScript compiles cleanly.

---

- [ ] 14. Create `server/src/routes/rentals.ts` — CRUD for rental requests.

  POST `/` (create, protected), GET `/my` (renter's own requests, protected), GET `/incoming` (requests on equipment owned by current user, protected), PATCH `/:id/status` (owner of equipment updates status, protected). Total price is calculated server-side: `price_per_day × days` (inclusive: `end_date - start_date + 1`).

  **File**: `server/src/routes/rentals.ts`

  ```typescript
  import { Router, Request, Response } from 'express';
  import { z } from 'zod';
  import { query } from '../db/connection';
  import { authenticateToken } from '../middleware/auth';
  import { validate } from '../middleware/validate';

  const router = Router();

  const createSchema = z.object({
    equipment_id: z.string().uuid(),
    start_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
    end_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
    message:      z.string().optional(),
  }).refine(d => d.end_date >= d.start_date, {
    message: 'end_date must be on or after start_date',
    path: ['end_date'],
  });

  const statusSchema = z.object({
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  });

  // POST /api/rentals — protected, create rental request
  router.post('/', authenticateToken, validate(createSchema), async (req: Request, res: Response) => {
    const d = req.body as z.infer<typeof createSchema>;

    // Fetch equipment price
    const eqResult = await query<{ price_per_day: number; owner_id: string }>(
      'SELECT price_per_day, owner_id FROM equipment WHERE id = $1 AND available = true',
      [d.equipment_id]
    );
    if ((eqResult.rowCount ?? 0) === 0) {
      res.status(404).json({ error: 'Equipment not found or not available.' });
      return;
    }
    if (eqResult.rows[0]!.owner_id === req.user!.userId) {
      res.status(400).json({ error: 'You cannot rent your own equipment.' });
      return;
    }

    const pricePerDay = Number(eqResult.rows[0]!.price_per_day);
    const start = new Date(d.start_date);
    const end   = new Date(d.end_date);
    const days  = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const totalPrice = pricePerDay * days;

    const result = await query(
      `INSERT INTO rental_requests
         (equipment_id, renter_id, start_date, end_date, total_price, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [d.equipment_id, req.user!.userId, d.start_date, d.end_date, totalPrice, d.message ?? null]
    );
    res.status(201).json(result.rows[0]);
  });

  // GET /api/rentals/my — protected, current user's requests as renter
  router.get('/my', authenticateToken, async (req: Request, res: Response) => {
    const result = await query(
      `SELECT rr.*, e.title AS equipment_title, e.city, e.neighborhood, e.price_per_day,
              u.full_name AS owner_name
         FROM rental_requests rr
         JOIN equipment e ON e.id = rr.equipment_id
         JOIN users u ON u.id = e.owner_id
         WHERE rr.renter_id = $1
         ORDER BY rr.created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  });

  // GET /api/rentals/incoming — protected, requests on equipment I own
  router.get('/incoming', authenticateToken, async (req: Request, res: Response) => {
    const result = await query(
      `SELECT rr.*, e.title AS equipment_title, u.full_name AS renter_name, u.phone AS renter_phone
         FROM rental_requests rr
         JOIN equipment e ON e.id = rr.equipment_id
         JOIN users u ON u.id = rr.renter_id
         WHERE e.owner_id = $1
         ORDER BY rr.created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  });

  // PATCH /api/rentals/:id/status — protected, equipment owner updates status
  router.patch('/:id/status', authenticateToken, validate(statusSchema), async (req: Request, res: Response) => {
    // Verify the caller owns the equipment for this request
    const check = await query<{ equipment_id: string }>(
      'SELECT rr.equipment_id FROM rental_requests rr WHERE rr.id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) { res.status(404).json({ error: 'Request not found.' }); return; }

    const ownership = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [check.rows[0]!.equipment_id]
    );
    if (ownership.rows[0]!.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Only the equipment owner can update request status.' });
      return;
    }

    const { status } = req.body as z.infer<typeof statusSchema>;
    const result = await query(
      'UPDATE rental_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params['id']]
    );
    res.json(result.rows[0]);
  });

  export default router;
  ```

  **Verify**: TypeScript compiles cleanly.

---

- [ ] 15. Create `server/src/index.ts` — Express application entry point.

  Loads dotenv, configures CORS from `CORS_ORIGIN` env, mounts JSON body parser, mounts all three route trees, attaches the global error handler, and listens on `PORT` (default 3001).

  **File**: `server/src/index.ts`

  ```typescript
  import dotenv from 'dotenv';
  dotenv.config();

  import express from 'express';
  import cors from 'cors';

  import authRoutes      from './routes/auth';
  import equipmentRoutes from './routes/equipment';
  import rentalRoutes    from './routes/rentals';
  import { errorHandler } from './middleware/errorHandler';

  const app  = express();
  const PORT = parseInt(process.env['PORT'] ?? '3001', 10);

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth',      authRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/rentals',   rentalRoutes);

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Global error handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Mender Rentals API running on http://localhost:${PORT}`);
  });

  export default app;
  ```

  **Verify**: `npx tsc --noEmit` in `server/` passes with zero errors. `npm run dev` starts and logs the listening message.

---

- [ ] 16. Verify backend TypeScript compilation end-to-end.

  All 11 source files are now in place. Run the TypeScript checker inside `server/` to confirm zero errors before touching the frontend.

  **Files**: no new files — this is a verification checkpoint.

  **Verify**: `cd server && npx tsc --noEmit` — exits 0 with no error output.

---

- [ ] 17. Update `src/context/AuthContext.tsx` — wire API calls with mock fallback.

  This is the only frontend file that changes. Apply the following diff precisely:

  1. Add `API_BASE_URL` constant immediately after the imports:
     ```typescript
     const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001';
     ```

  2. Replace the `login` callback body: try `fetch(${API_BASE_URL}/api/auth/login, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) })`. If `response.ok`, extract `{token, user}` from JSON. Call `localStorage.setItem('mender_auth_token', token)`. Build `AuthUser` from `{id: user.id, name: user.full_name, email: user.email, phone: user.phone ?? undefined, avatarInitials: user.full_name.split(' ').slice(0,2).map((w:string) => w[0]?.toUpperCase() ?? '').join('')}`. Set state + localStorage (STORAGE_KEY). If `!response.ok`, throw `new Error(data.error ?? 'Login failed')`. Wrap the entire fetch in a `try/catch`: on `TypeError` (network error), **fall through to the existing mock logic** (copy the current mock body into the catch branch). Reject the promise on API errors.

  3. Replace the `signup` callback body: same pattern — try `fetch(${API_BASE_URL}/api/auth/signup, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({full_name: name, email, phone, password}) })`. On success extract `{token, user}`, store token, build AuthUser, resolve. On `!response.ok` throw the API error. On `TypeError` fall through to existing mock body.

  4. In the `logout` callback, add `localStorage.removeItem('mender_auth_token');` before (or after) the existing `localStorage.removeItem(STORAGE_KEY)` line.

  5. Do **not** remove or alter: `STORAGE_KEY`, `REGISTERED_EMAILS_KEY`, `hydrateUser`, `intendedPath`, `setIntendedPath`, `pendingItemId`, `setPendingItemId`, the `navigate` call in logout, or the `AuthContextValue` interface. The mock path must remain fully functional.

  **File**: `src/context/AuthContext.tsx`

  **Verify**: `npm run build` at the frontend root exits 0 with no TypeScript errors. (The API does not need to be running for the build to succeed.)

---

- [ ] 18. Create frontend root `.env.example`.

  Documents the one environment variable the frontend reads. Committed to the repo so developers know what to set.

  **File**: `.env.example` (at `d:\kiro project\po\mender-rentals-platform\.env.example`)

  ```
  VITE_API_URL=http://localhost:3001
  ```

  **Verify**: File exists at project root.

---

- [ ] 19. Create `server/README.md` — backend setup and API reference.

  Documents everything a developer needs to run the backend from scratch: prerequisites, setup steps, all API endpoints, and how to connect the frontend.

  **File**: `server/README.md`

  ```markdown
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

  | Method | Path                       | Auth Required | Description                          |
  |--------|----------------------------|:-------------:|--------------------------------------|
  | POST   | /api/auth/signup           | No            | Register a new account               |
  | POST   | /api/auth/login            | No            | Login and receive JWT token          |
  | GET    | /api/equipment             | No            | List equipment (filterable)          |
  | GET    | /api/equipment/:id         | No            | Get single equipment item            |
  | POST   | /api/equipment             | Yes           | Create a new equipment listing       |
  | PUT    | /api/equipment/:id         | Yes           | Update listing (owner only)          |
  | DELETE | /api/equipment/:id         | Yes           | Delete listing (owner only)          |
  | POST   | /api/rentals               | Yes           | Create a rental request              |
  | GET    | /api/rentals/my            | Yes           | Get my rental requests (as renter)   |
  | GET    | /api/rentals/incoming      | Yes           | Incoming requests for my equipment  |
  | PATCH  | /api/rentals/:id/status    | Yes           | Update request status (owner only)   |
  | GET    | /api/health                | No            | Server health check                  |

  ### Authentication

  Protected routes require an `Authorization` header:
  ```
  Authorization: Bearer <token>
  ```

  ## Connecting the Frontend

  In the frontend root (`d:\kiro project\po\mender-rentals-platform`), create a `.env` file:
  ```
  VITE_API_URL=http://localhost:3001
  ```

  The `AuthContext` will automatically use this URL for login/signup API calls.
  If the variable is not set or the API is unreachable, it falls back to local mock auth.

  ## Environment Variables

  | Variable       | Default                           | Description                            |
  |----------------|-----------------------------------|----------------------------------------|
  | PORT           | 3001                              | HTTP port to listen on                 |
  | DATABASE_URL   | (required)                        | PostgreSQL connection string           |
  | JWT_SECRET     | (required)                        | Secret key for JWT signing             |
  | JWT_EXPIRES_IN | 7d                                | JWT token expiry duration              |
  | BCRYPT_ROUNDS  | 12                                | bcrypt cost factor                     |
  | CORS_ORIGIN    | http://localhost:5173             | Allowed CORS origin (frontend URL)     |
  ```

  **Verify**: File exists at `server/README.md`.

---

- [ ] 20. Final end-to-end verification.

  Run both verification commands to confirm the full codebase (backend + frontend) is in a valid, buildable state.

  **Files**: no changes — verification only.

  **Verify**:
  1. `cd server && npx tsc --noEmit` — exits 0 (backend TypeScript clean)
  2. `cd .. && npm run build` at the frontend root — exits 0 (TypeScript + Vite build succeeds)

---

## File Creation Order Summary

| # | File | Purpose |
|---|------|---------|
| 1 | `server/package.json` | Backend dependency manifest |
| 2 | `server/tsconfig.json` | Backend TypeScript config |
| 3 | `server/.env.example` | Backend env docs |
| 4 | `server/src/db/schema.sql` | Database schema |
| 5 | `server/src/db/connection.ts` | pg Pool + query helper |
| 6 | `server/src/db/migrate.ts` | Schema migration runner |
| 7 | `server/src/db/seed.ts` | Demo data seeder |
| 8 | `server/src/types/express.d.ts` | Request.user type augmentation |
| 9 | `server/src/middleware/auth.ts` | JWT middleware |
| 10 | `server/src/middleware/errorHandler.ts` | Global error handler |
| 11 | `server/src/middleware/validate.ts` | Zod validation middleware |
| 12 | `server/src/routes/auth.ts` | Auth routes |
| 13 | `server/src/routes/equipment.ts` | Equipment CRUD routes |
| 14 | `server/src/routes/rentals.ts` | Rental request routes |
| 15 | `server/src/index.ts` | Express entry point |
| 16 | *(verification checkpoint)* | Backend TS compile check |
| 17 | `src/context/AuthContext.tsx` | Frontend API wiring |
| 18 | `.env.example` | Frontend env docs |
| 19 | `server/README.md` | Backend documentation |
| 20 | *(verification checkpoint)* | Full build verification |

## Notes & Assumptions

- **PostgreSQL 13+** required for `gen_random_uuid()` without the pgcrypto extension (the migration enables the extension as a no-op safety measure).
- **No HTTPS/TLS** is configured in this scaffold — that is a deployment concern handled at the reverse-proxy layer.
- **Image storage** is intentionally out of scope: the `images` column stores JSONB arrays of URLs; actual file upload infrastructure is a separate task.
- **Frontend TypeScript version** is ~6.0.2 (with `ignoreDeprecations: "6.0"` in tsconfig.app.json); backend uses its own 5.5.3 installed inside `server/node_modules` — these do not conflict.
- **The mock auth fallback** in AuthContext is preserved deliberately so the frontend remains fully functional for developers who have not yet set up PostgreSQL.
