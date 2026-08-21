
import { Metadata } from 'next'
import { MapboxOptions } from 'mapbox-gl'
import { Config, Line } from '@/lib/types'
import linesData from './data/lines.json'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = linesData as {
  [name: string]: Line
}

export const METADATA: Metadata = {
  title: 'Frankfurt Nahverkehr Memory',
  description:
    'Wie viele S-Bahn-, U-Bahn- und Straßenbahnstationen in Frankfurt am Main können Sie auswendig nennen?',
  openGraph: {
    title: 'Frankfurt Nahverkehr Memory',
    description:
      'Wie viele S-Bahn-, U-Bahn- und Straßenbahnstationen in Frankfurt am Main können Sie auswendig nennen? Spielen Sie Frankfurt Nahverkehr Memory und finden Sie es heraus!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/frankfurt',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb',
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK =
  'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

export const CITY_NAME = 'frankfurt'

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