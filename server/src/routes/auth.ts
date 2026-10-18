import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/connection';
import { validate } from '../middleware/validate';

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email:     z.string().email('Invalid email address'),
  phone:     z.string().optional(),
  password:  z.string().min(6, 'Password must be at least 6 characters'),
  // Note: self-service signup always creates a 'renter' account.
  // Lender accounts require a separate admin-promoted flow (not yet implemented).
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId: string, email: string, role: string): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  const expiresIn = (process.env['JWT_EXPIRES_IN'] ?? '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId, email, role }, secret, { expiresIn });
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

router.post('/signup', validate(signupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, email, phone, password } = req.body as z.infer<typeof signupSchema>;
    // Role is always 'renter' for self-service signup; lender promotion requires a separate flow.
    const role = 'renter';

    // Check email uniqueness
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

    const result = await query<{
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      role: string;
    }>(
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
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const result = await query<{
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      role: string;
      password_hash: string;
    }>(
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
  } catch (err) {
    next(err);
  }
});

export default router;
