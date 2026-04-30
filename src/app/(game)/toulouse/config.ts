import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  ToulouseA: {
    name: 'A',
    color: '#E41B23',
    backgroundColor: '#E41B23',
    textColor: '#ffffff',
    order: 0,
  },
  ToulouseB: {
    name: 'B',
    color: '#FEDD04',
    backgroundColor: '#FEDD04',
    textColor: '#000000',
    order: 1,
  },
  ToulouseC: {
    name: 'C',
    color: '#52B149',
    backgroundColor: '#52B149',
    textColor: '#ffffff',
    order: 2,
  },
  ToulouseT1: {
    name: 'T1',
    color: '#234B90',
    backgroundColor: '#234B90',
    textColor: '#ffffff',
    order: 3,
  },
  ToulouseT2: {
    name: 'T2',
    color: '#409AD9',
    backgroundColor: '#409AD9',
    textColor: '#ffffff',
    order: 4,
  },
  ToulouseTeleo: {
    name: 'Teleo',
    color: '#EC0677',
    backgroundColor: '#EC0677',
    textColor: '#ffffff',
    order: 5,
  },
}

export const METADATA: Metadata = {
  title: 'Toulouse Metro Memory',
  description: 'Combien de stations de métro de Toulouse connaissez-vous ?',
  openGraph: {
    title: 'Toulouse Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Toulouse et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/toulouse',
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
  GAUGE_COLORS: 'default',
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
