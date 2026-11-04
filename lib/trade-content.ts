import { tradePerson, tradePeople, withArticle } from '@/lib/trade-slugs'

// Helpful hiring guides for the /find pages: what affects the price, what to ask, and FAQs.
// No rand amounts on purpose: prices vary too much by job and area to quote honestly.

type Guide = { price: string[]; ask: string[]; faqs: { q: string; a: string }[] }

const GUIDES: Record<string, Guide> = {
  Electrician: {
    price: ['How many points, plugs or lights are involved', 'Fault-finding time when the problem is hard to trace', 'Whether a Certificate of Compliance (COC) is needed', 'Call-out time: after-hours and weekends cost more'],
    ask: ['Are you a registered electrician who can issue a COC?', 'Is the call-out fee included in the quote?', 'Do you guarantee your work?'],
    faqs: [
      { q: 'Do I need a COC?', a: 'Yes, when you sell your house or add new electrical work. Only a registered electrician can issue one, so ask before they start.' },
      { q: 'Why does my power keep tripping?', a: 'Usually an overloaded circuit, a faulty appliance or a damaged wire. An electrician can trace it safely. Don’t keep resetting it.' },
    ],
  },
  Plumber: {
    price: ['Burst geyser, leak or blocked drain: each takes different time', 'Parts like geysers, valves and pipes', 'Emergency or after-hours call-outs', 'Access, for example pipes inside walls or under paving'],
    ask: ['Do you charge a call-out fee?', 'Do you supply parts, or must I buy them?', 'Can you help with insurance paperwork for a burst geyser?'],
    faqs: [
      { q: 'My geyser burst. What do I do first?', a: 'Switch off the geyser at the DB board and close the water supply to it. Then call a plumber and, if needed, your insurer.' },
      { q: 'Will insurance cover a burst geyser?', a: 'Most home insurance does. Take photos and keep the plumber’s report for your claim.' },
    ],
  },
  Painter: {
    price: ['Size of the area and number of coats', 'Wall prep: cracks, damp and old flaking paint', 'Interior or exterior, and the height of walls', 'Who supplies the paint'],
    ask: ['Is paint included in the quote?', 'How do you prepare the walls first?', 'Can I see photos of jobs you’ve done?'],
    faqs: [
      { q: 'How long does it take to paint a room?', a: 'A normal room usually takes a day or two, including prep and two coats.' },
      { q: 'When is the best time to paint outside?', a: 'Dry weather. Avoid rainy spells so the paint can cure properly.' },
    ],
  },
  Mechanic: {
    price: ['Diagnosing the problem versus fixing it', 'Parts: original or replacement', 'The make and model of your car', 'Whether they come to you or you go to them'],
    ask: ['Do you charge for diagnostics?', 'Will you tell me the cost before you start?', 'Do you guarantee parts and labour?'],
    faqs: [
      { q: 'My car is making a strange noise. Is it safe to drive?', a: 'Grinding, knocking or squealing can mean brakes, bearings or the engine. Get it checked before a long trip.' },
      { q: 'Should I service my car before a holiday?', a: 'Yes. A quick check of brakes, tyres, oil and the battery before a road trip can save you a breakdown.' },
    ],
  },
  'Solar Installation': {
    price: ['Size of the system: panels, inverter and batteries', 'What you want to keep running during load shedding', 'Roof type and how hard it is to mount panels', 'Paperwork and sign-off for your municipality'],
    ask: ['Which brands of inverter and battery do you use?', 'Is the installation certified, with a COC?', 'What warranty do I get on parts and installation?'],
    faqs: [
      { q: 'What size solar system do I need?', a: 'It depends on what you want to run. A good installer will look at your usage and suggest a size.' },
      { q: 'Do I need a COC for solar?', a: 'Yes, the electrical part of a solar installation needs a COC, and many insurers ask for it.' },
    ],
  },
  'CCTV & Intercom': {
    price: ['How many cameras and how far the cabling runs', 'Camera quality and night vision', 'Viewing on your phone', 'Intercom type: audio, video or gate-linked'],
    ask: ['Can I watch the cameras on my phone?', 'How long is footage stored?', 'Do you service existing systems?'],
    faqs: [
      { q: 'Should I check my cameras before going away?', a: 'Yes. Make sure every camera records and that you can see them on your phone before you leave.' },
    ],
  },
  'Garage Door Specialist': {
    price: ['Repair versus a new motor or door', 'Motor brand and size', 'Remotes and extra transmitters', 'Battery backup for load shedding'],
    ask: ['Do you repair all motor brands?', 'Does the motor have a battery backup?', 'How much are extra remotes?'],
    faqs: [
      { q: 'Why does my gate motor stop working after a storm?', a: 'Lightning and power surges often damage gate motor boards. Surge protection helps prevent it.' },
      { q: 'How often should a gate motor be serviced?', a: 'About once a year, and change the battery every 2 to 3 years.' },
    ],
  },
  Carpenter: {
    price: ['Type of wood or board', 'Custom-made versus standard sizes', 'Finishes like varnish or paint', 'Installation and removal of old units'],
    ask: ['Can I see photos of furniture you’ve made?', 'What wood or board do you use?', 'How long until it’s done?'],
    faqs: [{ q: 'Is custom furniture worth it?', a: 'It fits your space exactly and lasts longer, especially for built-in cupboards.' }],
  },
  'Kitchen Installer': {
    price: ['Size of the kitchen and number of units', 'Board and countertop material', 'Plumbing and electrical changes', 'Removing the old kitchen'],
    ask: ['Do you do the design as well?', 'Who handles plumbing and electrics?', 'How long will the kitchen be out of use?'],
    faqs: [{ q: 'How long does a kitchen installation take?', a: 'Usually one to three weeks, depending on size and whether units are custom-made.' }],
  },
  'Moving & Transport': {
    price: ['Distance and size of the move', 'Number of helpers and truck size', 'Stairs, flats or difficult access', 'Packing materials and packing help'],
    ask: ['Are my things insured during the move?', 'How many people and what size truck?', 'Do you supply boxes?'],
    faqs: [
      { q: 'When should I book movers in December?', a: 'Two to three weeks ahead. December and month-end are the busiest times.' },
    ],
  },
  'Domestic Worker': {
    price: ['Days and hours per week', 'Live-in or live-out', 'Extra duties like ironing, cooking or childcare', 'Travel distance'],
    ask: ['Do you have references from past employers?', 'Which days are you available?', 'Are you comfortable with pets or children?'],
    faqs: [
      { q: 'Do I need a contract for a domestic worker?', a: 'Yes. In South Africa you should have a written contract and register them for UIF.' },
      { q: 'What is the minimum wage for a domestic worker?', a: 'Domestic workers are covered by the national minimum wage, which is updated each year. Check the latest rate with the Department of Employment and Labour.' },
    ],
  },
  Cleaner: {
    price: ['Size of the home or office', 'Once-off deep clean versus regular cleaning', 'Who supplies cleaning products', 'Extras like windows, ovens or carpets'],
    ask: ['Do you bring your own cleaning products?', 'Do you do once-off deep cleans?', 'Do you have references?'],
    faqs: [{ q: 'How often should I get a deep clean?', a: 'Most homes benefit from a deep clean every few months, with regular cleaning in between.' }],
  },
  Gardener: {
    price: ['Size of the garden', 'How often: weekly or once-off', 'Garden refuse removal', 'Who supplies tools and fuel'],
    ask: ['Do you bring your own tools?', 'Do you remove the garden refuse?', 'Which days are you available?'],
    faqs: [{ q: 'How often should a garden be serviced?', a: 'In summer, weekly or every two weeks keeps lawns and beds neat.' }],
  },
  'Tree Felling': {
    price: ['Size and height of the tree', 'How close it is to buildings or power lines', 'Stump removal', 'Removing the wood and branches'],
    ask: ['Are you insured if something gets damaged?', 'Do you remove the wood and stump?', 'Do I need a permit for this tree?'],
    faqs: [{ q: 'Do I need permission to cut down a tree?', a: 'Some trees are protected, and complexes and municipalities may have rules. Ask your tree feller to check.' }],
  },
  'Au Pair': {
    price: ['Hours and days per week', 'Number and ages of children', 'Driving and lifts to school', 'Extras like homework help or cooking'],
    ask: ['Do you have a driver’s licence?', 'Do you have first aid training?', 'Can you give references from other families?'],
    faqs: [{ q: 'What should I ask an au pair at the interview?', a: 'Ask about experience with children the same age, references, first aid, and how they handle discipline.' }],
  },
  'Baking & Catering': {
    price: ['Number of guests', 'Menu and type of food', 'Delivery and setup', 'Custom cakes and decoration'],
    ask: ['Can I see photos of your cakes or food?', 'Do you deliver and set up?', 'How far ahead must I book?'],
    faqs: [{ q: 'How early should I book a caterer for December?', a: 'As early as you can. Year-end functions book up fast, so two to four weeks ahead is wise.' }],
  },
  Photography: {
    price: ['Length of the shoot', 'Number of edited photos', 'Location and travel', 'Prints and albums'],
    ask: ['Can I see your full portfolio?', 'How many edited photos will I get?', 'How long until I receive them?'],
    faqs: [{ q: 'When should I book a family photo shoot?', a: 'A few weeks ahead, especially for December, when photographers are busiest.' }],
  },
  'LPG Gas Installer': {
    price: ['Type of appliance: stove, geyser or heater', 'Length of gas piping', 'Indoor or outdoor bottle placement', 'The Certificate of Conformity (COC)'],
    ask: ['Are you registered to install gas and issue a COC?', 'Do you supply the bottle and regulator?', 'Where must the gas bottle go?'],
    faqs: [{ q: 'Do I need a COC for a gas installation?', a: 'Yes. Gas installations need a Certificate of Conformity from a registered installer, and insurers often ask for it.' }],
  },
  'Panel Beater': {
    price: ['How bad the damage is', 'Paint matching and respraying', 'Parts that need replacing', 'Insurance or private job'],
    ask: ['Do you work with my insurance?', 'Do you guarantee the paintwork?', 'How long will you need the car?'],
    faqs: [{ q: 'Do I have to use my insurer’s panel beater?', a: 'Not always. Check your policy, many insurers let you choose an approved panel beater.' }],
  },
  Handyman: {
    price: ['How many small jobs you need done', 'Materials and parts', 'Time on site', 'Travel distance'],
    ask: ['What kinds of jobs do you do?', 'Do you charge per job or per hour?', 'Do you bring your own tools?'],
    faqs: [{ q: 'What can a handyman help with?', a: 'Small repairs like hanging pictures, fixing doors, minor plumbing, assembling furniture and odd jobs around the house.' }],
  },
  Tiler: {
    price: ['Size of the area in square metres', 'Tile size and type', 'Removing old tiles', 'Levelling the floor first'],
    ask: ['Do you remove old tiles?', 'Who supplies the tiles and grout?', 'Can I see photos of your work?'],
    faqs: [{ q: 'Can new tiles go over old tiles?', a: 'Sometimes, if the old tiles are flat and firmly stuck. A tiler can check and advise.' }],
  },
}

export function tradeGuide(skill: string): Guide {
  return GUIDES[skill] ?? {
    price: ['The size and type of the job', 'Materials and who supplies them', 'Travel distance and call-out time', 'Urgent, after-hours or weekend work'],
    ask: ['Can you give me a written quote first?', 'Can I see photos of jobs you’ve done?', 'Do you guarantee your work?'],
    faqs: [],
  }
}

// FAQs every page shares, worded for the trade (and area, on area pages)
export function commonFaqs(skill: string, area?: string) {
  const where = area ? ` in ${area}` : ''
  return [
    {
      q: `How do I find ${withArticle(tradePerson(skill))}${where}?`,
      a: `Browse the ${tradePeople(skill)}${where} listed on We Got Someone, look at their photos and reviews, then WhatsApp or call them directly.`,
    },
    {
      q: 'Does it cost anything to use We Got Someone?',
      a: 'No. Finding someone is free, and there is no agency fee or commission. You agree on the price directly with the worker.',
    },
  ]
}
