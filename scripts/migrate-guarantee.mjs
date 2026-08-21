/**
 * Adds guarantee_claimed column to workers table.
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 *   node scripts/migrate-guarantee.mjs
 */

const PROJECT_REF = 'oagbvxyvsqhfothhjndr'
const PAT = process.env.SUPABASE_ACCESS_TOKEN

if (!PAT) {
  console.error('Set SUPABASE_ACCESS_TOKEN to your Supabase personal access token.')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const SQL = `
ALTER TABLE workers ADD COLUMN IF NOT EXISTS guarantee_claimed BOOLEAN DEFAULT FALSE;
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
    console.log('Migration succeeded. guarantee_claimed column added to workers.')
  } else {
    console.error(`Migration failed (${res.status}):`, text)
    process.exit(1)
  }
}

run()
