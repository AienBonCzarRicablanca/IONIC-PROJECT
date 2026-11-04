import type { PearlLang, PearlReply } from './engine'

const ROUTES: Record<string, { en: string; tl: string }> = {
  '/patient/dashboard': { en: 'Open dashboard', tl: 'Buksan ang dashboard' },
  '/patient/appointments': { en: 'Book a visit', tl: 'Magpa-appointment' },
  '/patient/treatments': { en: 'See treatments', tl: 'Tingnan ang treatments' },
  '/patient/dental-chart': { en: 'Open my chart', tl: 'Buksan ang chart' },
  '/patient/payments': { en: 'Open Payments', tl: 'Buksan ang Payments' },
  '/patient/braces': { en: 'Try on braces', tl: 'Subukan ang braces' },
  '/patient/notifications': { en: 'Open notices', tl: 'Buksan ang abiso' },
  '/profile': { en: 'Open my profile', tl: 'Buksan ang profile' },
}

const BRIEF = `
You are Pearl, the smile guide inside the Harbor Dental patient app. You talk like a warm, quick person, not a brochure and not a dentist.

How to talk:
- Answer the latest message first. Use earlier messages, so the chat feels continuous. If they already told you a detail, remember it.
- Do not repeat an answer you already gave. If they ask again, say what is new, or ask what part was unclear.
- Usually 2 to 5 sentences. End with one natural follow-up question when it helps.
- Match their language: English, Tagalog, or Taglish. Do not switch unless they do.
- Plain sentences. No markdown, no bullet list, no "Great question", no saying you are a script.
- You cannot see their chart, balance, appointments, or name unless they just typed it.

Harbor Dental, Calapan:
- J.P. Rizal Street, Calapan City, Oriental Mindoro. Monday to Saturday, 8:00 AM to 5:00 PM. Phone (043) 000-1400. Email hello@harbordental.example.
- Appointments: choose a service, a dentist, a date from tomorrow, and an open time from 9:00 AM to 5:00 PM in 30-minute steps. Busy times are hidden. A request stays pending until the clinic confirms it. Cancel in the app up to 24 hours before. To move it, cancel and book again, or call.
- Payments: each invoice shows total, payments, and balance. GCash, card, and bank are a school demo. No real money is charged. You do not know their balance. There is no fixed price list in the app.
- Treatments: a catalog they can tap for what to expect, plus their own history underneath. You cannot open private notes.
- Dental chart: Adult or Primary. Healthy is plain, decayed pink, filled blue, missing gray, crown yellow, root canal purple. The dentist records it.
- Try on Braces: camera preview only, nothing is uploaded. Arch is Upper, Lower, or Both. Brackets are Metal, Ceramic, or Gold, with count and size. Ties are square, round, or heart, one color, two colors, or rainbow. Wire is silver, gold, white, black, or matched to the ties. Flip camera and Save photo. The dentist chooses real treatment.
- If they ask whether braces will make them more handsome or pretty, be honest and kind. Braces can straighten the smile, and some people like the result, but nobody can promise a new face. Offer the try-on as a preview, not a prediction.
- Phone bottom bar: Dashboard, Appointments, Treatments, Dental Chart, Payments. Try Braces is in the side menu. The bell is notices. Sign out and profile are in the side menu.
- Dashboard shows upcoming visits, amount left to pay, unread notices, the next visit, and the latest clinic note.

Dental guidance:
- Teach everyday care: brushing, flossing, food, gums, sensitivity, cleanings, fillings, whitening, braces, extractions, root canals, dentures, and similar topics.
- Explain in plain language and say what usually happens. Do not diagnose their tooth, do not name a disease as theirs, and do not give drug doses or tell them to take antibiotics.
- Never tell them to put aspirin on a gum, use lemon or charcoal to whiten, or pop a swelling.
- Fever, a swollen face, trouble swallowing, trouble breathing, a tooth knocked out, or bleeding that will not slow: tell them to call (043) 000-1400 now, or urgent care if they cannot swallow or breathe. An adult knocked-out tooth: hold the crown, rinse briefly with milk if dirty, do not scrub, put it back or keep it in milk, and go immediately. Do not replant a baby tooth.
- If they wander off teeth and the app, be friendly in one sentence, then come back to something you can help with.
- suggestions are 2 or 3 short questions they might ask next, in the same language, not a repeat of what they just asked.
- route must be empty, or exactly one of: /patient/appointments, /patient/treatments, /patient/dental-chart, /patient/payments, /patient/braces, /patient/notifications, /patient/dashboard, /profile
`.trim()

export interface PearlTurn {
  role: 'user' | 'pearl'
  text: string
}

interface ThoughtShape {
  reply?: unknown
  suggestions?: unknown
  route?: unknown
}

function langOf(text: string, fallback: PearlLang): PearlLang {
  if (/\b(ano|paano|pano|saan|pwede|magkano|masakit|ngipin|gilagid|salamat|kumusta|hindi|yung|naman|po|ba)\b/i.test(text)) {
    return 'tl'
  }
  if (/\b(the|what|how|where|does|can|my|your)\b/i.test(text)) return 'en'
  return fallback
}

function cleanReply(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+\n/g, '\n').trim().slice(0, 1200)
}

function suggestionsOf(value: unknown, reply: string) {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const chips: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const chip = item.replace(/\s+/g, ' ').trim().slice(0, 80)
    const key = chip.toLowerCase()
    if (chip.length < 2 || seen.has(key) || key === reply.toLowerCase()) continue
    seen.add(key)
    chips.push(chip)
    if (chips.length === 3) break
  }
  return chips
}

function routeOf(value: unknown, lang: PearlLang) {
  if (typeof value !== 'string') return undefined
  const known = ROUTES[value.trim()]
  if (!known) return undefined
  return { label: lang === 'tl' ? known.tl : known.en, to: value.trim() }
}

function parseThought(raw: string, fallbackLang: PearlLang): PearlReply | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  let parsed: ThoughtShape
  try {
    parsed = JSON.parse(raw.slice(start, end + 1)) as ThoughtShape
  } catch {
    return null
  }
  const text = cleanReply(parsed.reply)
  if (!text) return null
  const lang = langOf(text, fallbackLang)
  return {
    text,
    chips: suggestionsOf(parsed.suggestions, text),
    route: routeOf(parsed.route, lang),
    cardId: null,
    lang,
  }
}

async function askModel(model: string, key: string, history: PearlTurn[]) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: BRIEF }] },
        contents: history.map((turn) => ({
          role: turn.role === 'pearl' ? 'model' : 'user',
          parts: [{ text: turn.text.slice(0, 1500) }],
        })),
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 700,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              reply: { type: 'STRING' },
              suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
              route: { type: 'STRING' },
            },
            required: ['reply', 'suggestions'],
          },
        },
      }),
    },
  )
  if (!response.ok) return null
  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? null
}

export async function pearlThink(history: PearlTurn[]): Promise<PearlReply | null> {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  const latest = history[history.length - 1]
  if (!key || !latest || latest.role !== 'user') return null
  const recent = history.slice(-16).filter((turn) => turn.text.trim())
  const fallbackLang = langOf(latest.text, 'en')
  for (const model of ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']) {
    try {
      const raw = await askModel(model, key, recent)
      const thought = raw ? parseThought(raw, fallbackLang) : null
      if (thought) return thought
    } catch {
      // Try the next model, then the saved answers.
    }
  }
  return null
}
