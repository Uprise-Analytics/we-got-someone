// Run once so the database accepts Call button taps.
// 1. Generate a token at https://supabase.com/dashboard/account/tokens
// 2. PowerShell: $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/migrate-call-taps.mjs
import { readFileSync } from 'node:fs'

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN=sbp_... first (https://supabase.com/dashboard/account/tokens)')
  process.exit(1)
}

const query = readFileSync(new URL('../supabase/migrations/20261110000000_add_call_tap_event.sql', import.meta.url), 'utf8')
const res = await fetch('https://api.supabase.com/v1/projects/oagbvxyvsqhfothhjndr/database/query', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})
const data = await res.json()
if (!res.ok) {
  console.error('Migration failed:', data)
  process.exit(1)
}
console.log('Done. Call taps will now be recorded.')
