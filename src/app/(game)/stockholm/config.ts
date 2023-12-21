import { Metadata } from 'next'
import { MapboxOptions } from 'mapbox-gl'
import { Line } from '@/lib/types'

export const BEG_THRESHOLD = 0.3

export const LINES: {
  [name: string]: Line
} = {
  Tunnelbana10: {
    name: 'T10',
    color: '#0066B7',
    backgroundColor: '#00335C',
    textColor: '#FFFFFF',
    order: 0,
  },
  Tunnelbana11: {
    name: 'T11',
    color: '#0066B7',
    backgroundColor: '#00335C',
    textColor: '#FFFFFF',
    order: 1,
  },
  Tunnelbana13: {
    name: 'T13',
    color: '#D90011',
    backgroundColor: '#6D0008',
    textColor: '#FFFFFF',
    order: 2,
  },
  Tunnelbana14: {
    name: 'T14',
    color: '#D90011',
    backgroundColor: '#6D0008',
    textColor: '#FFFFFF',
    order: 3,
  },
  Tunnelbana17: {
    name: 'T17',
    color: '#44A326',
    backgroundColor: '#225213',
    textColor: '#FFFFFF',
    order: 4,
  },
  Tunnelbana18: {
    name: 'T18',
    color: '#44A326',
    backgroundColor: '#225213',
    textColor: '#FFFFFF',
    order: 5,
  },
  Tunnelbana19: {
    name: 'T19',
    color: '#44A326',
    backgroundColor: '#225213',
    textColor: '#FFFFFF',
    order: 6,
  },
  Lokalbana30: {
    name: '30',
    color: '#ff9400',
    backgroundColor: '#6C3F00',
    textColor: '#FFFFFF',
    order: 7,
  },
  Lokalbana31: {
    name: '31',
    color: '#ff9400',
    backgroundColor: '#6C3F00',
    textColor: '#FFFFFF',
    order: 8,
  },
  LokalbanaL12: {
    name: 'L12',
    color: '#7592c5',
    backgroundColor: '#40567d',
    textColor: '#FFFFFF',
    order: 9,
  },
  LokalbanaL21: {
    name: 'L21',
    color: '#BA7F32',
    backgroundColor: '#5D4019',
    textColor: '#FFFFFF',
    order: 10,
  },
  LokalbanaL27: {
    name: 'L27',
    color: '#A05EA6',
    backgroundColor: '#512E54',
    textColor: '#FFFFFF',
    order: 11,
  },
  LokalbanaL28: {
    name: 'L28',
    color: '#A05EA6',
    backgroundColor: '#512E54',
    textColor: '#FFFFFF',
    order: 12,
  },
  LokalbanaL29: {
    name: 'L29',
    color: '#A05EA6',
    backgroundColor: '#512E54',
    textColor: '#FFFFFF',
    order: 13,
  },
}

export const METADATA: Metadata = {
  title: 'Stockholm Metro Memory',
  description: 'Hur bra kan du namnen på Stockholms tunnelbanestationer?',
  openGraph: {
    title: 'Stockholm Metro Memory',
    description: 'Hur bra kan du namnen på Stockholms tunnelbanestationer?',
    type: 'website',
    locale: 'sv_SE',
    url: 'https://metro-memory.com/stockholm',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clq43c36701xd01pj25i277ad',
  bounds: [
    [17.582708, 59.153138],
    [18.571478, 59.46854],
  ],
  maxBounds: [
    [16.582708, 58.153138],
    [19.571478, 60.46854],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = 'https://buy.stripe.com/eVa14B1rM1rIfzG14d'

export const CITY_NAME = 'stockholm'

export const LOCALE = 'sv'

const config = {
  LOCALE,
  STRIPE_LINK,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  BEG_THRESHOLD,
}

export default config
