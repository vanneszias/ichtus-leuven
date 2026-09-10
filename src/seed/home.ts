import type { SiteLink } from '@/lib/links'
import type { Page } from '@/payload-types'

type EventsListSeed = Extract<Page['layout'][number], { blockType: 'eventsList' }> & {
  emptyLink?: SiteLink
}

function eventsList(block: EventsListSeed): Page['layout'][number] {
  return block
}

const appearance = (
  background: 'white' | 'blue' | 'yellow' | 'pink' | 'green',
  anchor?: string,
) => ({
  alignment: 'left' as const,
  anchor,
  background,
  headingSize: 'large' as const,
  spacing: 'normal' as const,
  width: 'standard' as const,
})

export const homeLayoutNL: Page['layout'] = [
  {
    blockType: 'hero',
    heading: 'Samen geloven.\nVoluit student.',
    highlight: 'Voluit student.',
    intro:
      'Ichtus Leuven is een protestants-evangelische vereniging door en voor studenten: een open gemeenschap tot eer van God, midden in het Leuvense studentenleven.',
    primaryLink: { label: 'Bekijk de agenda', type: 'external', url: '#agenda', newTab: false },
    secondaryLink: {
      label: 'Wat kun je verwachten?',
      type: 'external',
      url: '#eerste-keer',
      newTab: false,
    },
    artStyle: 'none',
    imagePosition: 'right',
    accent: 'pink',
    appearance: { ...appearance('white'), spacing: 'spacious' },
  },
  {
    blockType: 'infoCards',
    heading: 'Zo ziet je eerste avond eruit.',
    intro:
      'Elke woensdagavond komen we samen. Je kunt alleen komen of iemand meenemen. Kijk voor je vertrekt in de agenda: daar staan het juiste uur, de locatie en eventuele inschrijving.',
    items: [
      { label: 'Wanneer', value: 'Woensdagavond', detail: 'Het actuele uur staat in de agenda' },
      { label: 'Waar', value: 'Leuven', detail: 'De actuele locatie staat bij de activiteit' },
      {
        label: 'Voor wie',
        value: 'Studenten',
        detail: 'Met geloof, twijfel, vragen of nieuwsgierigheid',
      },
    ],
    link: {
      label: 'Bekijk de eerstvolgende avond',
      type: 'external',
      url: '#agenda',
      newTab: false,
    },
    appearance: appearance('yellow', 'eerste-keer'),
  },
  {
    blockType: 'photoStory',
    images: [
      { photo: 'community-park', alt: 'Studenten zitten in groepjes samen in een Leuvens park.' },
      { photo: 'community-park-game', alt: 'Studenten spelen samen een balspel in het park.' },
      { photo: 'community-table', alt: 'Studenten praten samen rond een tafel vol eten.' },
      { photo: 'community-prayer', alt: 'Studenten staan samen in een kring en bidden.' },
      { photo: 'community-steps', alt: 'Studenten eten en praten samen op de trappen.' },
      { photo: 'community-garden-game', alt: 'Studenten lachen tijdens een spel in de tuin.' },
    ],
    layout: 'showroom',
    appearance: { ...appearance('white', 'over-ons'), spacing: 'compact', width: 'wide' },
  },
  eventsList({
    blockType: 'eventsList',
    heading: 'De komende activiteiten.',
    intro:
      'Hier vind je onze gezamenlijke avonden, kringen en andere plannen. Bij elke activiteit staat waar je moet zijn.',
    emptyMessage:
      'Er staat nu niets gepland. Stuur ons gerust een bericht om te horen wanneer we weer samenkomen.',
    emptyLink: {
      label: 'Stuur een e-mail',
      type: 'external',
      url: 'mailto:leuven@ichtus.be',
      newTab: false,
    },
    limit: 4,
    selection: 'upcoming',
    appearance: appearance('white', 'agenda'),
  }),
  {
    blockType: 'statement',
    heading: 'Christelijk, open en nieuwsgierig.',
    highlight: 'open en nieuwsgierig.',
    body: 'Het geloof in Jezus staat centraal. Tegelijk is er volop ruimte voor vragen, twijfel en nieuwsgierigheid. We willen van God en elkaar leren en als kritische jongvolwassenen midden in de samenleving staan.',
    link: { label: 'Lees meer over ons', type: 'external', url: '/nl/over-ons', newTab: false },
    accent: 'pink',
    appearance: appearance('pink'),
  },
  {
    blockType: 'faq',
    heading: 'Je eerste keer bij Ichtus.',
    intro:
      'Hier vind je de praktische antwoorden. Staat je vraag er niet bij, stuur ons dan gerust een bericht.',
    items: [
      {
        question: 'Moet ik christen zijn om te komen?',
        answer:
          'Nee. Geloof staat centraal, maar vragen, twijfel en nieuwsgierigheid horen daar voor ons helemaal bij.',
      },
      {
        question: 'Kan ik alleen komen?',
        answer:
          'Zeker. Nieuwe mensen zijn welkom. Laat vooraf iets weten als je het fijn vindt dat iemand je bij aankomst opvangt.',
      },
      {
        question: 'Waar vind ik de locatie?',
        answer: 'De actuele locatie en het tijdstip staan bij iedere activiteit in de agenda.',
      },
      {
        question: 'Wat gebeurt er op een avond?',
        answer:
          'Dat verschilt per week: samen eten, een gesprek of spreker, zingen, een kleine kring of gewoon tijd om elkaar te ontmoeten.',
      },
    ],
    appearance: appearance('white'),
  },
  {
    blockType: 'callToAction',
    heading: 'Zin om kennis te maken?',
    body: 'Bekijk wanneer we samenkomen of stuur ons een bericht. Je hoeft niemand te kennen en je mag gewoon eens komen kijken.',
    primaryLink: {
      label: 'Stuur een e-mail',
      type: 'external',
      url: 'mailto:leuven@ichtus.be',
      newTab: false,
    },
    secondaryLink: {
      label: 'Bekijk Instagram',
      type: 'external',
      url: 'https://www.instagram.com/ichtusleuven/',
      newTab: true,
    },
    accent: 'blue',
    appearance: appearance('blue', 'kom-mee'),
  },
]

