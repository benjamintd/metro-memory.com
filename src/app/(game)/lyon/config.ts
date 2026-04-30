import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  LyonA: {
    name: 'A',
    color: '#EB4599',
    backgroundColor: '#890F4D',
    textColor: '#FFFFFF',
    order: 1,
  },
  LyonB: {
    name: 'B',
    color: '#0076C0',
    backgroundColor: '#003B60',
    textColor: '#FFFFFF',
    order: 2,
  },
  LyonC: {
    name: 'C',
    color: '#F79829',
    backgroundColor: '#8B4D05',
    textColor: '#FFFFFF',
    order: 3,
  },
  LyonD: {
    name: 'D',
    color: '#00A950',
    backgroundColor: '#005428',
    textColor: '#FFFFFF',
    order: 4,
  },
  LyonF1: {
    name: 'F1',
    color: '#8BC752',
    backgroundColor: '#456A22',
    textColor: '#FFFFFF',
    order: 5,
  },
  LyonF2: {
    name: 'F2',
    color: '#8BC752',
    backgroundColor: '#456A22',
    textColor: '#FFFFFF',
    order: 6,
  },
  LyonRX: {
    name: 'Rhône Express',
    color: '#b80e28',
    backgroundColor: '#5C0714',
    textColor: '#FFFFFF',
    order: 7,
  },
  LyonT1: {
    name: 'T1',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 8,
  },
  LyonT2: {
    name: 'T2',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 9,
  },
  LyonT3: {
    name: 'T3',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 10,
  },
  LyonT4: {
    name: 'T4',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 11,
  },
  LyonT5: {
    name: 'T5',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 12,
  },
  LyonT6: {
    name: 'T6',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 13,
  },
  LyonT7: {
    name: 'T7',
    color: '#873F98',
    backgroundColor: '#43204C',
    textColor: '#FFFFFF',
    order: 14,
  },
}

export const METADATA: Metadata = {
  title: 'Lyon Metro Memory',
  description: 'Combien de stations de métro de Lyon connaissez-vous ?',
  openGraph: {
    title: 'Lyon Metro Memory',
    description:
      'Combien de stations de Metro pouvez-vous nommer par cœur ? Jouez au Metro Memory de Lyon et découvrez-le !',
    type: 'website',
    locale: 'fr_FR',
    url: 'https://metro-memory.com/lyon',
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
