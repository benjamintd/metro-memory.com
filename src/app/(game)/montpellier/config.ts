import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  Montpellier1: {
    name: '1',
    color: '#005BA1',
    backgroundColor: '#002D51',
    textColor: '#FFFFFF',
    order: 1,
  },
  Montpellier2: {
    name: '2',
    color: '#F18E00',
    backgroundColor: '#784700',
    textColor: '#FFFFFF',
    order: 2,
  },
  Montpellier3: {
    name: '3',
    color: '#CBD300',
    backgroundColor: '#656A00',
    textColor: '#FFFFFF',
    order: 3,
  },
  Montpellier4: {
    name: '4',
    color: '#4A2A15',
    backgroundColor: '#25150A',
    textColor: '#FFFFFF',
    order: 4,
  },
  Montpellier5: {
    name: '5',
    color: '#2D7431',
    backgroundColor: '#163A18',
    textColor: '#FFFFFF',
    order: 5,
  },
}

export const METADATA: Metadata = {
  title: 'Montpellier Metro Memory',
  description: 'Combien de stations de métro de Montpellier connaissez-vous ?',
  openGraph: {
    title: 'Montpellier Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Montpellier et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/montpellier',
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

export const CITY_NAME = 'montpellier'

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
