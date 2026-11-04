<template>
  <div class="pearl" :class="{ lifted, open }">
    <button v-if="open" class="backdrop" type="button" aria-label="Close Pearl" @click="close" />

    <section
      v-if="open"
      class="panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pearl-title"
      :style="panelStyle"
    >
      <header class="head">
        <img class="avatar" src="/pearl.jpg" alt="" />
        <div class="who">
          <h2 id="pearl-title">Pearl</h2>
          <p>{{ typing ? 'Thinking…' : 'Smile guide · Harbor Dental' }}</p>
        </div>
        <button type="button" class="icon-btn" aria-label="Clear chat" @click="clearChat">
          <ion-icon :icon="trashOutline" />
        </button>
        <button type="button" class="icon-btn" aria-label="Close chat" @click="close">
          <ion-icon :icon="closeOutline" />
        </button>
      </header>

      <div ref="threadRef" class="thread" aria-live="polite">
        <article
          v-for="message in messages"
          :key="message.id"
          class="row"
          :class="message.from === 'user' ? 'from-user' : 'from-pearl'"
        >
          <img v-if="message.from === 'pearl'" class="mini" src="/pearl.jpg" alt="" />
          <div class="bubble">
            <p v-for="(part, index) in paragraphs(message.text)" :key="index">{{ part }}</p>
            <button
              v-if="message.from === 'pearl'"
              type="button"
              class="speak"
              :aria-label="message.lang === 'tl' ? 'Basahin ang sagot' : 'Read this aloud'"
              @click="speak(message.text, message.lang)"
            >
              <ion-icon :icon="volumeHighOutline" />
            </button>
            <button
              v-if="message.route && message.id === lastPearlId"
              type="button"
              class="go"
              @click="go(message.route.to)"
            >
              {{ message.route.label }}
            </button>
          </div>
        </article>
        <article v-if="typing" class="row from-pearl">
          <img class="mini" src="/pearl.jpg" alt="" />
          <div class="bubble typing" aria-hidden="true"><span /><span /><span /></div>
        </article>
      </div>

      <div v-if="activeChips.length" class="chips">
        <button v-for="chip in activeChips" :key="chip" type="button" @click="send(chip)">{{ chip }}</button>
      </div>

      <form class="composer" @submit.prevent="send(draft)">
        <label class="sr" for="pearl-input">Message Pearl</label>
        <textarea
          id="pearl-input"
          ref="inputRef"
          v-model="draft"
          rows="1"
          maxlength="500"
          placeholder="Ask about the app or your smile"
          @keydown.enter.exact.prevent="send(draft)"
          @input="grow"
        />
        <button
          v-if="canListen"
          type="button"
          class="icon-btn mic"
          :class="{ listening }"
          :aria-pressed="listening"
          :aria-label="listening ? 'Stop listening' : 'Speak your question'"
          @click="toggleMic"
        >
          <ion-icon :icon="listening ? stopOutline : micOutline" />
        </button>
        <button class="send" type="submit" :disabled="!draft.trim() || typing" aria-label="Send">
          <ion-icon :icon="sendOutline" />
        </button>
      </form>
      <p v-if="micNote" class="mic-note">{{ micNote }}</p>
    </section>

    <div v-else-if="teaser" class="teaser">
      <p>Hi, I'm Pearl. Ask me about the app or your smile.</p>
      <button type="button" aria-label="Dismiss greeting" @click="dismissTeaser">
        <ion-icon :icon="closeOutline" />
      </button>
    </div>

    <button v-if="!open" class="fab" type="button" aria-label="Chat with Pearl" @click="openChat">
      <img src="/pearl.jpg" alt="" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { closeOutline, micOutline, sendOutline, stopOutline, trashOutline, volumeHighOutline } from 'ionicons/icons'
import { pearlGreeting, pearlReply, type PearlLang, type PearlMemory } from '../../features/pearl/engine'
import { pearlThink } from '../../features/pearl/think'

interface ChatRoute {
  label: string
  to: string
}

interface ChatMessage {
  id: number
  from: 'pearl' | 'user'
  text: string
  lang: PearlLang
  chips: string[]
  route?: ChatRoute
}

interface StoredChat {
  messages: ChatMessage[]
  memory: PearlMemory
  teaser: boolean
}

const STORAGE_KEY = 'harbor-pearl-chat'

const route = useRoute()
const router = useRouter()
const open = ref(false)
const teaser = ref(true)
const draft = ref('')
const typing = ref(false)
const listening = ref(false)
const micNote = ref('')
const lift = ref(0)
const messages = ref<ChatMessage[]>([])
const memory = ref<PearlMemory>({ cardId: null, lang: 'en' })
const threadRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
let nextId = 1
let turn = 0
let recognition: SpeechRec | null = null

