import { Metadata } from 'next'
import { MapboxOptions } from 'mapbox-gl'
import { Config, Line } from '@/lib/types'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  MainzTram50: {
    name: '50',
    color: '#000000',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    order: 0,
  },
  MainzTram51: {
    name: '51',
    color: '#4A4A49',
    backgroundColor: '#252525',
    textColor: '#FFFFFF',
    order: 1,
  },
  MainzTram52: {
    name: '52',
    color: '#DED600',
    backgroundColor: '#6F6B00',
    textColor: '#000000',
    order: 2,
  },
  MainzTram53: {
    name: '53',
    color: '#000000',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    order: 3,
  },
  MainzTram59: {
    name: '59',
    color: '#FFA500',
    backgroundColor: '#805200',
    textColor: '#000000',
    order: 4,
  }
}

export const METADATA: Metadata = {
  title: 'Mainz Straßenbahn Memory',
  description: 'Wie viele Straßenbahn-Haltestellen in Mainz können Sie auswendig nennen?',
  openGraph: {
    title: 'Mainz Straßenbahn Memory',
    description:
      'Wie viele Straßenbahn-Haltestellen in Mainz können Sie auswendig nennen? Spielen Sie das Mainz Straßenbahn Memory und finden Sie es heraus!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/mainz',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12', // generic
  minZoom: 6,
  fadeDuration: 50,
  dragRotate: false,
}

export const STRIPE_LINK = 'https://buy.stripe.com/cN2aFb0nI1rI9bi5km'

export const CITY_NAME = 'mainz'

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
