import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  Lille1: {
    name: '1',
    color: '#FFD400',
    backgroundColor: '#806A00',
    textColor: '#FFFFFF',
    order: 1,
  },
  Lille2: {
    name: '2',
    color: '#ED1D24',
    backgroundColor: '#7B0A0E',
    textColor: '#FFFFFF',
    order: 2,
  },
  LilleR: {
    name: 'R',
    color: '#81CF00',
    backgroundColor: '#416800',
    textColor: '#FFFFFF',
    order: 3,
  },
  LilleT: {
    name: 'T',
    color: '#0099FF',
    backgroundColor: '#004C80',
    textColor: '#FFFFFF',
    order: 4,
  },
}

export const METADATA: Metadata = {
  title: 'Lille Metro Memory',
  description: 'Combien de stations de métro de Lille connaissez-vous ?',
  openGraph: {
    title: 'Lille Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Lille et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/lille',
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
