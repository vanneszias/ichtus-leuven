export const curatedPhotos = {
  'community-garden-game': {
    height: 1067,
    src: '/photos/community-garden-game.webp',
    width: 1600,
  },
  'community-park': { height: 1067, src: '/photos/community-park.webp', width: 1600 },
  'community-park-game': {
    height: 1600,
    src: '/photos/community-park-game.webp',
    width: 1066,
  },
  'community-prayer': { height: 1067, src: '/photos/community-prayer.webp', width: 1600 },
  'community-steps': { height: 1600, src: '/photos/community-steps.webp', width: 1067 },
  'community-table': { height: 1600, src: '/photos/community-table.webp', width: 1067 },
} as const

export type CuratedPhotoKey = keyof typeof curatedPhotos

export const curatedPhotoOptions: { label: string; value: CuratedPhotoKey }[] = [
  { label: 'Spel in de tuin', value: 'community-garden-game' },
  { label: 'Studenten in het park', value: 'community-park' },
  { label: 'Spel in het park', value: 'community-park-game' },
  { label: 'Samen bidden', value: 'community-prayer' },
  { label: 'Gesprek op de trappen', value: 'community-steps' },
  { label: 'Samen rond de tafel', value: 'community-table' },
]
