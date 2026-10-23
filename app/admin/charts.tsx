type Point = { day: string; value: number }

const NAVY = '#1D294A'
const GREEN = '#16a34a'

function shortDay(day: string) {
  return new Date(day + 'T12:00:00Z').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function niceMax(n: number) {
  if (n <= 4) return 4
  const step = Math.pow(10, Math.floor(Math.log10(n)))
  return Math.ceil(n / step) * step
}

export function Sparkline({ points, color = '#4ade80' }: { points: Point[]; color?: string }) {
  const W = 120, H = 32
  const max = Math.max(1, ...points.map(p => p.value))
  const step = points.length > 1 ? W / (points.length - 1) : W
  const xy = points.map((p, i) => [i * step, H - 2 - (p.value / max) * (H - 6)])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none" aria-hidden>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={color} opacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />}
    </svg>
  )
}

// Visitors as an area, profile views as a line, WhatsApp contacts as bars along the bottom.
export function TrafficChart({ visitors, views, contacts }: { visitors: Point[]; views: Point[]; contacts: Point[] }) {
  const W = 760, H = 240, L = 34, R = 8, T = 12, B = 26
  const iw = W - L - R, ih = H - T - B
  const max = niceMax(Math.max(1, ...visitors.map(p => p.value), ...views.map(p => p.value)))
  const cmax = niceMax(Math.max(1, ...contacts.map(p => p.value)))
  const n = visitors.length
  const x = (i: number) => L + (n > 1 ? (i / (n - 1)) * iw : iw / 2)
  const y = (v: number) => T + ih - (v / max) * ih
  const path = (pts: Point[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const barW = Math.max(2, Math.min(14, iw / n - 3))
  const labelEvery = Math.ceil(n / 7)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Daily visitors, profile views and WhatsApp contacts">
      <defs>
        <linearGradient id="visitorsFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={NAVY} stopOpacity={0.22} />
          <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {ticks.map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeDasharray={t ? '3 4' : undefined} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#9ca3af">{t}</text>
        </g>
      ))}
      {contacts.map((p, i) => p.value > 0 && (
        <rect key={p.day} x={x(i) - barW / 2} width={barW} y={T + ih - (p.value / cmax) * ih * 0.45} height={(p.value / cmax) * ih * 0.45} rx={2} fill={GREEN} opacity={0.85}>
          <title>{`${shortDay(p.day)}: ${p.value} WhatsApp contact${p.value === 1 ? '' : 's'}`}</title>
        </rect>
      ))}
      <path d={`${path(visitors)} L${x(n - 1)},${T + ih} L${x(0)},${T + ih} Z`} fill="url(#visitorsFill)" />
      <path d={path(visitors)} fill="none" stroke={NAVY} strokeWidth={2.25} strokeLinejoin="round" />
      <path d={path(views)} fill="none" stroke="#60a5fa" strokeWidth={1.75} strokeDasharray="5 4" strokeLinejoin="round" />
      {visitors.map((p, i) => (
        <g key={p.day}>
          <rect x={x(i) - iw / n / 2} y={T} width={iw / n} height={ih} fill="transparent">
            <title>{`${shortDay(p.day)}\n${p.value} visitors\n${views[i]?.value ?? 0} profile views\n${contacts[i]?.value ?? 0} WhatsApp contacts`}</title>
          </rect>
          {(i % labelEvery === 0 || i === n - 1) && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={11} fill="#9ca3af">{shortDay(p.day)}</text>
          )}
        </g>
      ))}
      {n > 0 && <circle cx={x(n - 1)} cy={y(visitors[n - 1].value)} r={4} fill={NAVY} stroke="#fff" strokeWidth={2} />}
    </svg>
  )
}

export function GrowthChart({ points }: { points: Point[] }) {
  const W = 360, H = 120, L = 4, R = 4, T = 10, B = 20
  const iw = W - L - R, ih = H - T - B
  const max = Math.max(1, ...points.map(p => p.value))
  const n = points.length
  const x = (i: number) => L + (n > 1 ? (i / (n - 1)) * iw : iw)
  const y = (v: number) => T + ih - (v / max) * ih
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Total workers over time">
      <line x1={L} x2={W - R} y1={T + ih} y2={T + ih} stroke="#e5e7eb" />
      <path d={`${line} L${x(n - 1)},${T + ih} L${x(0)},${T + ih} Z`} fill={GREEN} opacity={0.12} />
      <path d={line} fill="none" stroke={GREEN} strokeWidth={2.25} strokeLinejoin="round" />
      {n > 0 && (
        <>
          <circle cx={x(n - 1)} cy={y(points[n - 1].value)} r={4} fill={GREEN} stroke="#fff" strokeWidth={2} />
          <text x={L} y={H - 4} fontSize={11} fill="#9ca3af">{shortDay(points[0].day)}</text>
          <text x={W - R} y={H - 4} fontSize={11} fill="#9ca3af" textAnchor="end">Today</text>
        </>
      )}
    </svg>
  )
}

export function BarList({ items, empty, color = 'bg-green-500', suffix }: { items: [string, number][]; empty: string; color?: string; suffix?: string }) {
  if (!items.length) return <p className="text-sm text-gray-400 py-3">{empty}</p>
  const max = Math.max(...items.map(i => i[1]))
  return (
    <ul className="space-y-2.5">
      {items.map(([label, value]) => (
        <li key={label}>
          <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
            <span className="text-gray-700 truncate">{label}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{value}{suffix}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1)
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : s.value
        const drop = prev - s.value
        return (
          <li key={s.label} className="grid grid-cols-[1fr_auto] items-end gap-x-3">
            <div>
              <p className="text-sm text-gray-700 mb-1">{s.label}</p>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#1D294A]" style={{ width: `${Math.max(2, (s.value / top) * 100)}%`, opacity: 1 - i * 0.09 }} />
              </div>
            </div>
            <div className="text-right w-20">
              <span className="text-base font-bold text-gray-900 tabular-nums">{s.value}</span>
              {i > 0 && drop > 0 && <span className="block text-[11px] text-red-500 tabular-nums">−{drop} lost</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
