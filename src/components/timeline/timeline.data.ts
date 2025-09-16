// src/components/timeline/timeline.data.ts
export interface CameraView {
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

export interface TimelineEvent {
  id: number
  date: string
  month: string
  title: string
  description: string
  image: string
  poster?: string
  side: 'left' | 'right'
  year?: number
  camera?: CameraView
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: 1,
    date: '12',
    month: 'Jan',
    title: 'Fukuoka Tower',
    description: "Tour de Fukuoka, panorama sur Momochi et la baie d'Hakata.",
    image:
      'https://pub-b4bb576b39e343d3a70283e9314cfcee.r2.dev/IMG_0022/main.mp4',
    side: 'left',
    camera: { center: [130.3519, 33.5951], zoom: 12 },
  },
  {
    id: 2,
    date: '03',
    month: 'Feb',
    title: 'Itoshima — Rochers mariés (Sakurai Futamigaura)',
    description:
      "Côte ouest d'Itoshima, torii sur plage et rochers reliés par une corde sacrée.",
    image:
      'https://pub-b4bb576b39e343d3a70283e9314cfcee.r2.dev/IMG_0030/main.mp4',
    side: 'right',
    camera: { center: [130.1522, 33.5933], zoom: 12 },
  },
  {
    id: 3,
    date: '21',
    month: 'Mar',
    title: 'Nanzoin (Grand Bouddha couché)',
    description:
      'Temple de Sasaguri, célèbre pour sa statue de Bouddha allongé monumentale.',
    image:
      'https://pub-b4bb576b39e343d3a70283e9314cfcee.r2.dev/IMG_0149/main.mp4',
    side: 'left',
    camera: { center: [130.544, 33.617], zoom: 12 },
  },
  {
    id: 4,
    date: '07',
    month: 'Apr',
    title: 'Nyoirinji — le “temple des grenouilles” (Ogori)',
    description:
      'Des centaines de grenouilles (kaeru) partout — ambiance fun et kitsch.',
    image:
      'https://pub-b4bb576b39e343d3a70283e9314cfcee.r2.dev/IMG_0043/main.mp4',
    side: 'right',
    camera: { center: [130.571, 33.448], zoom: 12 },
  },
  {
    id: 5,
    date: '15',
    month: 'Jun',
    title: 'Hōmanzan / Kamado-jinja',
    description:
      'Le mont Hōman domine Dazaifu — départ à Kamado-jinja, vues superbes au sommet.',
    image:
      'https://pub-b4bb576b39e343d3a70283e9314cfcee.r2.dev/IMG_0156/main.mp4',
    side: 'right',
    camera: { center: [130.5738, 33.5319], zoom: 12.5 },
  },
]

/* ====== OVERVIEW (villes + dates) ====== */
export type OverviewCity = {
  id: number
  title: string
  kanji: string
  subtitle?: string
  center: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
  dateISO?: string
}

/** Villes (coords approx) + dates fournies */
export const overviewCities: OverviewCity[] = [
  {
    id: 1,
    title: 'Kagoshima',
    kanji: '鹿児島',
    center: [130.558, 31.5966] as [number, number],
    zoom: 10,
  },
  {
    id: 2,
    title: 'Kumamoto',
    kanji: '熊本',
    center: [130.708, 32.8031] as [number, number],
    zoom: 10,
  },
  {
    id: 3,
    title: 'Fukuoka',
    kanji: '福岡',
    center: [130.4017, 33.5902] as [number, number],
    zoom: 10,
  },
  {
    id: 4,
    title: 'Yamaguchi',
    kanji: '山口',
    center: [131.4714, 34.1785] as [number, number],
    zoom: 10,
  },
  {
    id: 5,
    title: 'Hiroshima',
    kanji: '広島',
    center: [132.4553, 34.3853] as [number, number],
    zoom: 10,
  },
  {
    id: 6,
    title: 'Okayama',
    kanji: '岡山',
    center: [133.9344, 34.6551] as [number, number],
    zoom: 10,
  },
  {
    id: 7,
    title: 'Matsue',
    kanji: '松江',
    center: [133.0505, 35.4723] as [number, number],
    zoom: 10,
  },
  {
    id: 8,
    title: 'Izumo',
    kanji: '出雲',
    center: [132.7565, 35.3674] as [number, number],
    zoom: 10,
  },
  {
    id: 9,
    title: 'Tottori',
    kanji: '鳥取',
    center: [134.2383, 35.5011] as [number, number],
    zoom: 10,
  },
  {
    id: 10,
    title: 'Himeji',
    kanji: '姫路',
    center: [134.689, 34.8151] as [number, number],
    zoom: 10,
  },
  {
    id: 11,
    title: 'Kyoto',
    kanji: '京都',
    center: [135.7681, 35.0116] as [number, number],
    zoom: 10.5,
  },
  {
    id: 12,
    title: 'Osaka',
    kanji: '大阪',
    center: [135.5023, 34.6937] as [number, number],
    zoom: 10.5,
  },
  {
    id: 13,
    title: 'Wakayama',
    kanji: '和歌山',
    center: [135.1675, 34.2305] as [number, number],
    zoom: 10,
  },
  {
    id: 14,
    title: 'Tokushima',
    kanji: '徳島',
    center: [134.5593, 34.0703] as [number, number],
    zoom: 10,
  },
  {
    id: 15,
    title: 'Nagano',
    kanji: '長野',
    center: [138.181, 36.6486] as [number, number],
    zoom: 10,
  },
  {
    id: 16,
    title: 'Tsumago-juku',
    kanji: '妻籠宿',
    center: [137.5873, 35.5422] as [number, number],
    zoom: 12,
  },
  {
    id: 17,
    title: 'Fujikawaguchiko',
    kanji: '富士河口湖',
    center: [138.7567, 35.4973] as [number, number],
    zoom: 11,
  },
  {
    id: 18,
    title: 'Numazu',
    kanji: '沼津',
    center: [138.8636, 35.1047] as [number, number],
    zoom: 11,
  },
  {
    id: 19,
    title: 'Shuzenji',
    kanji: '修善寺',
    center: [138.9323, 34.9729] as [number, number],
    zoom: 12,
  },
  {
    id: 20,
    title: 'Tokyo',
    kanji: '東京',
    center: [139.6917, 35.6895] as [number, number],
    zoom: 10.5,
  },
]
