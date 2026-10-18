import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_EMAIL = 'demo@mender.et';
const DEMO_PASSWORD = 'demo1234';
const DEMO_NAME = 'Demo Lender';
const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10);

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
    title: 'Large Wedding Tent (10m x 20m)',
    category: 'Tents & Canopies',
    description: 'Heavy-duty event tent, includes stakes and ropes. Seats up to 200 guests.',
    price_per_day: 2500,
    city: 'Addis Ababa',
    neighborhood: 'Bole',
    latitude: 8.9806,
    longitude: 38.7578,
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
    title: "Traditional Habesha Kemis (Women's Size M)",
    category: 'Traditional Attire',
    description: 'Authentic hand-woven Habesha Kemis with matching netela. Perfect for weddings.',
    price_per_day: 450,
    city: 'Gondar',
    neighborhood: 'Fasilo',
    latitude: 11.5937,
    longitude: 37.3882,
  },
  {
    title: 'LED Event Lighting Kit',
    category: 'Sound & Lighting',
    description: 'Professional LED lighting kit with colour wash, spotlights, and DMX controller.',
    price_per_day: 1200,
    city: 'Dire Dawa',
    neighborhood: 'Kezira',
    latitude: 9.5931,
    longitude: 41.8661,
  },
];

async function seed(): Promise<void> {
  // Guard: refuse to run in production to prevent accidental data insertion
  const env = process.env['NODE_ENV'] ?? 'development';
  if (env === 'production') {
    console.error('Seed script must not be run in production. Set NODE_ENV != production.');
    process.exit(1);
  }

  // Use a single Client (not a Pool) to avoid connection churn on hosted DBs like Neon
  const client = new Client({
    connectionString: process.env['DATABASE_URL'],
    ssl: process.env['DATABASE_URL']?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 30000,
  });

  await client.connect();
  console.log('Connected to database.');

  try {
    // 1. Upsert demo lender
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'lender')
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [DEMO_NAME, DEMO_EMAIL, passwordHash]
    );
    const ownerId = userResult.rows[0]?.id;
    if (!ownerId) throw new Error('Failed to upsert demo lender');
    console.log(`Demo lender id: ${ownerId}`);

    // 2. Insert seed equipment (idempotent — skip duplicates by title + owner)
    for (const item of SEED_ITEMS) {
      await client.query(
        `INSERT INTO equipment
           (title, category, description, price_per_day, city, neighborhood,
            latitude, longitude, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (title, owner_id) DO NOTHING`,
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
  } finally {
    await client.end();
  }
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
