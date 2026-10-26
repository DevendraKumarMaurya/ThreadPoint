import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

console.log('====================================================');
console.log(' ThreadPoint PostgreSQL Initialization Runner');
console.log('====================================================');

if (!connectionString) {
  console.warn('[WARN] DATABASE_URL is not set in environment or backend/.env');
  console.warn('[WARN] Skipping database migration. Generating Prisma Client only...');
  execSync('npx prisma generate', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('[OK] Prisma Client generated.');
  process.exit(0);
}

console.log(`Connecting to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const isCloudOrSsl = connectionString && (
  connectionString.includes('sslmode=') ||
  connectionString.includes('aivencloud.com') ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('supabase.co') ||
  connectionString.includes('render.com') ||
  (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'))
);

const cleanConnectionString = isCloudOrSsl
  ? connectionString.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
  : connectionString;

const pool = new Pool({
  connectionString: cleanConnectionString,
  connectionTimeoutMillis: 15000,
  ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  let client;
  try {
    client = await pool.connect();
    console.log('[OK] Connected to PostgreSQL database successfully.');

    const sqlFiles = [
      { name: '01_schema.sql', path: path.join(__dirname, '..', 'sql', '01_schema.sql') },
      { name: '02_triggers.sql', path: path.join(__dirname, '..', 'sql', '02_triggers.sql') },
      { name: '03_views.sql', path: path.join(__dirname, '..', 'sql', '03_views.sql') },
      { name: '04_seed.sql', path: path.join(__dirname, '..', 'sql', '04_seed.sql') },
    ];

    for (const file of sqlFiles) {
      if (fs.existsSync(file.path)) {
        console.log(`[INIT] Executing ${file.name}...`);
        const sql = fs.readFileSync(file.path, 'utf8');
        await client.query(sql);
        console.log(`[DONE] Finished ${file.name}`);
      } else {
        console.warn(`[WARN] ${file.path} not found, skipping.`);
      }
    }

    console.log('[INIT] Generating Prisma Client...');
    execSync('npx prisma generate', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

    console.log('====================================================');
    console.log('[SUCCESS] Database initialization complete.');
    console.log('Tables, Triggers, Views, and Initial Seeds applied.');
    console.log('====================================================');
  } catch (err) {
    console.error('[ERROR] Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
