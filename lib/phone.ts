// wa.me needs the number in international format without "+" or a leading 0.
// SA numbers are stored as typed (e.g. "082 123 4567"), so swap the 0 for 27.
export function waNumber(phone: string | null | undefined) {
  let digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)                       // 0027 82 ...
  if (digits.startsWith('270') && digits.length === 12) digits = '27' + digits.slice(3) // +27 (0)82 ...
  if (digits.startsWith('27')) return digits
  if (digits.startsWith('0')) return '27' + digits.slice(1)                   // 082 ...
  if (digits.length === 9) return '27' + digits                               // 82 ... (dropped the 0)
  return digits
}

// Pre-typed message customers see when they tap WhatsApp on a profile.
export const ENQUIRY_MESSAGE = "Hi, I found you on We Got Someone and I'd like to ask about your services."

export function waLink(phone: string | null | undefined, text = ENQUIRY_MESSAGE) {
  return `https://wa.me/${waNumber(phone) ?? ''}?text=${encodeURIComponent(text)}`
}
