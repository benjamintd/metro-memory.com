import data from './data/features.json'
import routes from './data/routes.json'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import { DataFeatureCollection, RoutesFeatureCollection } from '@/lib/types'
import config from './config'
import GamePage from '@/components/GamePage'
import { Provider } from '@/lib/configContext'
import Main from '@/components/Main'
import { Noto_Sans_HK } from 'next/font/google'

const font = Noto_Sans_HK({
  weight: ['400', '700'],
  style: ['normal'],
  display: 'swap',
  subsets: ['latin'],
})

const fc = {
  ...data,
  features: data.features.filter((f) => !!config.LINES[f.properties.line]),
} as DataFeatureCollection

const routesFc = routes as RoutesFeatureCollection

export const metadata = config.METADATA

export default function HongKong() {
  return (
    <Provider value={config}>
      <Main className={`${font.className} min-h-screen`}>
        <GamePage fc={fc} routes={routesFc} />
      </Main>
    </Provider>
  )
}
