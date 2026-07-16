import crypto from 'crypto'

export const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!
export const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!
export const PAYFAST_PASSPHRASE = (process.env.PAYFAST_PASSPHRASE ?? '').trim()
export const IS_SANDBOX = process.env.PAYFAST_SANDBOX === 'true' || process.env.NODE_ENV !== 'production'

export const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

function pfEncode(val: string): string {
  return encodeURIComponent(val.trim())
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

export function generateSignature(data: Record<string, string>, passphrase: string): string {
  const entries = Object.entries(data)
    .filter(([, val]) => val !== undefined && val.trim() !== '')

  let output = entries.map(([key, val]) => `${key}=${pfEncode(val)}`).join('&')

  if (passphrase.trim()) {
    output += `&passphrase=${pfEncode(passphrase)}`
  }
  const hash = crypto.createHash('md5').update(output).digest('hex')
  console.log('PAYFAST_SIG_STRING:', output)
  console.log('PAYFAST_SIG_HASH:', hash)
  return hash
}

export function verifyITN(params: Record<string, string>, passphrase: string): boolean {
  const { signature, ...rest } = params
  const expected = generateSignature(rest, passphrase)
  return expected === signature
}
