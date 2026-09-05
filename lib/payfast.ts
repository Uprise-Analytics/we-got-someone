import crypto from 'crypto'

export const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!
export const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!
export const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? ''
export const IS_SANDBOX = process.env.PAYFAST_SANDBOX === 'true' || process.env.NODE_ENV !== 'production'

export const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

export function generateSignature(data: Record<string, string>, passphrase: string): string {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== '' && v !== undefined)
  )
  const str = Object.entries(filtered)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase ? `${str}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : str
  return crypto.createHash('md5').update(withPassphrase).digest('hex')
}

export function verifyITN(params: Record<string, string>, passphrase: string): boolean {
  const { signature, ...rest } = params
  const expected = generateSignature(rest, passphrase)
  return expected === signature
}
