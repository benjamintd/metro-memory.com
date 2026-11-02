import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  BremenTram1: {
    name: '1',
    color: '#1a9641',
    backgroundColor: '#10632a',
    textColor: '#FFFFFF',
    order: 0,
  },
  BremenTram2: {
    name: '2',
    color: '#1a5da9',
    backgroundColor: '#113d6e',
    textColor: '#FFFFFF',
    order: 1,
  },
  BremenTram3: {
    name: '3',
    color: '#2799d6',
    backgroundColor: '#14587d',
    textColor: '#FFFFFF',
    order: 2,
  },
  BremenTram4: {
    name: '4',
    color: '#e30b15',
    backgroundColor: '#83070d',
    textColor: '#FFFFFF',
    order: 3,
  },
  BremenTram5: {
    name: '5',
    color: '#009db2',
    backgroundColor: '#006a78',
    textColor: '#FFFFFF',
    order: 4,
  },
  BremenTram6: {
    name: '6',
    color: '#fecd1f',
    backgroundColor: '#aa8a16',
    textColor: '#000000',
    order: 5,
  },
  BremenTram8: {
    name: '8',
    color: '#98c21d',
    backgroundColor: '#708e16',
    textColor: '#FFFFFF',
    order: 6,
  },
  BremenTram10: {
    name: '10',
    color: '#312783',
    backgroundColor: '#211a56',
    textColor: '#FFFFFF',
    order: 7,
  },
}

export const METADATA: Metadata = {
  title: 'Bremen Bahn Memory',
  description: 'Wie viele Straßenbahnhaltestellen können Sie auswendig nennen?',
  openGraph: {
    title: 'Bremen Bahn Memory',
    description:
      'Wie viele Straßenbahnhaltestellen können Sie auswendig nennen? Spielen Sie das Bremen Bahn Memory und finden Sie es heraus!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/bremen',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb', // generic
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK = 'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

export const CITY_NAME = 'bremen'

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