const lifted = computed(() => route.path.startsWith('/patient'))
const lastPearlId = computed(() => {
  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    if (messages.value[index].from === 'pearl') return messages.value[index].id
  }
  return 0
})
const activeChips = computed(() => {
  const latest = messages.value[messages.value.length - 1]
  if (!latest || latest.from !== 'pearl' || typing.value) return []
  return latest.chips
})
const panelStyle = computed(() => {
  if (lift.value <= 0) return undefined
  const height = window.visualViewport ? Math.min(640, window.visualViewport.height - 20) : 480
  return { bottom: `${lift.value + 8}px`, height: `${height}px` }
})

type SpeechRec = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const SpeechCtor = (window as unknown as {
  SpeechRecognition?: new () => SpeechRec
  webkitSpeechRecognition?: new () => SpeechRec
}).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition

const canListen = Boolean(SpeechCtor)

function paragraphs(text: string) {
  return text.split(/\n+/).filter(Boolean)
}

function persist() {
  const payload: StoredChat = {
    messages: messages.value.slice(-30),
    memory: memory.value,
    teaser: teaser.value,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

function restore() {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const stored = JSON.parse(raw) as StoredChat
    if (Array.isArray(stored.messages) && stored.messages.length) {
      messages.value = stored.messages
      nextId = Math.max(...stored.messages.map((message) => message.id)) + 1
      teaser.value = false
    }
    if (stored.memory) memory.value = stored.memory
    if (typeof stored.teaser === 'boolean' && !messages.value.length) teaser.value = stored.teaser
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

function seedGreeting() {
  if (messages.value.length) return
  const hello = pearlGreeting(memory.value.lang)
  messages.value.push({
    id: nextId++,
    from: 'pearl',
    text: hello.text,
    lang: hello.lang,
    chips: hello.chips,
  })
}

async function scrollDown() {
  await nextTick()
  const thread = threadRef.value
  if (thread) thread.scrollTop = thread.scrollHeight
}

async function tap() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // The browser build has no vibration motor.
  }
}

function openChat() {
  teaser.value = false
  open.value = true
  seedGreeting()
  persist()
  void tap()
  void scrollDown()
  void nextTick(() => inputRef.value?.focus())
}

function stopListening() {
  try {
    recognition?.stop()
  } catch {
    // Already stopped, or the browser has no microphone session.
  }
  listening.value = false
}

function close() {
  stopListening()
  open.value = false
  window.speechSynthesis?.cancel()
}

function dismissTeaser() {
  teaser.value = false
  persist()
}

function clearChat() {
  turn += 1
  typing.value = false
  memory.value = { cardId: null, lang: memory.value.lang }
  messages.value = []
  seedGreeting()
  persist()
  void scrollDown()
}

function grow() {
  const field = inputRef.value
  if (!field) return
  field.style.height = 'auto'
  field.style.height = `${Math.min(field.scrollHeight, 96)}px`
}

function go(path: string) {
  close()
  if (route.path !== path) void router.push(path)
}

function speak(text: string, lang: PearlLang) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'tl' ? 'fil-PH' : 'en-PH'
  window.speechSynthesis.speak(utterance)
}

function toggleMic() {
  if (!SpeechCtor) return
  if (listening.value) {
    stopListening()
    return
  }
  micNote.value = ''
  const rec = new SpeechCtor()
  recognition = rec
  rec.lang = memory.value.lang === 'tl' ? 'fil-PH' : 'en-PH'
  rec.interimResults = false
  rec.continuous = false
  rec.onresult = (event) => {
    const said = event.results[0]?.[0]?.transcript?.trim()
    if (said) {
      draft.value = said
      void send(said)
    }
  }
  rec.onerror = () => {
    listening.value = false
    micNote.value = 'The microphone is not available. You can still type.'
  }
  rec.onend = () => {
    listening.value = false
  }
  try {
    rec.start()
    listening.value = true
  } catch {
    listening.value = false
    micNote.value = 'The microphone is not available. You can still type.'
  }
}

async function send(raw: string) {
  const text = raw.trim()
  if (!text || typing.value) return
  void tap()
  stopListening()
  messages.value.push({ id: nextId++, from: 'user', text, lang: memory.value.lang, chips: [] })
  draft.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'
  const turnId = ++turn
  typing.value = true
  await scrollDown()
  const history = messages.value.slice(-16).map((message) => ({ role: message.from, text: message.text }))
  const live = await pearlThink(history)
  if (turnId !== turn) return
  const reply = live ?? pearlReply(text, memory.value)
  memory.value = { cardId: reply.cardId, lang: reply.lang }
  messages.value.push({
    id: nextId++,
    from: 'pearl',
    text: reply.text,
    lang: reply.lang,
    chips: reply.chips,
    route: reply.route,
  })
  typing.value = false
  persist()
  void scrollDown()
}

