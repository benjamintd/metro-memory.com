import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  ToulouseA: {
    name: 'A',
    color: '#DB001B',
    backgroundColor: '#6E000D',
    textColor: '#FFFFFF',
    order: 0,
  },
  ToulouseB: {
    name: 'B',
    color: '#FFD900',
    backgroundColor: '#806D00',
    textColor: '#FFFFFF',
    order: 1,
  },
  ToulouseC: {
    name: 'C',
    color: '#52B149',
    backgroundColor: '#295925',
    textColor: '#FFFFFF',
    order: 2,
  },
  ToulouseT1: {
    name: 'T1',
    color: '#004687',
    backgroundColor: '#002344',
    textColor: '#FFFFFF',
    order: 3,
  },
  ToulouseAE: {
    name: 'Aéroport Express',
    color: '#409AD9',
    backgroundColor: '#409AD9',
    textColor: '#ffffff',
    order: 4,
  },
  ToulouseTeleo: {
    name: 'Teleo',
    color: '#DC006B',
    backgroundColor: '#6E0036',
    textColor: '#FFFFFF',
    order: 5,
  },
  ToulouseAC: {
    name: 'Arènes - Colomiers',
    color: '#6265ac',
    backgroundColor: '#2F3058',
    textColor: '#FFFFFF',
    order: 6,
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
  style: 'mapbox://styles/elisadorable/cmm4geupg001u01s2e8uja2nh',
  center: [1.4473, 43.6048],
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
