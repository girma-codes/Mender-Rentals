import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
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

// Allowlist of column names that can be updated by the owner.
// owner_id, created_at, id are intentionally excluded.
const ALLOWED_UPDATE_FIELDS = new Set<string>([
  'title', 'category', 'description', 'price_per_day',
  'city', 'neighborhood', 'latitude', 'longitude',
  'images', 'condition', 'available',
]);

// GET /api/equipment/my — protected, returns equipment owned by the authenticated user
router.get('/my', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT * FROM equipment WHERE owner_id = $1 ORDER BY created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/equipment — public, optional filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, city, neighborhood, available } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (category)     { conditions.push(`e.category = $${i++}`);          params.push(category); }
    if (city)         { conditions.push(`e.city ILIKE $${i++}`);          params.push(`%${city}%`); }
    if (neighborhood) { conditions.push(`e.neighborhood ILIKE $${i++}`);  params.push(`%${neighborhood}%`); }
    if (available !== undefined) {
      conditions.push(`e.available = $${i++}`);
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
  } catch (err) {
    next(err);
  }
});

// GET /api/equipment/:id — public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// POST /api/equipment — protected
router.post('/', authenticateToken, validate(equipmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// PUT /api/equipment/:id — protected, owner only
router.put('/:id', authenticateToken, validate(equipmentSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }
    if (check.rows[0]!.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    const d = req.body as Partial<z.infer<typeof equipmentSchema>>;
    // Filter against allowlist before constructing SQL to prevent injection
    const entries = Object.entries(d).filter(
      ([k, v]) => v !== undefined && ALLOWED_UPDATE_FIELDS.has(k)
    );
    if (entries.length === 0) {
      res.status(400).json({ error: 'No valid fields to update.' });
      return;
    }
    const fields = entries.map(([k], idx) => `${k} = $${idx + 2}`).join(', ');
    const values = entries.map(([, v]) => v);

    const result = await query(
      `UPDATE equipment SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params['id'], ...values]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/equipment/:id — protected, owner only
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await query<{ owner_id: string }>(
      'SELECT owner_id FROM equipment WHERE id = $1',
      [req.params['id']]
    );
    if ((check.rowCount ?? 0) === 0) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }
    if (check.rows[0]!.owner_id !== req.user!.userId) {
      res.status(403).json({ error: 'Forbidden.' });
      return;
    }

    await query('DELETE FROM equipment WHERE id = $1', [req.params['id']]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
