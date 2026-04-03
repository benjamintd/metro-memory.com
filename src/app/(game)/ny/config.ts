import { Metadata } from 'next'
import { MapboxOptions } from 'mapbox-gl'
import { Config, Line } from '@/lib/types'

export const BEG_THRESHOLD = 0.2

export const LINES: {
  [name: string]: Line
} = {
  NewYorkSubway1: {
    name: '1',
    color: '#EE352E',
    backgroundColor: '#830F0B',
    textColor: '#FFFFFF',
    order: 1,
  },
  NewYorkSubway2: {
    name: '2',
    color: '#EE352E',
    backgroundColor: '#830F0B',
    textColor: '#FFFFFF',
    order: 2,
  },
  NewYorkSubway3: {
    name: '3',
    color: '#EE352E',
    backgroundColor: '#830F0B',
    textColor: '#FFFFFF',
    order: 3,
  },
  NewYorkSubway4: {
    name: '4',
    color: '#00933C',
    backgroundColor: '#004A1E',
    textColor: '#FFFFFF',
    order: 4,
  },
  NewYorkSubway5: {
    name: '5',
    color: '#00933C',
    backgroundColor: '#004A1E',
    textColor: '#FFFFFF',
    order: 5,
  },
  NewYorkSubway6: {
    name: '6',
    color: '#00A65C',
    backgroundColor: '#00532E',
    textColor: '#FFFFFF',
    order: 6,
  },
  //   "6X": {
  //       "name": "<6>",
  //       "color": "#00A65C",
  //       "backgroundColor": "#00532E",
  //       "textColor": "#FFFFFF",
  //       "order": 7
  //   },
  NewYorkSubway7: {
    name: '7',
    color: '#B933AD',
    backgroundColor: '#5C1A56',
    textColor: '#FFFFFF',
    order: 8,
  },
  //   "7X": {
  //       "name": "<7>",
  //       "color": "#B933AD",
  //       "backgroundColor": "#5C1A56",
  //       "textColor": "#FFFFFF",
  //       "order": 9
  //   },
  NewYorkSubwayA: {
    name: 'A',
    color: '#2850AD',
    backgroundColor: '#142857',
    textColor: '#FFFFFF',
    order: 10,
  },
  NewYorkSubwayC: {
    name: 'C',
    color: '#2850AD',
    backgroundColor: '#142857',
    textColor: '#FFFFFF',
    order: 11,
  },
  NewYorkSubwayE: {
    name: 'E',
    color: '#2850AD',
    backgroundColor: '#142857',
    textColor: '#FFFFFF',
    order: 12,
  },
  NewYorkSubwayB: {
    name: 'B',
    color: '#FF6319',
    backgroundColor: '#8C2D00',
    textColor: '#FFFFFF',
    order: 13,
  },
  NewYorkSubwayD: {
    name: 'D',
    color: '#FF6319',
    backgroundColor: '#8C2D00',
    textColor: '#FFFFFF',
    order: 14,
  },
  NewYorkSubwayF: {
    name: 'F',
    color: '#FF6319',
    backgroundColor: '#8C2D00',
    textColor: '#FFFFFF',
    order: 15,
  },
  //   "FX": {
  //       "name": "FX",
  //       "color": "#FF6319",
  //       "backgroundColor": "#8C2D00",
  //       "textColor": "#FFFFFF",
  //       "order": 16
  //   },
  NewYorkSubwayM: {
    name: 'M',
    color: '#FF6319',
    backgroundColor: '#8C2D00',
    textColor: '#FFFFFF',
    order: 17,
  },
  NewYorkSubwayG: {
    name: 'G',
    color: '#6CBE45',
    backgroundColor: '#366022',
    textColor: '#FFFFFF',
    order: 18,
  },
  NewYorkSubwayJ: {
    name: 'J',
    color: '#996633',
    backgroundColor: '#4D3319',
    textColor: '#FFFFFF',
    order: 19,
  },
  NewYorkSubwayZ: {
    name: 'Z',
    color: '#996633',
    backgroundColor: '#4D3319',
    textColor: '#FFFFFF',
    order: 20,
  },
  NewYorkSubwayL: {
    name: 'L',
    color: '#A7A9AC',
    backgroundColor: '#525457',
    textColor: '#FFFFFF',
    order: 21,
  },
  NewYorkSubwayN: {
    name: 'N',
    color: '#FCCC0A',
    backgroundColor: '#816802',
    textColor: '#FFFFFF',
    order: 22,
  },
  NewYorkSubwayQ: {
    name: 'Q',
    color: '#FCCC0A',
    backgroundColor: '#816802',
    textColor: '#FFFFFF',
    order: 23,
  },
  NewYorkSubwayR: {
    name: 'R',
    color: '#FCCC0A',
    backgroundColor: '#816802',
    textColor: '#FFFFFF',
    order: 24,
  },
  NewYorkSubwayW: {
    name: 'W',
    color: '#FCCC0A',
    backgroundColor: '#816802',
    textColor: '#FFFFFF',
    order: 25,
  },
  NewYorkSubwayGS: {
    name: 'S',
    color: '#808183',
    backgroundColor: '#404142',
    textColor: '#FFFFFF',
    order: 26,
  },
  NewYorkSubwayFS: {
    name: 'S',
    color: '#808183',
    backgroundColor: '#404142',
    textColor: '#FFFFFF',
    order: 27,
  },
  NewYorkSubwayH: {
    name: 'S',
    color: '#808183',
    backgroundColor: '#404142',
    textColor: '#FFFFFF',
    order: 28,
  },
}

export const METADATA: Metadata = {
  title: 'New York City Subway Memory Game',
  description: 'How many of the NY subway stations can you name from memory?',
  openGraph: {
    title: 'New York City Subway Memory Game',
    description: 'How many of the NY subway stations can you name from memory?',
    type: 'website',
    locale: 'en_US',
    url: 'https://metro-memory.com/ny',
  },
}

export const MAP_CONFIG: MapboxOptions = {
  container: 'map',
  style: 'mapbox://styles/benjamintd/clnzq5uaw00bj01qx6m4o13s4',
  bounds: [
    [-74.10263734322956, 40.69927613947669],
    [-73.82458709469718, 40.857750760431216],
  ],
  maxBounds: [
    [-75, 40],
    [-73, 42],
  ],
  minZoom: 6,
  fadeDuration: 50,
}

export const STRIPE_LINK = 'https://buy.stripe.com/28o14B9Yic6m73adQT'

export const CITY_NAME = 'ny'

export const LOCALE = 'en'

export const GAUGE_COLORS = 'inverted'

const config: Config = {
  GAUGE_COLORS,
  LOCALE,
  STRIPE_LINK,
  CITY_NAME,
  MAP_CONFIG,
  METADATA,
  LINES,
  BEG_THRESHOLD,
}

export default config
