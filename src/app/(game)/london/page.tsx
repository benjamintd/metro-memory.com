import data from './data/features.json'
import routes from './data/routes.json'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import { DataFeatureCollection, RoutesFeatureCollection } from '@/lib/types'
import config from './config'
import GamePage from '@/components/GamePage'
import { Provider } from '@/lib/configContext'
import Main from '@/components/Main'
import { Cabin } from 'next/font/google'

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

export default function London() {
  return (
    <Provider value={config}>
      <Main className={`${font.className} min-h-screen`}>
        <GamePage
          fc={fc}
          routes={routesFc}
          callout={
            <a
              href="https://undergroundoku.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block rounded-lg bg-amber-50 p-4 text-sm text-amber-900 shadow-sm transition hover:bg-amber-100"
            >
              Tube fan? Try{' '}
              <span className="font-bold underline">Undergroundoku</span>, a
              daily puzzle game.
            </a>
          }
        />
      </Main>
    </Provider>
  )
}
