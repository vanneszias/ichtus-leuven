import type { Page } from '@/payload-types'

type ContentBlock = Extract<Page['layout'][number], { blockType: 'content' }>
type InlineContent = string | { text: string; url: string }
type RichTextBlock = { list: string[] } | { paragraph: InlineContent[] }

const appearance = (
  background: 'white' | 'blue' | 'yellow' | 'pink' | 'green' = 'white',
  anchor?: string,
) => ({
  alignment: 'left' as const,
  anchor,
  background,
  headingSize: 'large' as const,
  spacing: 'normal' as const,
  width: 'standard' as const,
})

const link = (text: string, url: string): InlineContent => ({ text, url })

function textNode(text: string) {
  return { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }
}

function richText(...blocks: RichTextBlock[]): ContentBlock['body'] {
  const children = blocks.map((block) => {
    if ('list' in block) {
      return {
        type: 'list',
        children: block.list.map((text, index) => ({
          type: 'listitem',
          children: [textNode(text)],
          direction: 'ltr',
          format: '',
          indent: 0,
          value: index + 1,
          version: 1,
        })),
        direction: 'ltr',
        format: '',
        indent: 0,
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        version: 1,
      }
    }

    return {
      type: 'paragraph',
      children: block.paragraph.map((part) => {
        if (typeof part === 'string') return textNode(part)
        return {
          type: 'link',
          children: [textNode(part.text)],
          direction: 'ltr',
          fields: { linkType: 'custom', newTab: true, url: part.url },
          format: '',
          indent: 0,
          version: 3,
        }
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    }
  })

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  } as unknown as ContentBlock['body']
}

const beliefsNL = [
  'De eenheid van de Vader, de Zoon en de Heilige Geest in God.',
  'De soevereiniteit van God in schepping, openbaring, verlossing en laatste oordeel.',
  'De goddelijke inspiratie en volkomen betrouwbaarheid van de Heilige Schrift, zoals zij oorspronkelijk aan ons gegeven is, en haar gezag in alle zaken van geloof en gedrag.',
  'De totale zondigheid en schuld van alle mensen sinds de zondeval, waardoor zij aan Gods toorn en veroordeling onderworpen zijn.',
  'Verlossing van schuld, straf, heerschappij en smet van de zonde, alleen door het plaatsvervangend sterven van Jezus Christus, de mensgeworden Zoon van God.',
  'De lichamelijke opstanding van de Heer Jezus Christus uit de dood en zijn hemelvaart naar de rechterhand van de Vader.',
  'De aanwezigheid en kracht van de Heilige Geest in het werk van de wedergeboorte.',
  'De rechtvaardiging van de zondaar door Gods genade, door het geloof alleen.',
  'De inwoning en het werk van de Heilige Geest in de gelovige.',
  'De ene universele gemeente, het lichaam van Christus, waartoe alle ware gelovigen behoren.',
  'De verwachting van de persoonlijke terugkomst van de Heer Jezus Christus.',
]

const beliefsEN = [
  'The unity of the Father, the Son and the Holy Spirit in the Godhead.',
  'The sovereignty of God in creation, revelation, redemption and final judgement.',
  'The divine inspiration and entire trustworthiness of Holy Scripture, as originally given, and its supreme authority in all matters of faith and conduct.',
  'The universal sinfulness and guilt of all people since the fall, rendering them subject to God’s wrath and condemnation.',
  'Redemption from the guilt, penalty, dominion and pollution of sin solely through the sacrificial death of the Lord Jesus Christ, the incarnate Son of God.',
  'The bodily resurrection of the Lord Jesus Christ from the dead and his ascension to the right hand of God the Father.',
  'The presence and power of the Holy Spirit in the work of regeneration.',
  'The justification of sinners by the grace of God through faith alone.',
  'The indwelling and work of the Holy Spirit in the believer.',
  'The one holy universal Church, which is the Body of Christ and to which all true believers belong.',
  'The personal return of the Lord Jesus Christ.',
]

export function aboutLayout(
  locale: 'nl' | 'en',
  options: { photos?: boolean } = {},
): Page['layout'] {
  const nl = locale === 'nl'

  return [
    {
      blockType: 'hero',
      heading: nl ? 'Over Ichtus Leuven.' : 'About Ichtus Leuven.',
      highlight: 'Ichtus Leuven.',
      intro: nl
        ? 'Een protestants-evangelische vereniging door en voor studenten, met ruimte voor geloof, vragen, vriendschap en het leven in Leuven.'
        : 'A Protestant Evangelical association run by and for students, with room for faith, questions, friendship and life in Leuven.',
      artStyle: options.photos === false ? 'none' : 'image',
      curatedPhoto: options.photos === false ? undefined : 'community-table',
      curatedPhotoAlt:
        options.photos === false
          ? undefined
          : nl
            ? 'Vier studenten praten samen rond een tafel vol eten.'
            : 'Four students talk together around a table full of food.',
      imagePosition: 'right',
      accent: 'pink',
      appearance: { ...appearance(), spacing: 'spacious' },
    },
    {
      blockType: 'content',
      heading: nl ? 'Geloof midden in het studentenleven.' : 'Faith at the heart of student life.',
      body: nl
        ? richText(
            {
              paragraph: [
                'Ichtus Leuven biedt vanuit het christelijk geloof een plek waar studenten van universiteit en hogeschool elkaar ontmoeten. We lezen de Bijbel, bidden en maken ruimte voor eerlijke vragen over geloof, twijfel, studie en samenleving.',
              ],
            },
            {
              paragraph: [
                'We willen van God en elkaar leren, zodat we als gefundeerde en kritische jongvolwassenen actief in de samenleving kunnen staan.',
              ],
            },
          )
        : richText(
            {
              paragraph: [
                'Rooted in Christian faith, Ichtus Leuven offers a place where university and college students can meet. We read the Bible, pray and make room for honest questions about faith, doubt, study and society.',
              ],
            },
            {
              paragraph: [
                'We want to learn from God and one another so that we can engage thoughtfully and confidently with the world around us.',
              ],
            },
          ),
      layout: 'split',
      appearance: appearance('white', nl ? 'wie-we-zijn' : 'who-we-are'),
    },
    {
      blockType: 'values',
      items: (nl
        ? ['open gemeenschap', 'tot eer van God', 'relevant voor studenten']
        : ['an open community', 'honouring God', 'relevant to students']
      ).map((label) => ({ label })),
      appearance: appearance('blue'),
    },
    {
      blockType: 'infoCards',
      heading: nl ? 'Elke woensdag een andere avond.' : 'A different evening every Wednesday.',
      intro: nl
        ? 'Kringen, gemeenschappelijke avonden en WILD wisselen elkaar af. Zo is er ruimte voor verdieping én ontspanning.'
        : 'Small groups, shared evenings and WILD alternate, making room for both depth and relaxation.',
      items: nl
        ? [
            {
              label: 'Kringavond',
              value: 'Het hart van Ichtus Leuven',
              detail:
                'Met maximaal tien studenten trek je een jaar lang op. Om de twee weken eet je samen en doe je een Bijbelstudie rond het jaarthema.',
            },
            {
              label: 'Gemeenschappelijke avond',
              value: 'Met de hele groep',
              detail:
                'Elke maand eten we samen, maken we ruimte voor aanbidding en verdiepen we het jaarthema met een spreker, debat of workshop.',
            },
            {
              label: 'WILD',
              value: 'Samen iets leuks doen',
              detail:
                'Elke maand is er een ontspannen activiteit, bijvoorbeeld bowlen, schaatsen of de Ichtus Leuven Quiz.',
            },
          ]
        : [
            {
              label: 'Small group',
              value: 'The heart of Ichtus Leuven',
              detail:
                'You spend a year with a group of no more than ten students. Every other week you share a meal and study the Bible around the annual theme.',
            },
            {
              label: 'Shared evening',
              value: 'The whole group together',
              detail:
                'Once a month we eat together, make room for worship and explore our annual theme through a speaker, debate or workshop.',
            },
            {
              label: 'WILD',
              value: 'Doing something fun together',
              detail:
                'Once a month we plan a relaxed activity, such as bowling, ice skating or the Ichtus Leuven Quiz.',
            },
          ],
      appearance: appearance('yellow', nl ? 'wat-we-doen' : 'what-we-do'),
    },
    {
      blockType: 'statement',
      heading: nl ? 'Inhoud. En ontmoeting.' : 'Substance and connection.',
      highlight: nl ? 'En ontmoeting.' : 'and connection.',
      body: nl
        ? 'Na het programma praten we verder, leren we nieuwe mensen kennen en sluiten we samen af op café.'
        : 'After the programme, we continue the conversation, meet new people and end the evening together at a local pub.',
      accent: 'pink',
      appearance: appearance('pink'),
    },
    {
      blockType: 'content',
      heading: nl ? 'Dit geloven we.' : 'What we believe.',
      body: nl
        ? richText(
            {
              paragraph: [
                'We delen de geloofsbasis van ',
                link('IFES International', 'https://ifesworld.org/en/beliefs/'),
                '. We geloven in:',
              ],
            },
            { list: beliefsNL },
          )
        : richText(
            {
              paragraph: [
                'We share the basis of faith of ',
                link('IFES International', 'https://ifesworld.org/en/beliefs/'),
                '. We believe in:',
              ],
            },
            { list: beliefsEN },
          ),
      layout: 'centered',
      appearance: {
        ...appearance('white', nl ? 'geloofsbasis' : 'basis-of-faith'),
        width: 'narrow',
      },
    },
    {
      blockType: 'networkLinks',
      heading: nl
        ? 'Verbonden in Vlaanderen en wereldwijd.'
        : 'Connected across Flanders and worldwide.',
      intro: nl
        ? 'Ichtus Leuven is een lokale studentengroep binnen Ichtus Vlaanderen en de wereldwijde IFES-beweging.'
        : 'Ichtus Leuven is a local student community within Ichtus Vlaanderen and the worldwide IFES movement.',
      items: [
        { name: 'Ichtus Vlaanderen', url: 'https://ichtus.be/', logo: 'ichtus-vlaanderen' },
        {
          name: 'Ichtus Brussels',
          url: 'https://linktr.ee/ichtusbrussels',
          logo: 'ichtus-brussels',
        },
        { name: 'Ichtus Antwerpen', url: 'https://ichtusantwerpen.com/', logo: 'ichtus-antwerpen' },
        { name: 'Ichtus Gent', url: 'https://ichtusgent.be/', logo: 'ichtus-gent' },
        {
          name: 'Ichtus Hasselt',
          url: 'https://ichtushasselt.wordpress.com/',
          logo: 'ichtus-hasselt',
        },
        { name: 'IFES', url: 'https://ifesworld.org/en/', logo: 'ifes' },
      ],
      appearance: appearance('green', nl ? 'netwerk' : 'network'),
    },
    {
      blockType: 'callToAction',
      heading: nl ? 'Zin om kennis te maken?' : 'Want to meet us?',
      body: nl
        ? 'Bekijk wanneer we samenkomen of stuur ons een bericht. Je hoeft niemand te kennen en je mag gewoon eens komen kijken.'
        : 'See when we are meeting or send us a message. You do not need to know anyone, and you are welcome to simply come and see.',
      primaryLink: {
        label: nl ? 'Bekijk de agenda' : 'View the calendar',
        type: 'external',
        url: nl ? '/nl/#agenda' : '/en/#calendar',
      },
      secondaryLink: {
        label: nl ? 'Stuur een e-mail' : 'Send an email',
        type: 'external',
        url: 'mailto:leuven@ichtus.be',
      },
      accent: 'blue',
      appearance: appearance('blue'),
    },
  ]
}
