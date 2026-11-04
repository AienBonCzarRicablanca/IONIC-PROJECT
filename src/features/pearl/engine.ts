import { PEARL_CARDS, type PearlCard } from './knowledge'

export type PearlLang = 'en' | 'tl'

export interface PearlMemory {
  cardId: string | null
  lang: PearlLang
}

export interface PearlReply {
  text: string
  chips: string[]
  route?: { label: string; to: string }
  cardId: string | null
  lang: PearlLang
}

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'at', 'is', 'are', 'was', 'be',
  'do', 'does', 'did', 'can', 'i', 'me', 'my', 'you', 'your', 'we', 'it', 'this', 'that', 'with',
  'about', 'what', 'whats', 'how', 'when', 'where', 'why', 'should', 'could', 'would', 'please',
  'tell', 'just', 'really', 'very', 'also', 'po', 'ba', 'ang', 'ng', 'sa', 'ko', 'mo', 'yung',
  'ung', 'na', 'naman', 'lang', 'din', 'rin', 'ay', 'mga', 'ako', 'ito', 'yan', 'yun', 'nga',
  'kasi', 'para', 'kung', 'may', 'meron', 'ano', 'pano', 'paano',
])

const TL_MARK = /\b(ano|paano|pano|saan|kailan|bakit|pwede|pwedeng|magkano|masakit|ngipin|gilagid|sipilyo|bunot|pasta|linis|bayad|salamat|kumusta|kamusta|musta|sakit|gusto|hindi|opo|yung|naman|dito|bukas|ngayon|magpa|pabook|sira|maputi|namamaga|dumudugo|mabaho|buntis|pustiso|singaw|po|ba|ako|pag|pogi|popogi|gwapo|ganda|gaganda)\b/i
const EN_MARK = /\b(the|what|how|where|when|why|does|is|can|with|should|could|please|my|your|do)\b/i

const FOLLOW_UP = /^(does it|is it|will it|can it|how long|how much|how often|what about|and then|after that|masakit ba|gaano|magkano|pwede ba|safe ba|hurt|painful|sakit ba)/

const EMERGENCY = /\b(swollen|swelling|fever|knocked out|abscess|pus|cannot swallow|can't swallow|cant swallow|namamaga|pamamaga|lagnat|nana|trouble breathing|hirap lumunok|hirap huminga)\b/i

const DENTAL_HINT = /\b(tooth|teeth|gum|gums|mouth|smile|dentist|dental|cavity|brace|braces|floss|brush|enamel|jaw|bite|crown|filling|whitening|xray|oral|saliva|lip|tongue|ngipin|gilagid|sipilyo|pasta|bunot|linis|sakit|ngiti|panga|pustiso|singaw|appointment|gcash|invoice|harbor|pearl|chart|payment|pay|clinic|braces)\b/i

const APP_HINT = /\b(appointment|book|payment|pay|gcash|invoice|chart|braces|notification|dashboard|profile|sign out|logout|treatment|harbor|pearl|menu|camera|try on)\b/i

interface Scored {
  card: PearlCard
  score: number
}

const cardTokens = new Map<string, Set<string>>()
const idf = new Map<string, number>()

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\bx[\s-]?rays?\b/g, 'xray')
    .replace(/\bcheck[\s-]?ups?\b/g, 'checkup')
    .replace(/\bg[\s-]?cash\b/g, 'gcash')
    .replace(/\broot[\s-]?canals?\b/g, 'rootcanal')
    .replace(/\bdry[\s-]?socket\b/g, 'drysocket')
    .replace(/\boil[\s-]?pulling\b/g, 'oilpulling')
    .replace(/\bsign[\s-]?out\b/g, 'signout')
    .replace(/\blog[\s-]?out\b/g, 'logout')
    .replace(/\btry[\s-]?on\b/g, 'tryon')
    .replace(/\b(?:nagpa|magpa|nag|mag|pa)?braces?\b/g, 'braces')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string) {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP.has(token))
}

