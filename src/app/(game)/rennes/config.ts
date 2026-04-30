import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  RennesA: {
    name: 'A',
    color: '#ED1C24',
    backgroundColor: '#7B0A0E',
    textColor: '#FFFFFF',
    order: 1,
  },
  RennesB: {
    name: 'B',
    color: '#00893E',
    backgroundColor: '#00451F',
    textColor: '#FFFFFF',
    order: 2,
  },
}

export const METADATA: Metadata = {
  title: 'Rennes Metro Memory',
  description: 'Combien de stations de métro de Rennes connaissez-vous ?',
  openGraph: {
    title: 'Rennes Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Rennes et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/rennes',
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

export const CITY_NAME = 'toulouse'

export const LOCALE = 'fr'

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
