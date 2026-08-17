import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.2

export const LINES: {
  [name: string]: Line
} = {
  KualaLumpurLRTAmpangLine: {
    "name": "Ampang Line",
    "color": "#e57200",
    "backgroundColor": "#e57200",
    "textColor": "#FFFFFF",
    "order": 0
  },
  KualaLumpurLRTSriPetalingLine: {
    "name": "Sri Petaling Line",
    "color": "#76232f",
    "backgroundColor": "#76232f",
    "textColor": "#FFFFFF",
    "order": 1
  },
  KualaLumpurLRTKelanaJayaLine: {
    "name": "Kelana Jaya Line",
    "color": "#D50032",
    "backgroundColor": "#D50032",
    "textColor": "#FFFFFF",
    "order": 2
  },
  KualaLumpurMonorailLine: {
    "name": "KL Monorail Line",
    "color": "#84bd00",
    "backgroundColor": "#84bd00",
    "textColor": "#FFFFFF",
    "order": 3
  },
  KualaLumpurMRTKajangLine: {
    "name": "Kajang Line",
    "color": "#047940",
    "backgroundColor": "#047940",
    "textColor": "#FFFFFF",
    "order": 4
  },
  KualaLumpurMRTPutrajayaLine: {
    "name": "Putrajaya Line",
    "color": "#FFCD00",
    "backgroundColor": "#FFCD00",
    "textColor": "#FFFFFF",
    "order": 5
  },
  KualaLumpurLRTShahAlamLine: {
    "name": "Shah Alam Line",
    "color": "#00A4E3",
    "backgroundColor": "#00A4E3",
    "textColor": "#FFFFFF",
    "order": 6
  },
  KualaLumpurBRTSunwayLine: {
    "name": "BRT Sunway Line",
    "color": "#115740",
    "backgroundColor": "#115740",
    "textColor": "#FFFFFF",
    "order": 7
  },
}

export const METADATA: Metadata = {
  title: 'Kuala Lumpur Metro Memory Game',
  description:
    'How many of the Kuala Lumpur (Klang Valley) MRT/LRT stations can you name from memory?',
  openGraph: {
    title: 'Kuala Lumpur Metro Memory Game',
    description:
      'How many of the Kuala Lumpur (Klang Valley) MRT/LRT stations can you name from memory?',
    type: 'website',
    locale: 'en_GB',
    url: 'https://metro-memory.com/kualalumpur',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb',
  bounds: [
    [101.11, 2.87],
    [101.99, 3.26],
  ],
  maxBounds: [
    [98.89, 1.85],
    [104.75, 4.41],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = 'https://buy.stripe.com/dR66oVdau0nEafm3cn'

export const CITY_NAME = 'kuala-lumpur'

export const LOCALE = 'en'

export const MAP_FROM_DATA = true

const config: Config = {
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
