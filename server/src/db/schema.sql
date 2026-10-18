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

CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_title_owner ON equipment(title, owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_owner_id ON equipment(owner_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_city     ON equipment(city);

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

CREATE INDEX IF NOT EXISTS idx_rental_renter_id    ON rental_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_rental_equipment_id ON rental_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_rental_status       ON rental_requests(status);
