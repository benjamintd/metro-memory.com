import GamePage from '@/components/GamePage'
import Main from '@/components/Main'
import { Provider } from '@/lib/configContext'
import { DataFeatureCollection, RoutesFeatureCollection } from '@/lib/types'
//@ts-ignore
import 'mapbox-gl/dist/mapbox-gl.css'
import { Cabin } from 'next/font/google'
//@ts-ignore
import 'react-circular-progressbar/dist/styles.css'
import config from './config'
import data from './data/features.json'
import routes from './data/routes.json'

const font = Cabin({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

const fc = {
  ...data,
  features: data.features.filter((f) => !!config.LINES[f.properties.line]),
} as DataFeatureCollection

const routesFc = routes as RoutesFeatureCollection

export const metadata = config.METADATA

export default function KualaLumpur() {
  return (
    <Provider value={config}>
      <Main className={`${font.className} min-h-screen`}>
        <GamePage fc={fc} routes={routesFc}/>
      </Main>
    </Provider>
  )
}
