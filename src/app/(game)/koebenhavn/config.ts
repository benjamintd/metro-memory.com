import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

import metro from './data'

export const BEG_THRESHOLD = 0.2

const l = metro.lines

export const LINES: {
  [name: string]: Line
} = {}

for (const line of metro.lines) {
  LINES[line.k] = line.v
}

export const METADATA: Metadata = {
  title: 'Københavns Metro Huskelej',
  description: 'Hvor mange af Københavns stationer kan du huske navnet til?',
  openGraph: {
    title: 'Københavns Metro Huskelej',
    description: 'Hvor mange af Københavns stationer kan du huske navnet til?',
    type: 'website',
    locale: 'da_DK',
    url: 'https://metro-memory.com/koebenhavn',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb', // generic
  bounds: [
    [12.4320357, 55.6090635],
    [12.6749343, 55.7442785],
  ],
  maxBounds: [
    [12.006, 55.3973662],
    [12.806, 55.8622796],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = 'https://buy.stripe.com/bIY8x3fiCgmC9bi8wx'

export const CITY_NAME = 'koebenhavn'

export const LOCALE = 'da'

// GAUGE_COLORS affects how the per-line gauges are rendered.
// - "default": the ring around the line logo is the line's 'color', and fills up with the line's 'textColor'
// - "inverted": the ring around the line logo is white, and fills up with the line's 'color'

export const GAUGE_COLORS = 'inverted'

export const MAP_FROM_DATA = true

const config: Config = {
  GAUGE_COLORS,
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
