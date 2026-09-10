import type { Page } from '@/payload-types'

type ContentBlock = Extract<Page['layout'][number], { blockType: 'content' }>

const appearance = (background: 'white' | 'yellow' = 'white') => ({
  alignment: 'left' as const,
  background,
  headingSize: 'large' as const,
  spacing: 'normal' as const,
  width: 'standard' as const,
})

function richText(...paragraphs: string[]): ContentBlock['body'] {
  return {
    root: {
      type: 'root',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as ContentBlock['body']
}

export const privacyLayoutNL: Page['layout'] = [
  {
    blockType: 'hero',
    heading: 'Privacy & cookies.',
    highlight: 'Privacy',
    intro: 'Wat we van je bewaren, waarom we dat doen en welke keuzes je hebt.',
    artStyle: 'none',
    accent: 'green',
    appearance: { ...appearance(), spacing: 'spacious' },
  },
  {
    blockType: 'content',
    heading: 'Ichtus Leuven beheert je gegevens.',
    body: richText(
      'Ichtus Leuven gebruikt persoonsgegevens alleen om de studentengemeenschap en haar activiteiten te organiseren. Voor vragen of verzoeken kun je mailen naar leuven@ichtus.be.',
      'We vragen alleen gegevens die voor dat doel nodig zijn en verkopen je gegevens nooit.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
  {
    blockType: 'content',
    heading: 'Naam, e-mail en je inschrijving.',
    body: richText(
      'Wanneer je je inschrijft voor een activiteit bewaren we je naam, e-mailadres, inschrijvingsstatus en de technische gegevens die nodig zijn voor bevestiging of annulering. We bewaren geen adres, woonplaats of locatiegegevens.',
      'We gebruiken die gegevens om je inschrijving te beheren, je praktische berichten te sturen en een eventuele wachtlijst correct af te handelen. Registratiegegevens worden twaalf maanden na de activiteit geanonimiseerd.',
    ),
    layout: 'split',
    appearance: appearance('yellow'),
  },
  {
    blockType: 'content',
    heading: 'Alleen waar het nodig is.',
    body: richText(
      'Bevoegde vrijwilligers en technische dienstverleners voor hosting en e-mail kunnen gegevens verwerken wanneer dat nodig is. Zij mogen die gegevens niet voor hun eigen doeleinden gebruiken.',
      'We beperken wie toegang heeft. De geheime code in je annuleringslink bewaren we niet in leesbare vorm. Gegevens voor bevestigings- en annuleringsmails worden versleuteld bewaard zolang ze nodig zijn om een niet-bezorgde mail opnieuw te versturen.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
  {
    blockType: 'content',
    heading: 'Geen advertentiecookies.',
    body: richText(
      'De publieke website gebruikt geen advertentie- of trackingcookies. Technisch noodzakelijke opslag kan worden gebruikt voor beveiliging, het beheergedeelte en functies die je zelf activeert.',
      'We kunnen anonieme bezoekersstatistieken bijhouden met een zelfgehost analysetool, zonder cookies en zonder individuele profielen. Zo zien we bijvoorbeeld wanneer de site bezocht wordt; die gegevens blijven op onze eigen servers en zijn niet tot jou herleidbaar. Voegen we ooit niet-noodzakelijke cookies toe, dan passen we dit beleid aan en vragen we eerst toestemming waar dat verplicht is.',
    ),
    layout: 'split',
    appearance: appearance('yellow'),
  },
  {
    blockType: 'content',
    heading: 'Je houdt controle.',
    body: richText(
      'Je kunt vragen om inzage, correctie, verwijdering, beperking of overdracht van je persoonsgegevens en bezwaar maken tegen bepaalde verwerkingen. Mail daarvoor naar leuven@ichtus.be.',
      'Je kunt ook een klacht indienen bij de Belgische Gegevensbeschermingsautoriteit. We werken dit beleid bij wanneer onze werkwijze verandert.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
]

export const privacyLayoutEN: Page['layout'] = [
  {
    blockType: 'hero',
    heading: 'Privacy & cookies.',
    highlight: 'Privacy',
    intro: 'What we keep, why we keep it and the choices you have.',
    artStyle: 'none',
    accent: 'green',
    appearance: { ...appearance(), spacing: 'spacious' },
  },
  {
    blockType: 'content',
    heading: 'Ichtus Leuven manages your data.',
    body: richText(
      'Ichtus Leuven uses personal data only to organize the student community and its activities. Email leuven@ichtus.be with questions or requests.',
      'We only ask for information needed for that purpose and never sell your data.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
  {
    blockType: 'content',
    heading: 'Your name, email and registration.',
    body: richText(
      'When you register for an activity, we retain your name, email address, registration status and the technical data needed to confirm or cancel your place. We do not store your address, city or location data.',
      'We use this information to manage your registration, send practical messages and operate any waitlist correctly. Registration data is anonymized twelve months after the event.',
    ),
    layout: 'split',
    appearance: appearance('yellow'),
  },
  {
    blockType: 'content',
    heading: 'Only where necessary.',
    body: richText(
      'Authorized volunteers and technical providers for hosting and email may process data where necessary. They may not use that data for their own purposes.',
      'We limit who can access your data. We do not store the secret code in your cancellation link in readable form. Information used for confirmation and cancellation emails remains encrypted for as long as we may need to resend a message that was not delivered.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
  {
    blockType: 'content',
    heading: 'No advertising cookies.',
    body: richText(
      'The public website does not use advertising or tracking cookies. Technically necessary storage may be used for security, the administration area and features you actively use.',
      'We may keep anonymous visitor statistics using a self-hosted analytics tool, without cookies and without individual profiles. This tells us, for example, when the site is visited; that data stays on our own servers and cannot be traced back to you. If we ever add non-essential cookies, we will update this policy and ask for consent first where required.',
    ),
    layout: 'split',
    appearance: appearance('yellow'),
  },
  {
    blockType: 'content',
    heading: 'You stay in control.',
    body: richText(
      'You may request access, correction, deletion, restriction or transfer of your personal data and object to certain processing. Email leuven@ichtus.be to do so.',
      'You may also complain to the Belgian Data Protection Authority. We update this policy whenever our practices change.',
    ),
    layout: 'split',
    appearance: appearance(),
  },
]
