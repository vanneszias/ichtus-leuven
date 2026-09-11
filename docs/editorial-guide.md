# Editorial guide

## Audience and voice

Write first for a Leuven student considering Ichtus for the first time. State that Ichtus is Christian without assuming Christian knowledge. Use plain, direct language and explicitly make room for questions, doubt and curiosity.

Dutch is the default locale. English is not a summary: every published Page, Event, link label, image description and metadata field needs natural English copy.

## Page Patterns

- Hero: one clear promise, a short introduction and at most two actions. Prefer an authentic community photograph when a strong one is available.
- Practical information: facts a newcomer needs before arriving. Labels describe the fact; they are not decorative numbers.
- Content: explain one idea. Split long stories into separate patterns rather than creating a wall of text.
- Events: use upcoming mode unless the editorial reason for a manual selection is documented.
- Calendar: the browsable month and list view of every published Event. One Page carries it, and that Page is reached at `/nl/kalender` and `/en/calendar`. An activity appears in the calendar whether or not it has a page of its own; only the ones with a destination become links.
- Statement: one decisive idea. Do not stack multiple loud statements on one Page. An optional link may point to the page where that idea is explored, such as the about page.
- Quote: use exact, approved words and name the speaker when consent permits.
- Photography: show real tables, food, people, Leuven and student spaces. Avoid generic stock imagery.
- Invitation: end with the most useful next action, normally an Event or direct contact route.
- FAQ: answer actual newcomer concerns; do not use it as overflow content.

Background, spacing and width variants are guardrails, not decoration. Preview both desktop and mobile after changing a Page.

## Photography

- Record the source and capture date.
- Confirm publication consent whenever a person is recognizable.
- Write localized alternative text describing the image's purpose, not every visible detail.
- Upload WebP or AVIF where possible, normally no wider than 2000 pixels.
- Avoid images of private prayer, pastoral conversations or minors unless approval is explicit and documented.
- Remove an image promptly when consent is withdrawn and replace all usages in both locales.

## Events and registration

Keep time, location, signup policy and closure copy current. Before unpublishing an Event with active Registrations, confirm that attendees should receive cancellation mail. Never place attendee information in Page or Event content.

### Where an activity sends people for more information

Every Event answers this with its **Meer info** setting.

- **Eigen pagina op deze website** gives the activity a page at `/nl/activities/<adres>`, with its own address per locale. Leave the address empty and it is derived from the title; edit it before publishing if the derived one reads poorly, because changing it later breaks links people already have. Registration through this website needs this option, since the signup form lives on that page.
- **Externe pagina** points the agenda and the calendar at a full `https://` address elsewhere. The activity then has no page here and is left out of the sitemap.
- **Geen pagina** shows the activity in the agenda and the calendar without any link. Use it for recurring evenings that need no explanation of their own.

Activities synchronized from Google Calendar arrive with their own page and a derived address. Give the ones that deserve one a real summary and photograph; set the rest to **Geen pagina**.

The calendar speaks Dutch, so a synchronized activity starts out with that same Dutch title in the English locale: it is listed on the English site from the first synchronization rather than missing from it. Rewrite the title in English on the English tab and the synchronization leaves your wording alone, even when the activity is renamed in Google Calendar.

## The calendar page

The calendar lives on an ordinary Page so it can carry an introduction and sit
alongside other patterns. A newly seeded database already has it, published in
both locales at `/nl/kalender` and `/en/calendar`; its heading and introduction
are editable like any other Page. It is not in the navigation, so add a
navigation link to it in Site Settings.

An environment that already holds content is never seeded, so staging and
production need the Page created once by hand:

1. Add a Page with the Dutch slug `kalender` and the English slug `calendar`.
2. Give it a title and, in the layout, one **Kalender** pattern with a heading and an optional introduction.
3. Publish it in both locales and link it from the navigation in Site Settings.
4. Run `pnpm pull:prod` afterwards so the starter content in the repository matches what is published.

The calendar shows every published Event from twelve months back to twenty-four
months ahead, so a visitor can page through the year without the page carrying
the whole archive.