function buildIndex() {
  const docs = PEARL_CARDS.map((card) => {
    const bag = new Set<string>()
    for (const phrase of card.phrases) for (const token of tokens(phrase)) bag.add(token)
    for (const key of card.keys) for (const token of tokens(key)) bag.add(token)
    cardTokens.set(card.id, bag)
    return bag
  })
  const df = new Map<string, number>()
  for (const bag of docs) {
    for (const token of bag) df.set(token, (df.get(token) ?? 0) + 1)
  }
  for (const [token, count] of df) {
    idf.set(token, Math.log((PEARL_CARDS.length + 1) / (count + 0.5)))
  }
}

buildIndex()

function scoreCard(card: PearlCard, queryNorm: string, queryTokens: string[]) {
  const bag = cardTokens.get(card.id)
  if (!bag) return 0
  let score = 0
  const seen = new Set<string>()
  for (const token of queryTokens) {
    if (bag.has(token) && !seen.has(token)) {
      seen.add(token)
      score += idf.get(token) ?? 1
    }
  }
  for (const phrase of card.phrases) {
    const normalized = normalize(phrase)
    if (normalized.length > 2 && queryNorm.includes(normalized)) {
      score += 3 + normalized.split(' ').length
    }
  }
  return score
}

function rank(queryNorm: string, queryTokens: string[]): Scored[] {
  return PEARL_CARDS
    .map((card) => ({ card, score: scoreCard(card, queryNorm, queryTokens) }))
    .sort((a, b) => b.score - a.score)
}

function detectLang(message: string, fallback: PearlLang): PearlLang {
  const tagalog = TL_MARK.test(message)
  const english = EN_MARK.test(message)
  if (tagalog && !english) return 'tl'
  if (english && !tagalog) return 'en'
  if (tagalog && english) return 'tl'
  if (tokens(message).length <= 3) return fallback
  return 'en'
}

function textOf(card: PearlCard, lang: PearlLang) {
  return lang === 'tl' ? card.tl : card.en
}

function chipsOf(card: PearlCard, lang: PearlLang) {
  return lang === 'tl' ? [...card.chipsTl] : [...card.chipsEn]
}

function routeOf(card: PearlCard, lang: PearlLang) {
  if (!card.route) return undefined
  return { label: lang === 'tl' ? card.route.tl : card.route.en, to: card.route.to }
}

function disclaimer(lang: PearlLang) {
  return lang === 'tl'
    ? 'Hindi ito diagnosis. Kung may lagnat, pamamaga, hirap lumunok, o hirap huminga, tawagan ang Harbor Dental sa (043) 000-1400 o pumunta sa urgent care.'
    : 'This is not a diagnosis. If there is fever, swelling, trouble swallowing, or trouble breathing, call Harbor Dental at (043) 000-1400 or go to urgent care.'
}

function greeting(lang: PearlLang): PearlReply {
  if (lang === 'tl') {
    return {
      text: 'Hi, ako si Pearl. Tanungin mo ako kung paano gamitin ang Harbor Dental, o anumang tungkol sa ngipin, gilagid, at mga visit. Gabay lang ito. Ang dentist mo pa rin ang magdedesisyon para sa ngipin mo.',
      chips: ['Paano ako magpa-appointment?', 'Pwede bang GCash?', 'Masakit ang ngipin ko', 'Saan ang clinic?'],
      cardId: null,
      lang,
    }
  }
  return {
    text: "Hi, I'm Pearl. Ask me how to use Harbor Dental, or anything about teeth, gums, and visits. I share general guidance, and your dentist still makes the call for your own mouth.",
    chips: ['How do I book a visit?', 'Can I pay with GCash?', 'My tooth hurts', 'Where is the clinic?'],
    cardId: null,
    lang,
  }
}

