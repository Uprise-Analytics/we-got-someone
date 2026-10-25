import { createHmac, timingSafeEqual } from 'crypto'

// Signed unsubscribe links, so nobody can unsubscribe someone else by guessing an email.
function sign(email: string) {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update('unsubscribe:' + email.toLowerCase()).digest('base64url').slice(0, 32)
}

export function unsubscribeToken(email: string) {
  return sign(email)
}

export function validUnsubscribeToken(email: string, token: string) {
  const expected = Buffer.from(sign(email))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
