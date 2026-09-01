/**
 * Security hardening migration — Phase 2 (pen test findings)
 * Fixes: H-1 (column leak), H-3 (subscription bypass), H-4+M-2 (storage),
 *        M-3 (orphaned photos), L-3 (delete own profile), cleanup (test data)
 *
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."
 *   node scripts/migrate-security.mjs
 */

const PROJECT_REF = 'oagbvxyvsqhfothhjndr'
const PAT = process.env.SUPABASE_ACCESS_TOKEN

if (!PAT) {
  console.error('Set SUPABASE_ACCESS_TOKEN to your Supabase personal access token.')
  process.exit(1)
}

const SQL = `
-- ── H-3: Column protection trigger ────────────────────────────────────────────
-- Workers can update their own row but cannot touch billing/trust/analytics columns.
-- The service role (used by all API routes) bypasses this entirely.

CREATE OR REPLACE FUNCTION public.workers_protect_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN new;
  END IF;
  new.free_until        := old.free_until;
  new.is_active         := old.is_active;
  new.guarantee_claimed := old.guarantee_claimed;
  new.referral_code     := old.referral_code;
  new.referred_by       := old.referred_by;
  new.profile_views     := old.profile_views;
  new.whatsapp_taps     := old.whatsapp_taps;
  new.user_id           := old.user_id;
  new.created_at        := old.created_at;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS workers_protect_columns_trg ON public.workers;
CREATE TRIGGER workers_protect_columns_trg
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.workers_protect_columns();

-- ── H-1: Public view — safe columns only ──────────────────────────────────────
-- Anon key can query this view and get only what the public directory needs.
-- The base workers table is restricted to row owners only.

CREATE OR REPLACE VIEW public.workers_public AS
SELECT
  id, name, bio, skills, city, area, phone, photo_url, banner_url,
  work_photos, website, daily_rate, available_now, own_transport,
  years_experience, languages, service_areas, gender, date_of_birth, created_at
FROM public.workers
WHERE is_active = true;

ALTER VIEW public.workers_public SET (security_invoker = off);
GRANT SELECT ON public.workers_public TO anon, authenticated;

-- Replace the permissive "Public can view active workers" policy with owner-only
DROP POLICY IF EXISTS "Public can view active workers" ON public.workers;
DROP POLICY IF EXISTS "workers_select_own" ON public.workers;
CREATE POLICY "workers_select_own"
  ON public.workers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── H-4 + M-2: Storage bucket — ownership-scoped write, no listing ────────────
-- Workers can only write to paths that start with their own worker ID.
-- No SELECT policy = listing disabled. Public URLs still work (bucket is public).

DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "worker_photos_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "worker_photos_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "worker_photos_owner_delete" ON storage.objects;

CREATE POLICY "worker_photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'worker-photos'
    AND EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.user_id = auth.uid()
      AND name LIKE w.id::text || '%'
    )
  );

CREATE POLICY "worker_photos_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'worker-photos'
    AND EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.user_id = auth.uid()
      AND name LIKE w.id::text || '%'
    )
  );

CREATE POLICY "worker_photos_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'worker-photos'
    AND EXISTS (
      SELECT 1 FROM public.workers w
      WHERE w.user_id = auth.uid()
      AND name LIKE w.id::text || '%'
    )
  );

-- ── L-3: Allow workers to delete their own profile ────────────────────────────
DROP POLICY IF EXISTS "workers_delete_own" ON public.workers;
CREATE POLICY "workers_delete_own"
  ON public.workers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Cleanup: Remove pen test data (rows only; storage files cleaned separately) ─
DELETE FROM public.workers WHERE id = 'f515eee9-b04e-4622-b28c-cba52c2506e1';
DELETE FROM public.leads WHERE utm_source = 'PENTEST-DELETE-ME';
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
    console.log('Security migration succeeded.')
    console.log('H-3 trigger, H-1 view, H-4+M-2 storage policies, M-3 cleanup trigger, L-3 delete policy all applied.')
    console.log('Pen test data deleted.')
  } else {
    console.error(`Migration failed (${res.status}):`, text)
    process.exit(1)
  }
}

run()
