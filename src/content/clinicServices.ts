import {
  bandageOutline,
  chatbubbleEllipsesOutline,
  colorPaletteOutline,
  fitnessOutline,
  happyOutline,
  medicalOutline,
  scanOutline,
  sparklesOutline,
  timeOutline,
} from 'ionicons/icons'

export interface ClinicService {
  title: string
  description: string
  image: string
  imageAlt: string
  icon: string
  about: string
  expect: string[]
  visit: string
  comfort: string
}

export const CLINIC_SERVICES: ClinicService[] = [
  {
    title: 'Dental cleaning',
    description: 'A fresh start for your smile with a gentle, thorough clean.',
    image: 'dental-cleaning.jpg',
    imageAlt: 'Dental cleaning service',
    icon: sparklesOutline,
    about: 'A cleaning lifts away plaque and surface stains, then finishes with a polish so your teeth feel smooth. It is one of the simplest ways to keep a checkup comfortable.',
    expect: [
      'A look at your gums before we start',
      'Cleaning above the gumline and a polish',
      'A short talk about anything we noticed',
    ],
    visit: 'Usually 30–45 minutes',
    comfort: 'Gentle and routine',
  },
  {
    title: 'Dental fillings',
    description: 'Comfort-first repairs that help your natural smile shine.',
    image: 'dental-filling.jpg',
    imageAlt: 'Dental filling service',
    icon: bandageOutline,
    about: 'A filling repairs a small cavity so the tooth can keep doing its job. The area is numbed first, and the material is matched to the tooth as closely as we can.',
    expect: [
      'Numbing so the tooth stays comfortable',
      'Removing the decay and placing the filling',
      'A bite check before you leave',
    ],
    visit: 'Often one visit',
    comfort: 'The area is numb before we begin',
  },
  {
    title: 'Teeth whitening',
    description: 'A brighter look, thoughtfully tailored to your smile.',
    image: 'teeth-whitening.jpg',
    imageAlt: 'Teeth whitening service',
    icon: colorPaletteOutline,
    about: 'Whitening lifts everyday stains from coffee, tea, and time. We choose a shade with you so the result still looks like your smile.',
    expect: [
      'A shade check so we aim for a natural result',
      'Protection for your gums, then the whitening gel',
      'A pause whenever you want one',
    ],
    visit: 'About an hour in the chair',
    comfort: 'You can tell us to pause at any time',
  },
  {
    title: 'Braces & alignment',
    description: 'Personalized options for a smile that feels like you.',
    image: 'braces-and-alignment.jpg',
    imageAlt: 'Braces and alignment service',
    icon: fitnessOutline,
    about: 'Alignment care gently guides teeth into a position that feels and looks more like you. We talk through braces and other options before anything starts. The try-on in the app is only a preview.',
    expect: [
      'Photos and a look at your bite',
      'A plain-language plan with your options',
      'A fitting only when you are ready',
    ],
    visit: 'The planning visit is unhurried',
    comfort: 'Each step is explained before it happens',
  },
  {
    title: 'Tooth extraction',
    description: 'Considerate care and clear support at every step.',
    image: 'tooth-extraction.jpg',
    imageAlt: 'Tooth extraction service',
    icon: medicalOutline,
    about: 'When a tooth cannot be saved comfortably, removal can be the kinder option. You will know how the visit will feel, and how to look after the area afterward.',
    expect: [
      'Numbing and a careful removal',
      'Time to rest before you head home',
      'Clear after-care you can follow that day',
    ],
    visit: 'Most simple removals are one visit',
    comfort: 'Expect pressure, not sharp pain',
  },
  {
    title: 'Root canal care',
    description: 'Relief-focused treatment to help protect your tooth.',
    image: 'root-canal.jpg',
    imageAlt: 'Root canal service',
    icon: timeOutline,
    about: 'Root canal care treats the inside of a tooth that is aching or infected, so you can keep the tooth instead of losing it.',
    expect: [
      'Numbing, then cleaning the inside of the tooth',
      'Sealing the tooth before you leave',
      'A follow-up if a crown is the next step',
    ],
    visit: 'Often one longer visit',
    comfort: 'The tooth is numb for the procedure',
  },
  {
    title: 'Dental X-rays',
    description: 'A clearer picture to guide confident, informed care.',
    image: 'dental-x-ray.jpeg',
    imageAlt: 'Dental X-ray service',
    icon: scanOutline,
    about: 'X-rays show what a mirror cannot, including the spaces between teeth and under the gums. They help us recommend only the care you actually need.',
    expect: [
      'A protective apron and a few still moments',
      'Images we look at together',
      'A recommendation based on what they show',
    ],
    visit: 'A few minutes',
    comfort: 'Quick, and every picture is explained',
  },
  {
    title: 'Family dentistry',
    description: 'Welcoming check-ups for the whole family, big and small.',
    image: 'family-dentistry.jpg',
    imageAlt: 'Family dentistry service',
    icon: happyOutline,
    about: 'Checkups for children and adults, kept at an easy pace. First-timers get extra time, and anyone can ask what is coming next.',
    expect: [
      'A gentle exam for each person',
      'Cleaning when it is due',
      'Time for questions before you go',
    ],
    visit: 'Planned around your family',
    comfort: 'Unhurried, especially for first visits',
  },
  {
    title: 'Dental consultation',
    description: 'A relaxed conversation to talk through your questions and options.',
    image: 'dental-consultation.jpg',
    imageAlt: 'Dental consultation service',
    icon: chatbubbleEllipsesOutline,
    about: 'A consultation is a conversation first. Bring the questions you have been saving, and leave with options written in plain language.',
    expect: [
      'Time to talk before anyone picks up an instrument',
      'A look at the area you are asking about',
      'Choices and tradeoffs, with nothing started unless you want it',
    ],
    visit: 'About 20–40 minutes',
    comfort: 'Nothing is decided for you',
  },
]
