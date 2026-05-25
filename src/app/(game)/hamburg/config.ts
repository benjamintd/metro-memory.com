import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.5

export const LINES: {
  [name: string]: Line
} = {
  HamburgSBahnS1: {
    name: 'S1',
    color: '#23B24B',
    backgroundColor: '#115925',
    textColor: '#1A962B',
    order: 0,
  },
  HamburgSBahnS2: {
    name: 'S2',
    color: '#B62750',
    backgroundColor: '#5B1428',
    textColor: '#B51143',
    order: 1,
  },
  HamburgSBahnS3: {
    name: 'S3',
    color: '#652D91',
    backgroundColor: '#321749',
    textColor: '#622181',
    order: 2,
  },
  HamburgSBahnS5: {
    name: 'S5',
    color: '#0089BB',
    backgroundColor: '#00455E',
    textColor: '#0089BB',
    order: 3,
  },
  HamburgUBahnU1: {
    name: 'U1',
    color: '#0072BC',
    backgroundColor: '#00395E',
    textColor: '#006AB3',
    order: 4,
  },
  HamburgUBahnU2: {
    name: 'U2',
    color: '#EE1D23',
    backgroundColor: '#7C090D',
    textColor: '#E2001A',
    order: 5,
  },
  HamburgUBahnU3: {
    name: 'U3',
    color: '#FFDC01',
    backgroundColor: '#806E00',
    textColor: '#FFDD00',
    order: 6,
  },
  HamburgUBahnU4: {
    name: 'U4',
    color: '#00AAAD',
    backgroundColor: '#005557',
    textColor: '#0098A1',
    order: 7,
  },
}

export const METADATA: Metadata = {
  title: 'Hamburg Bahn Memory',
  description: 'Wie viele S- und U-Bahn Stationen können Sie auswendig nennen?',
  openGraph: {
    title: 'Hamburg Bahn Memory',
    description:
      'Wie viele S- und U-Bahn-Stationen können Sie auswendig nennen? Spielen Sie das Hamburg Bahn Memory und finden Sie es heraus!',
    type: 'website',
    locale: 'de_DE',
    url: 'https://metro-memory.com/hamburg',
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

export const CITY_NAME = 'hamburg'

export const LOCALE = 'de'

export const MAP_FROM_DATA = true

export const OFFSET_PROCESSING_MODE = true

const config: Config = {
  GAUGE_COLORS: 'inverted',
  MAP_FROM_DATA,
  OFFSET_PROCESSING_MODE,
  LOCALE,
  STRIPE_LINK,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  BEG_THRESHOLD,
}

export default config
