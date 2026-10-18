import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const createSchema = z.object({
  equipment_id: z.string().min(1, 'equipment_id is required'),
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

// Allowed status transitions: maps current status → set of valid next statuses
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  pending:   new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['completed', 'cancelled']),
  completed: new Set(),   // terminal
  cancelled: new Set(),   // terminal
};

// POST /api/rentals — protected, create rental request
router.post('/', authenticateToken, validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = req.body as z.infer<typeof createSchema>;

    // Fetch equipment price and verify availability
    const eqResult = await query<{ price_per_day: string; owner_id: string }>(
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
  } catch (err) {
    next(err);
  }
});

// GET /api/rentals/my — protected, current user's requests as renter
router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// GET /api/rentals/incoming — protected, requests on equipment I own
router.get('/incoming', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// PATCH /api/rentals/:id/status — protected, equipment owner updates status
router.patch('/:id/status', authenticateToken, validate(statusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify the rental request exists and get current status
    const check = await query<{ equipment_id: string; status: string }>(
      'SELECT equipment_id, status FROM rental_requests WHERE id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    // Verify the caller owns the equipment
    const ownership = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [check.rows[0]!.equipment_id]
    );
    if (ownership.rows[0]!.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Only the equipment owner can update request status.' });
      return;
    }

    const { status } = req.body as z.infer<typeof statusSchema>;
    const currentStatus = check.rows[0]!.status;

    // Enforce state machine transitions
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.has(status)) {
      res.status(422).json({
        error: `Cannot transition from '${currentStatus}' to '${status}'.`,
        allowed: allowed ? Array.from(allowed) : [],
      });
      return;
    }

    const result = await query(
      'UPDATE rental_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params['id']]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
