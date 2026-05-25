import { Config, Line } from '@/lib/types'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export const BEG_THRESHOLD = 0.2

export const LINES: {
  [name: string]: Line
} = {
  MTRTsuenWanLine: {
    name: '荃灣綫 Tsuen Wan Line',
    color: '#FF0000',
    backgroundColor: '#7F0000',
    textColor: '#FFFFFF',
    order: 0,
  },
  MTRKwunTongLine: {
    name: '觀塘綫 Kwun Tong Line',
    color: '#1A9431',
    backgroundColor: '#0D4A18',
    textColor: '#FFFFFF',
    order: 1,
  },
  MTRIslandLine: {
    name: '港島綫 Island Line',
    color: '#0860A8',
    backgroundColor: '#043054',
    textColor: '#FFFFFF',
    order: 2,
  },
  MTRTungChungLine: {
    name: '東涌綫 Tung Chung Line',
    color: '#FE7F1D',
    backgroundColor: '#7F3F0E',
    textColor: '#FFFFFF',
    order: 3,
  },
  MTRTseungKwanOLine: {
    name: '將軍澳綫 Tseung Kwan O Line',
    color: '#6B208B',
    backgroundColor: '#351045',
    textColor: '#FFFFFF',
    order: 4,
  },
  MTREastRailLine: {
    name: '東鐵綫 East Rail Line',
    color: '#53B7E8',
    backgroundColor: '#295B74',
    textColor: '#FFFFFF',
    order: 5,
  },
  MTRTuenMaLine: {
    name: '屯馬綫 Tuen Ma Line',
    color: '#9A3B26',
    backgroundColor: '#4D1E13',
    textColor: '#FFFFFF',
    order: 6,
  },
  MTRSouthIslandLine: {
    name: '南港島綫 South Island Line',
    color: '#B5BD00',
    backgroundColor: '#5A5E00',
    textColor: '#FFFFFF',
    order: 7,
  },
  MTRDisneylandResortLine: {
    name: '迪士尼綫 Disneyland Resort Line',
    color: '#F550A6',
    backgroundColor: '#7B2853',
    textColor: '#FFFFFF',
    order: 8,
  },
  MTRAirportExpress: {
    name: '機場快綫 Airport Express',
    color: '#007078',
    backgroundColor: '#00383C',
    textColor: '#FFFFFF',
    order: 9,
  },
}

export const METADATA: Metadata = {
  title: 'Hong Kong MTR Memory',
  description: '你記得幾多個港鐵站名？',
  openGraph: {
    title: 'Hong Kong MTR Memory',
    description: '你記得幾多個港鐵站名？',
    type: 'website',
    locale: 'zh_HK',
    url: 'https://metro-memory.com/hongkong',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/cls4h02hy019201qygvumc0nb',
  bounds: [
    [113.82, 22.15],
    [114.35, 22.58],
  ],
  maxBounds: [
    [113.2, 21.5],
    [115.0, 23.2],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = ''

export const CITY_NAME = 'hongkong'

export const LOCALE = 'zh'

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