function smalltalk(queryNorm: string, lang: PearlLang): PearlReply | null {
  if (/^(hi|hello|hey|yo|kumusta|kamusta|musta|good morning|good afternoon|good evening|hi pearl|hello pearl)( pearl)?$/.test(queryNorm)) {
    return greeting(lang)
  }
  if (/^(thanks|thank you|salamat|thank u|ty|maraming salamat)( pearl)?$/.test(queryNorm)) {
    return {
      text: lang === 'tl'
        ? 'Walang anuman. Nandito lang ako kung may tanong ka pa tungkol sa app o sa ngipin.'
        : "You're welcome. I'm here if another question comes up about the app or your smile.",
      chips: lang === 'tl'
        ? ['Paano magpa-appointment?', 'Paano magsipilyo?']
        : ['How do I book a visit?', 'How do I brush?'],
      cardId: null,
      lang,
    }
  }
  if (/^(bye|goodbye|paalam|see you|cya)( pearl)?$/.test(queryNorm)) {
    return {
      text: lang === 'tl' ? 'Ingat. Balik ka lang kung may tanong kang bago.' : 'Take care. Come back whenever a new question shows up.',
      chips: [],
      cardId: null,
      lang,
    }
  }
  if (/^(who are you|whats your name|what is your name|sino ka|ano pangalan mo|are you (a )?real|are you an ai|are you a dentist)$/.test(queryNorm)) {
    return {
      text: lang === 'tl'
        ? 'Ako si Pearl, ang smile guide ng Harbor Dental. Kaya kong ipaliwanag ang app at ang karaniwang tanong tungkol sa ngipin. Hindi ako dentist, at hindi ko nakikita ang chart o balance mo.'
        : "I'm Pearl, Harbor Dental's smile guide. I can explain the app and everyday dental questions. I'm not a dentist, and I can't see your chart or your balance.",
      chips: lang === 'tl'
        ? ['Ano ang puwede mong sagutin?', 'Saan ang clinic?']
        : ['What can you help me with?', 'Where is the clinic?'],
      cardId: null,
      lang,
    }
  }
  if (/^(what can you do|what can you help( me with)?|help|ano ang puwede mong sagutin|ano ang kaya mong sagutin|tulungan mo ako)$/.test(queryNorm)) {
    return {
      text: lang === 'tl'
        ? 'Puwede kitang gabayan sa pag-book, pag-cancel, bayad, chart, treatments, notifications, at try-on ng braces. Puwede mo rin akong tanungin tungkol sa linis, pasta, gilagid, sakit ng ngipin, sipilyo, at iba pang pang-araw-araw na paksa. Hindi ko binubuksan ang personal na record mo.'
        : 'I can walk you through booking, cancelling, payments, your chart, treatments, notices, and the braces try-on. You can also ask about cleanings, fillings, gums, toothache, brushing, and other everyday dental topics. I do not open your personal records.',
      chips: lang === 'tl'
        ? ['Paano magpa-appointment?', 'Masakit ang ngipin ko', 'Paano magsipilyo?']
        : ['How do I book a visit?', 'My tooth hurts', 'How do I brush?'],
      cardId: null,
      lang,
    }
  }
  if (/^(tell me a joke|joke|magbiro ka|joke time|make me laugh)$/.test(queryNorm)) {
    return {
      text: lang === 'tl'
        ? 'Bakit masaya ang ngipin sa Harbor Dental? Kasi dito, may Pearl na nakikinig bago pa man sumakit. Kapag totoo na ang kirot, dentist na ang tatawag.'
        : 'Why did the tooth look so calm at Harbor Dental? Because Pearl listens before anything starts to ache. If the pain is real, the dentist still gets the call.',
      chips: lang === 'tl' ? ['Paano magpa-appointment?', 'Ano ang cavity?'] : ['How do I book a visit?', 'What is a cavity?'],
      cardId: null,
      lang,
    }
  }
  if (/^(ok|okay|sige|alright|got it|cool|nice|great|ayos|gets)$/.test(queryNorm)) {
    return {
      text: lang === 'tl' ? 'Sige. Ano ang susunod na gusto mong itanong?' : 'Okay. What do you want to ask next?',
      chips: lang === 'tl'
        ? ['Paano magbayad?', 'Bakit dumudugo ang gilagid ko?']
        : ['How do I pay?', 'Why do my gums bleed?'],
      cardId: null,
      lang,
    }
  }
  return null
}

