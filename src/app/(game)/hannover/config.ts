import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.2

// Note: below LINES data is just a copy of generated data/lines.json
export const LINES: {
  [name: string]: Line
} = {
  "Hannover3": {
    "name": "3",
    "color": "#0069b4",
    "backgroundColor": "#00355A",
    "textColor": "#FFFFFF",
    "order": 1
  },
  "Hannover7": {
    "name": "7",
    "color": "#0069b4",
    "backgroundColor": "#00355A",
    "textColor": "#FFFFFF",
    "order": 2
  },
  "Hannover9": {
    "name": "9",
    "color": "#0069b4",
    "backgroundColor": "#00355A",
    "textColor": "#FFFFFF",
    "order": 3
  },
  "Hannover13": {
    "name": "13",
    "color": "#0069b4",
    "backgroundColor": "#00355A",
    "textColor": "#FFFFFF",
    "order": 4
  },

  "Hannover1": {
    "name": "1",
    "color": "#e4003a",
    "backgroundColor": "#72001D",
    "textColor": "#FFFFFF",
    "order": 5
  },
  "Hannover2": {
    "name": "2",
    "color": "#e4003a",
    "backgroundColor": "#72001D",
    "textColor": "#FFFFFF",
    "order": 6
  },
  "Hannover8": {
    "name": "8",
    "color": "#e4003a",
    "backgroundColor": "#72001D",
    "textColor": "#FFFFFF",
    "order": 7
  },

  "Hannover4": {
    "name": "4",
    "color": "#f9b000",
    "backgroundColor": "#7D5800",
    "textColor": "#FFFFFF",
    "order": 8
  },
  "Hannover5": {
    "name": "5",
    "color": "#f9b000",
    "backgroundColor": "#7D5800",
    "textColor": "#FFFFFF",
    "order": 9
  },
  "Hannover6": {
    "name": "6",
    "color": "#f9b000",
    "backgroundColor": "#7D5800",
    "textColor": "#FFFFFF",
    "order": 10
  },
  "Hannover11": {
    "name": "11",
    "color": "#f9b000",
    "backgroundColor": "#7D5800",
    "textColor": "#FFFFFF",
    "order": 11
  },

  "Hannover10": {
    "name": "10",
    "color": "#76b82a",
    "backgroundColor": "#3B5C15",
    "textColor": "#FFFFFF",
    "order": 12
  },
  "Hannover12": {
    "name": "12",
    "color": "#76b82a",
    "backgroundColor": "#3B5C15",
    "textColor": "#FFFFFF",
    "order": 13
  },
  "Hannover17": {
    "name": "17",
    "color": "#76b82a",
    "backgroundColor": "#3B5C15",
    "textColor": "#FFFFFF",
    "order": 14
  },
}

export const METADATA: Metadata = {
  title: 'Hannover Stadtbahn Memory',
  description:
    'How many of the Hannover Stadtbahn stations can you name from memory?',
  openGraph: {
    title: 'Hannover Stadtbahn Memory',
    description:
      'How many of the Hannover Stadtbahn stations can you name from memory?',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/hannover',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb',
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK = 'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

export const CITY_NAME = 'hannover'

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
