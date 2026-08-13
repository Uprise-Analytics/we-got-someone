/**
 * Run once to add referral, UTM, and leads columns/tables.
 * Usage:
 *   node scripts/migrate.mjs
 *
 * Requires SUPABASE_ACCESS_TOKEN from supabase.com/dashboard/account/tokens
 * Set it as an env var:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 */

const PROJECT_REF = 'oagbvxyvsqhfothhjndr'
const PAT = process.env.SUPABASE_ACCESS_TOKEN

if (!PAT) {
  console.error('Set SUPABASE_ACCESS_TOKEN to your Supabase personal access token.')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const SQL = `
-- Referral system
ALTER TABLE workers ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES workers(id);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES workers(id),
  referred_worker_id UUID NOT NULL REFERENCES workers(id),
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UTM tracking
ALTER TABLE workers ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Lead capture (email addresses from partial sign-ups)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  trade TEXT,
  area TEXT,
  utm_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill referral codes for existing workers that don't have one
UPDATE workers
SET referral_code = UPPER(SUBSTRING(MD5(id::TEXT), 1, 6))
WHERE referral_code IS NULL;
`

async function run() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    }
  )

  const text = await res.text()
  if (res.ok) {
    console.log('Migration succeeded.')
  } else {
    console.error(`Migration failed (${res.status}):`, text)
    process.exit(1)
  }
}

run()
