export const TRADE_SLUGS: Record<string, string> = {
  'air-conditioning':       'Air Conditioning',
  'bathroom-renovation':    'Bathroom Renovation',
  'blinds-curtains':        'Blinds & Curtains',
  'brick-layer':            'Brick Layer',
  'carpenter':              'Carpenter',
  'cctv-intercom':          'CCTV & Intercom',
  'ceiling':                'Ceiling',
  'cleaner':                'Cleaner',
  'domestic-worker':        'Domestic Worker',
  'drain-cleaning':         'Drain Cleaning',
  'electrician':            'Electrician',
  'flooring':               'Flooring',
  'gardener':               'Gardener',
  'handyman':               'Handyman',
  'garage-door-specialist': 'Garage Door Specialist',
  'glass-specialist':       'Glass Specialist',
  'it-specialist':          'IT Specialist',
  'kitchen-installer':      'Kitchen Installer',
  'landscaping':            'Landscaping',
  'mechanic':               'Mechanic',
  'moving-transport':       'Moving & Transport',
  'nails-beauty':           'Nails & Beauty',
  'painter':                'Painter',
  'panel-beater':           'Panel Beater',
  'paving':                 'Paving',
  'pest-control':           'Pest Control',
  'photography':            'Photography',
  'plastering':             'Plastering',
  'plumber':                'Plumber',
  'pool-spa':               'Pool & Spa',
  'roofing':                'Roofing',
  'rubble-removal':         'Rubble Removal',
  'security':               'Security',
  'solar-installation':     'Solar Installation',
  'tiler':                  'Tiler',
  'tree-felling':           'Tree Felling',
  'waterproofing':          'Waterproofing',
  'welding':                'Welding',
}

export const AREA_SLUGS: Record<string, string> = {
  'johannesburg':     'Johannesburg',
  'cape-town':        'Cape Town',
  'durban':           'Durban',
  'pretoria':         'Pretoria',
  'port-elizabeth':   'Port Elizabeth',
  'east-london':      'East London',
  'bloemfontein':     'Bloemfontein',
  'nelspruit':        'Nelspruit',
  'polokwane':        'Polokwane',
  'kimberley':        'Kimberley',
  'rustenburg':       'Rustenburg',
  'pietermaritzburg': 'Pietermaritzburg',
  'witbank':          'Witbank',
  'centurion':        'Centurion',
  'soweto':           'Soweto',
}

// Top 10 trades for the /find/[trade]/[area] matrix (150 static pages)
export const TOP_TRADE_SLUGS = [
  'painter', 'plumber', 'electrician', 'cleaner', 'gardener',
  'handyman', 'tiler', 'carpenter', 'domestic-worker', 'roofing',
]

// What you call the person who does each trade, where it differs from the trade name.
const TRADE_PERSON: Record<string, string> = {
  'Air Conditioning':    'air conditioning technician',
  'Bathroom Renovation': 'bathroom renovator',
  'Blinds & Curtains':   'blinds & curtains installer',
  'CCTV & Intercom':     'CCTV & intercom installer',
  'Ceiling':             'ceiling installer',
  'Drain Cleaning':      'drain cleaner',
  'Flooring':            'flooring installer',
  'Landscaping':         'landscaper',
  'Moving & Transport':  'mover',
  'Nails & Beauty':      'nail & beauty technician',
  'Paving':              'paver',
  'Pest Control':        'pest control specialist',
  'Photography':         'photographer',
  'Plastering':          'plasterer',
  'Pool & Spa':          'pool & spa technician',
  'Roofing':             'roofer',
  'Rubble Removal':      'rubble removal specialist',
  'Security':            'security specialist',
  'Solar Installation':  'solar installer',
  'Tree Felling':        'tree feller',
  'Waterproofing':       'waterproofing specialist',
  'Welding':             'welder',
}

// Lowercases a trade name for use mid-sentence, keeping acronyms like IT and CCTV.
export function lowerTrade(skill: string): string {
  return skill.split(' ').map(w => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ')
}

export function tradePerson(skill: string): string {
  return TRADE_PERSON[skill] ?? lowerTrade(skill)
}

export function tradePeople(skill: string): string {
  const person = tradePerson(skill)
  return person.endsWith('man') ? `${person.slice(0, -3)}men` : `${person}s`
}

export function withArticle(noun: string): string {
  return `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`
}

export function titleCase(text: string): string {
  return text.split(' ').map(w => (w === '&' || /^[A-Z]{2,}$/.test(w) ? w : w[0].toUpperCase() + w.slice(1))).join(' ')
}