function onViewport() {
  const viewport = window.visualViewport
  if (!viewport) return
  const covered = window.innerHeight - viewport.height - viewport.offsetTop
  lift.value = covered > 80 ? covered : 0
}

watch(messages, persist, { deep: true })

onMounted(() => {
  restore()
  window.visualViewport?.addEventListener('resize', onViewport)
  window.visualViewport?.addEventListener('scroll', onViewport)
})

onUnmounted(() => {
  turn += 1
  stopListening()
  window.visualViewport?.removeEventListener('resize', onViewport)
  window.visualViewport?.removeEventListener('scroll', onViewport)
})
</script>

<style scoped>
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  pointer-events: none;
}

.pearl {
  position: fixed;
  right: 16px;
  bottom: 20px;
  z-index: 80;
}

.pearl.lifted,
.pearl.lifted .panel {
  bottom: calc(78px + env(safe-area-inset-bottom));
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 1;
  border: 0;
  background: rgb(16 36 43 / 28%);
}

.fab {
  position: relative;
  width: 64px;
  height: 64px;
  padding: 0;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #e7f6f8;
  box-shadow: 0 10px 24px rgb(23 52 61 / 28%);
  overflow: hidden;
  cursor: pointer;
}

.fab img,
.avatar,
.mini {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fab::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #2f9d8c;
}

.teaser {
  position: absolute;
  right: 74px;
  bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: min(230px, calc(100vw - 110px));
  padding: 12px 10px 12px 14px;
  border-radius: 16px 16px 4px 16px;
  background: var(--surface);
  color: var(--clinic-ink);
  box-shadow: var(--shadow-md);
}

.teaser p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.35;
}

.teaser button,
.icon-btn,
.speak,
.go,
.chips button,
.send {
  cursor: pointer;
}

.teaser button {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--clinic-ink);
}

.panel {
  position: fixed;
  right: 12px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  width: min(400px, calc(100vw - 24px));
  height: min(640px, calc(100dvh - 112px - env(safe-area-inset-bottom)));
  z-index: 2;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--canvas);
  box-shadow: 0 18px 50px rgb(16 36 43 / 28%);
}

.head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.who {
  flex: 1;
  min-width: 0;
}

.who h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  color: var(--clinic-ink);
}

.who p {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--clinic-ink);
  font-size: 1.15rem;
}

.icon-btn.listening {
  background: #f3d0d0;
  color: #8d2d2d;
}

.thread {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 14px 12px 8px;
}

.row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.row.from-user {
  justify-content: flex-end;
}

.mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.bubble {
  position: relative;
  max-width: min(300px, 82%);
  padding: 10px 34px 10px 12px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--clinic-ink);
}

.row.from-user .bubble {
  padding-right: 12px;
  background: #1c5966;
  border-color: #1c5966;
  color: #f4fbfb;
}

.bubble p {
  margin: 0 0 8px;
  font-size: 0.95rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.bubble p:last-of-type {
  margin-bottom: 0;
}

.speak {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--clinic-blue-deep);
}

.go {
  display: inline-block;
  margin-top: 8px;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  background: #287f91;
  color: #fff;
  font-weight: 650;
}

.typing {
  display: flex;
  gap: 5px;
  width: 64px;
  padding: 14px 12px;
}

.typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--clinic-blue);
  animation: blink 1s infinite ease-in-out;
}

.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 12px 8px;
}

.chips button {
  flex: 0 0 auto;
  max-width: 240px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--clinic-blue) 45%, var(--line));
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--clinic-blue-deep);
  font: inherit;
  font-size: 0.86rem;
  text-align: left;
}

.composer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 10px calc(10px + env(safe-area-inset-bottom));
  background: var(--surface);
  border-top: 1px solid var(--line);
}

.composer textarea {
  flex: 1;
  min-width: 0;
  max-height: 96px;
  resize: none;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--canvas);
  color: var(--clinic-ink);
  font: inherit;
  line-height: 1.35;
  pointer-events: auto;
}

.send {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: #287f91;
  color: #fff;
  font-size: 1.1rem;
}

.send:disabled {
  opacity: 0.45;
}

.mic-note {
  margin: 0;
  padding: 0 14px 10px;
  color: var(--muted);
  font-size: 0.8rem;
  background: var(--surface);
}

@media (min-width: 992px) {
  .pearl,
  .pearl.lifted,
  .panel {
    bottom: 24px;
  }

  .panel {
    height: min(640px, calc(100dvh - 48px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing span {
    animation: none;
  }
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
</style>
