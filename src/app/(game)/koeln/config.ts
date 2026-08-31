import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

// Note: below LINES data is just a copy of generated data/lines.json
export const LINES: {
  [name: string]: Line
} = {
  Koeln1: {
    name: '1',
    color: '#d52330',
    backgroundColor: '#6B1118',
    textColor: '#FFFFFF',
    order: 1,
  },
  Koeln3: {
    name: '3',
    color: '#e693b5',
    backgroundColor: '#992354',
    textColor: '#FFFFFF',
    order: 2,
  },
  Koeln4: {
    name: '4',
    color: '#e06e9f',
    backgroundColor: '#8A1D4C',
    textColor: '#FFFFFF',
    order: 3,
  },
  Koeln5: {
    name: '5',
    color: '#948fb8',
    backgroundColor: '#443F64',
    textColor: '#FFFFFF',
    order: 4,
  },
  Koeln7: {
    name: '7',
    color: '#e6855c',
    backgroundColor: '#8C3915',
    textColor: '#FFFFFF',
    order: 5,
  },
  Koeln9: {
    name: '9',
    color: '#e6877e',
    backgroundColor: '#95271D',
    textColor: '#FFFFFF',
    order: 6,
  },
  Koeln12: {
    name: '12',
    color: '#8cc63f',
    backgroundColor: '#46651E',
    textColor: '#000000',
    order: 7,
  },
  Koeln13: {
    name: '13',
    color: '#967b68',
    backgroundColor: '#4B3E34',
    textColor: '#FFFFFF',
    order: 8,
  },
  Koeln15: {
    name: '15',
    color: '#54ad4b',
    backgroundColor: '#2A5726',
    textColor: '#FFFFFF',
    order: 9,
  },
  Koeln16: {
    name: '16',
    color: '#21bfc1',
    backgroundColor: '#105F61',
    textColor: '#FFFFFF',
    order: 10,
  },
  Koeln17: {
    name: '17',
    color: '#6dcff6',
    backgroundColor: '#0A7BA7',
    textColor: '#000000',
    order: 11,
  },
  Koeln18: {
    name: '18',
    color: '#0095da',
    backgroundColor: '#004A6D',
    textColor: '#FFFFFF',
    order: 12,
  },
}

export const METADATA: Metadata = {
  title: 'Köln Bahn Memory',
  description:
    'How many of the Cologne tram and Stadtbahn stations can you name from memory?',
  openGraph: {
    title: 'Köln Bahn Memory',
    description:
      'How many of the Cologne tram and Stadtbahn stations can you name from memory?',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/koeln',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb', // generic
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK = 'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

// Must match the directory name and the `link` in lib/citiesConfig.ts: progress is stored
// under `${CITY_NAME}-stations` and the stats API scans keys by that same slug.
export const CITY_NAME = 'koeln'

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