function unsure(lang: PearlLang, dental: boolean): PearlReply {
  if (!dental) {
    return {
      text: lang === 'tl'
        ? 'Diyan ako sa Harbor Dental at sa mga tanong tungkol sa ngipin. Subukan mo ang pag-book, bayad, sipilyo, gilagid, o kung masakit ang ngipin.'
        : 'I stay with Harbor Dental and questions about teeth. Try me on booking, payments, brushing, gums, or a tooth that hurts.',
      chips: lang === 'tl'
        ? ['Paano magpa-appointment?', 'Paano magsipilyo?', 'Masakit ang ngipin ko']
        : ['How do I book a visit?', 'How do I brush?', 'My tooth hurts'],
      cardId: null,
      lang,
    }
  }
  return {
    text: lang === 'tl'
      ? 'Wala akong eksaktong note diyan. Ang ligtas na hakbang ay ilarawan ito sa susunod na visit. Kung may kirot, pamamaga, o dugong hindi humuhupa, tawagan ang Harbor Dental sa (043) 000-1400. Puwede mo rin akong tanungin tungkol sa sipilyo, cavity, gilagid, braces, o kung paano gamitin ang app.'
      : "I don't have a specific note on that. The safe next step is to describe it at your next visit. If there is pain, swelling, or bleeding that will not stop, call Harbor Dental at (043) 000-1400. You can also ask me about brushing, cavities, gums, braces, or how to use the app.",
    chips: lang === 'tl'
      ? ['Paano magpa-appointment?', 'Ano ang cavity?', 'Paano magsipilyo?']
      : ['How do I book a visit?', 'What is a cavity?', 'How do I brush?'],
    cardId: null,
    lang,
  }
}

export function pearlGreeting(lang: PearlLang = 'en') {
  return greeting(lang)
}

export function pearlReply(message: string, memory: PearlMemory): PearlReply {
  const trimmed = message.trim()
  const lang = detectLang(trimmed, memory.lang)
  const queryNorm = normalize(trimmed)
  if (!queryNorm) return greeting(lang)

  const casual = smalltalk(queryNorm, lang)
  if (casual) return casual
  const queryTokens = tokens(trimmed)
  let ranked = rank(queryNorm, queryTokens)

  const follow = FOLLOW_UP.test(queryNorm)
  if (follow && memory.cardId && (ranked[0]?.score ?? 0) < 4) {
    const previous = ranked.find((entry) => entry.card.id === memory.cardId)
    if (previous) previous.score += 4
    ranked = [...ranked].sort((a, b) => b.score - a.score)
  }

  const best = ranked[0]
  const second = ranked[1]
  if (!best || best.score < 1.7) {
    return unsure(lang, DENTAL_HINT.test(trimmed) || APP_HINT.test(trimmed))
  }

  let focus = best.card
  let text = textOf(best.card, lang)
  let route = routeOf(best.card, lang)

  if (best.card.id === 'prices' && second && second.score >= 2 && second.card.id !== 'prices') {
    focus = second.card
    text = `${text}\n\n${textOf(second.card, lang)}`
    route = routeOf(second.card, lang) ?? route
  }

  if (EMERGENCY.test(trimmed) && !focus.care && best.card.id !== 'swelling' && best.card.id !== 'knocked') {
    text = `${text}\n\n${disclaimer(lang)}`
  }

  const chips = chipsOf(focus, lang)
  if (second && second.card.id !== focus.id && second.score > best.score * 0.75) {
    const extra = chipsOf(second.card, lang)[0]
    if (extra && !chips.includes(extra)) chips.unshift(extra)
  }

  return {
    text,
    chips: chips.slice(0, 3),
    route,
    cardId: focus.id,
    lang,
  }
}
