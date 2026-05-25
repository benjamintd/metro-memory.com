import GamePage from '@/components/GamePage'
import Main from '@/components/Main'
import { Provider } from '@/lib/configContext'
import { loadCityRoutes } from '@/lib/loadCityRoutes'
import { DataFeatureCollection } from '@/lib/types'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Inter } from 'next/font/google'
import 'react-circular-progressbar/dist/styles.css'
import config from './config'
import data from './data/features.json'

export const dynamic = 'force-dynamic'

const font = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = config.METADATA

export default async function Hamburg() {
  const { routesFc, savedSettings } = loadCityRoutes('hamburg', config)

  const fc = {
    ...data,
    features: data.features.filter((f) => !!config.LINES[f.properties.line]),
  } as DataFeatureCollection

  return (
    <Provider value={config}>
      <Main className={`${font.className} min-h-screen`}>
        <GamePage fc={fc} routes={routesFc} savedSettings={savedSettings} />
      </Main>
    </Provider>
  )
}
