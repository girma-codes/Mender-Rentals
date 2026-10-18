import type { Request, Response, NextFunction } from 'express';

// pg error codes we want to surface as 409 Conflict
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

interface PgError extends Error {
  code?: string;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Always log the full error internally (never exposed to clients)
  console.error('[Error]', err);

  // Handle known pg error codes with safe, specific messages
  const pgErr = err as PgError;
  if (pgErr?.code === PG_UNIQUE_VIOLATION) {
    res.status(409).json({ error: 'A record with this value already exists.' });
    return;
  }
  if (pgErr?.code === PG_FOREIGN_KEY_VIOLATION) {
    res.status(400).json({ error: 'Referenced resource does not exist.' });
    return;
  }

  // JWT/auth errors thrown by signToken (JWT_SECRET missing)
  if (err instanceof Error && err.message.includes('JWT_SECRET')) {
    res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    return;
  }

  // Generic fallback — deliberately vague to avoid leaking internals
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
}
