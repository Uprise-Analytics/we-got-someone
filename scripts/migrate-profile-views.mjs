// Run this once to add the profile_views column to the workers table.
//
// Steps:
// 1. Go to https://supabase.com/dashboard/account/tokens
// 2. Generate a new token (name it "cli" or anything)
// 3. Run: SUPABASE_ACCESS_TOKEN=sbp_yourtoken node scripts/migrate-profile-views.mjs

const token = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = 'oagbvxyvsqhfothhjndr'

if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN=sbp_... first')
  console.error('Get one at: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'ALTER TABLE workers ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;' }),
})

const data = await res.json()
if (!res.ok) {
  console.error('Migration failed:', data)
  process.exit(1)
}

console.log('Done — profile_views column added to workers table.')
