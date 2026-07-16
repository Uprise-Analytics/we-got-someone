'use client'

export default function PayFastForm({
  action,
  fields,
}: {
  action: string
  fields: Record<string, string>
}) {
  return (
    <form method="POST" action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 text-base"
      >
        Pay R99 with PayFast
      </button>
    </form>
  )
}
