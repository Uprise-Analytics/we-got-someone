import { tradeGuide, commonFaqs } from '@/lib/trade-content'
import { tradePerson, withArticle } from '@/lib/trade-slugs'

// Hiring guide shown under the workers on /find pages, plus FAQ structured data for Google.
export default function TradeGuide({ skill, area }: { skill: string; area?: string }) {
  const guide = tradeGuide(skill)
  const faqs = [...guide.faqs, ...commonFaqs(skill, area)]
  const person = tradePerson(skill)
  const where = area ? ` in ${area}` : ''

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Hiring {withArticle(person)}{where}: what to know</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">What affects the price</h3>
          <ul className="space-y-2">
            {guide.price.map(p => (
              <li key={p} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="text-green-600 font-bold">•</span>{p}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">Always ask for a quote before work starts.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">Questions to ask first</h3>
          <ul className="space-y-2">
            {guide.ask.map(q => (
              <li key={q} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
                <span className="text-green-600 font-bold">?</span>{q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-gray-900 mb-4">Frequently asked questions</h3>
      <div className="space-y-3">
        {faqs.map(f => (
          <details key={f.q} className="bg-white border border-gray-200 rounded-2xl px-6 py-4 group">
            <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between gap-4">
              {f.q}
              <span className="text-green-600 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{f.a}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }),
        }}
      />
    </section>
  )
}