export const homeLayoutEN: Page['layout'] = [
  {
    blockType: 'hero',
    heading: 'Faith together.\nStudent life to the full.',
    highlight: 'Student life to the full.',
    intro:
      'Ichtus Leuven is a Protestant Evangelical association run by and for students: an open community honouring God in the heart of student life in Leuven.',
    primaryLink: { label: 'View the calendar', type: 'external', url: '#calendar', newTab: false },
    secondaryLink: {
      label: 'What can I expect?',
      type: 'external',
      url: '#first-time',
      newTab: false,
    },
    artStyle: 'none',
    imagePosition: 'right',
    accent: 'pink',
    appearance: { ...appearance('white'), spacing: 'spacious' },
  },
  {
    blockType: 'infoCards',
    heading: 'What to expect on your first evening.',
    intro:
      'We meet every Wednesday evening. Come on your own or bring someone with you. Before you set off, check the calendar for the correct time, location and any registration details.',
    items: [
      {
        label: 'When',
        value: 'Wednesday evening',
        detail: 'The current time is listed in the calendar',
      },
      { label: 'Where', value: 'Leuven', detail: 'The current location is listed with each event' },
      {
        label: 'Who',
        value: 'Students',
        detail: 'Whether you come with faith, doubt, questions or curiosity',
      },
    ],
    link: { label: 'View the next evening', type: 'external', url: '#calendar', newTab: false },
    appearance: appearance('yellow', 'first-time'),
  },
  {
    blockType: 'photoStory',
    images: [
      {
        photo: 'community-park',
        alt: 'Students sit together in small groups in a park in Leuven.',
      },
      { photo: 'community-park-game', alt: 'Students play a ball game together in the park.' },
      { photo: 'community-table', alt: 'Students talk together around a table full of food.' },
      { photo: 'community-prayer', alt: 'Students stand together in a circle and pray.' },
      { photo: 'community-steps', alt: 'Students eat and talk together on the steps.' },
      { photo: 'community-garden-game', alt: 'Students laugh during a game in the garden.' },
    ],
    layout: 'showroom',
    appearance: { ...appearance('white', 'about-us'), spacing: 'compact', width: 'wide' },
  },
  eventsList({
    blockType: 'eventsList',
    heading: 'Upcoming activities.',
    intro:
      'Find our shared evenings, small groups and other plans here. Each event tells you where to go.',
    emptyMessage:
      'Nothing is scheduled right now. Send us a message to ask when we will meet again.',
    emptyLink: {
      label: 'Send an email',
      type: 'external',
      url: 'mailto:leuven@ichtus.be',
      newTab: false,
    },
    limit: 4,
    selection: 'upcoming',
    appearance: appearance('white', 'calendar'),
  }),
  {
    blockType: 'statement',
    heading: 'Christian, open and curious.',
    highlight: 'open and curious.',
    body: 'Faith in Jesus is at the centre. At the same time, there is plenty of room for questions, doubt and curiosity. We want to learn from God and one another and engage thoughtfully with society.',
    link: { label: 'More about us', type: 'external', url: '/en/about-us', newTab: false },
    accent: 'pink',
    appearance: appearance('pink'),
  },
  {
    blockType: 'faq',
    heading: 'Before your first visit.',
    intro:
      'These answers cover the practical details. If your question is not here, feel free to send us a message.',
    items: [
      {
        question: 'Do I need to be a Christian to come?',
        answer: 'No. Faith is central, but questions, doubt and curiosity are completely welcome.',
      },
      {
        question: 'Can I come by myself?',
        answer:
          'Absolutely. New people are welcome. Message us beforehand if you would like someone to meet you when you arrive.',
      },
      {
        question: 'Where can I find the location?',
        answer: 'The current location and time are listed with every activity in the calendar.',
      },
      {
        question: 'What happens during an evening?',
        answer:
          'It changes each week: sharing food, a conversation or speaker, singing, a small group, or simply time to meet one another.',
      },
    ],
    appearance: appearance('white'),
  },
  {
    blockType: 'callToAction',
    heading: 'Want to meet us?',
    body: 'See when we are meeting or send us a message. You do not need to know anyone, and you are welcome to simply come and see.',
    primaryLink: {
      label: 'Send an email',
      type: 'external',
      url: 'mailto:leuven@ichtus.be',
      newTab: false,
    },
    secondaryLink: {
      label: 'View Instagram',
      type: 'external',
      url: 'https://www.instagram.com/ichtusleuven/',
      newTab: true,
    },
    accent: 'blue',
    appearance: appearance('blue', 'join-us'),
  },
]
