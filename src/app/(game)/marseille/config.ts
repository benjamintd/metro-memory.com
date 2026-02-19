import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  MarseilleM1: {
    name: 'M1',
    color: '#5281B0',
    backgroundColor: '#003A5F',
    textColor: '#FFFFFF',
    order: 1,
  },
  MarseilleM2: {
    name: 'M2',
    color: '#F3664F',
    backgroundColor: '#720309',
    textColor: '#FFFFFF',
    order: 2,
  },
  MarseilleT1: {
    name: 'T1',
    color: '#F18F00',
    backgroundColor: '#784700',
    textColor: '#FFFFFF',
    order: 3,
  },
  MarseilleT2: {
    name: 'T2',
    color: '#FEDB09',
    backgroundColor: '#807705',
    textColor: '#FFFFFF',
    order: 4,
  },
  MarseilleT3: {
    name: 'T3',
    color: '#8BC965',
    backgroundColor: '#4B5F07',
    textColor: '#FFFFFF',
    order: 5,
  },
}

export const METADATA: Metadata = {
  title: 'Marseille Metro Memory',
  description: 'Combien de stations de métro de Marseille connaissez-vous ?',
  openGraph: {
    title: 'Marseille Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Marseille et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/marseille',
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
