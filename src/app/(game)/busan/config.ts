import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.2

export const LINES: {
  [name: string]: Line
} = {
  BusanMetroLine1: {
    name: '1호선',
    color: '#F06A00',
    backgroundColor: '#7A3600',
    textColor: '#FFFFFF',
    order: 0,
  },
  BusanMetroLine2: {
    name: '2호선',
    color: '#81BF48',
    backgroundColor: '#406022',
    textColor: '#FFFFFF',
    order: 1,
  },
  BusanMetroLine3: {
    name: '3호선',
    color: '#BB8C00',
    backgroundColor: '#5E4600',
    textColor: '#FFFFFF',
    order: 2,
  },
  BusanMetroLine4: {
    name: '4호선',
    color: '#217DCB',
    backgroundColor: '#11406A',
    textColor: '#FFFFFF',
    order: 3,
  },
  BusanMetroBGL: {
    name: '부산김해경전철',
    color: '#875CAC',
    backgroundColor: '#49315F',
    textColor: '#FFFFFF',
    order: 4,
  },
  BusanMetroDonghae: {
    name: '동해선',
    color: '#004FA2',
    backgroundColor: '#003463',
    textColor: '#FFFFFF',
    order: 5,
  },
}

export const METADATA: Metadata = {
  title: 'Busan Metro Memory',
  description: '부산 지하철 역 이름을 외울 수 있을까요?',
  openGraph: {
    title: 'Busan Metro Memory',
    description: '부산 지하철 역 이름을 외울 수 있을까요?',
    type: 'website',
    locale: 'ko_KR',
    url: 'https://metro-memory.com/busan',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb',
  bounds: [
    [128.82, 35.02],
    [129.39, 35.57],
  ],
  maxBounds: [
    [127.8, 34.3],
    [130.2, 36.0],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = 'https://buy.stripe.com/6oE4gN8Ue0nE3QY5kp'

export const CITY_NAME = 'busan'

export const LOCALE = 'ko'

export const MAP_FROM_DATA = true

const config: Config = {
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
