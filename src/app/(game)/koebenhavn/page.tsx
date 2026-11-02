import GamePage from '@/components/GamePage'
import Main from '@/components/Main'
import { Provider } from '@/lib/configContext'
import { DataFeatureCollection, RoutesFeatureCollection } from '@/lib/types'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Cabin } from 'next/font/google'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'

import metro from './data'

const font = Cabin({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

const fc = {
  type: 'FeatureCollection',
  properties: {},
  features: metro.stations,
} as DataFeatureCollection

const routesFc = {
  type: 'FeatureCollection',
  features: metro.tracks,
} as RoutesFeatureCollection

export const metadata = config.METADATA

export default function København() {
  return (
    <Provider value={config}>
      <Main className={`${font.className} min-h-screen`}>
        <GamePage fc={fc} routes={routesFc} />
      </Main>
    </Provider>
  )
}
