import { Metadata } from 'next'
import { MapboxOptions } from 'mapbox-gl'
import { Config, Line } from '@/lib/types'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  // Stadtbahn
  StuttgartStadtbahnU1: {
    name: 'U1',
    color: '#CD9C72',
    backgroundColor: '#764D2A',
    textColor: '#CD9C72',
    order: 0,
  },
  StuttgartStadtbahnU2: {
    name: 'U2',
    color: '#F58220',
    backgroundColor: '#854006',
    textColor: '#F58220',
    order: 1,
  },
  StuttgartStadtbahnU3: {
    name: 'U3',
    color: '#946341',
    backgroundColor: '#4A3220',
    textColor: '#946341',
    order: 2,
  },
  StuttgartStadtbahnU4: {
    name: 'U4',
    color: '#7967AE',
    backgroundColor: '#3B305A',
    textColor: '#7967AE',
    order: 3,
  },
  StuttgartStadtbahnU5: {
    name: 'U5',
    color: '#00BAF1',
    backgroundColor: '#005D78',
    textColor: '#00BAF1',
    order: 4,
  },
  StuttgartStadtbahnU6: {
    name: 'U6',
    color: '#ED008C',
    backgroundColor: '#760046',
    textColor: '#ED008C',
    order: 5,
  },
  StuttgartStadtbahnU7: {
    name: 'U7',
    color: '#0BB38D',
    backgroundColor: '#055A46',
    textColor: '#0BB38D',
    order: 6,
  },
  StuttgartStadtbahnU8: {
    name: 'U8',
    color: '#C0B678',
    backgroundColor: '#6A6232',
    textColor: '#C0B678',
    order: 7,
  },
  StuttgartStadtbahnU9: {
    name: 'U9',
    color: '#FFD403',
    backgroundColor: '#816B00',
    textColor: '#FFD403',
    order: 8,
  },
  StuttgartStadtbahnU12: {
    name: 'U12',
    color: '#85BBE5',
    backgroundColor: '#206295',
    textColor: '#85BBE5',
    order: 9,
  },
  StuttgartStadtbahnU13: {
    name: 'U13',
    color: '#F69EB2',
    backgroundColor: '#B91137',
    textColor: '#F69EB2',
    order: 10,
  },
  StuttgartStadtbahnU14: {
    name: 'U14',
    color: '#6ABD51',
    backgroundColor: '#336225',
    textColor: '#6ABD51',
    order: 11,
  },
  StuttgartStadtbahnU15: {
    name: 'U15',
    color: '#000099',
    backgroundColor: '#00004C',
    textColor: '#000099',
    order: 12,
  },
  StuttgartStadtbahnU16: {
    name: 'U16',
    color: '#C3BF2F',
    backgroundColor: '#626018',
    textColor: '#C3BF2F',
    order: 13,
  },
  StuttgartStadtbahnU19: {
    name: 'U19',
    color: '#FAB902',
    backgroundColor: '#7D5C01',
    textColor: '#FAB902',
    order: 14,
  },

  // Zahnradbahn
  StuttgartZahnradbahn10: {
    name: '10',
    color: '#FBBA00',
    backgroundColor: '#7E5D00',
    textColor: '#FBBA00',
    order: 15,
  },

  // Standseilbahn
  StuttgartStandseilbahn20: {
    name: '20',
    color: '#804000',
    backgroundColor: '#402000',
    textColor: '#804000',
    order: 16,
  },

  // S-Bahn
  StuttgartSBahnS1: {
    name: 'S1',
    color: '#58AE40',
    backgroundColor: '#2C5720',
    textColor: '#58AE40',
    order: 17,
  },
  StuttgartSBahnS2: {
    name: 'S2',
    color: '#DC022C',
    backgroundColor: '#6E0116',
    textColor: '#DC022C',
    order: 18,
  },
  StuttgartSBahnS3: {
    name: 'S3',
    color: '#F47A14',
    backgroundColor: '#7E3D06',
    textColor: '#F47A14',
    order: 19,
  },
  StuttgartSBahnS4: {
    name: 'S4',
    color: '#0165B2',
    backgroundColor: '#003259',
    textColor: '#0165B2',
    order: 20,
  },
  StuttgartSBahnS5: {
    name: 'S5',
    color: '#04AAE4',
    backgroundColor: '#025572',
    textColor: '#04AAE4',
    order: 21,
  },
  StuttgartSBahnS6: {
    name: 'S6',
    color: '#844C02',
    backgroundColor: '#422601',
    textColor: '#844C02',
    order: 22,
  },
  StuttgartSBahnS60: {
    name: 'S60',
    color: '#8D900E',
    backgroundColor: '#464807',
    textColor: '#8D900E',
    order: 23,
  },
  StuttgartSBahnS62: {
    name: 'S62',
    color: '#58AE40',
    backgroundColor: '#2C5720',
    textColor: '#58AE40',
    order: 24,
  },
}

export const METADATA: Metadata = {
  title: 'Stuttgart Bahn Memory',
  description:
    'Wie viele Stadtbahn- und S-Bahn-Stationen in Stuttgart können Sie auswendig nennen?',
  openGraph: {
    title: 'Stuttgart Bahn Memory',
    description:
      'Wie viele Stadtbahn- und S-Bahn-Stationen können Sie auswendig nennen? Spielen Sie das Stuttgart Bahn Memory und finden Sie es heraus!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/stuttgart',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  bounds: [
    [9.05, 48.68],
    [9.32, 48.88],
  ],
  maxBounds: [
    [8.60, 48.35],
    [9.80, 49.20],
  ],
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK = 'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

export const CITY_NAME = 'stuttgart'

export const LOCALE = 'de'

export const MAP_FROM_DATA = true

const config: Config = {
  GAUGE_COLORS: 'inverted',
  MAP_FROM_DATA,
  LOCALE,
  STRIPE_LINK,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  BEG_THRESHOLD,
}

export default config
