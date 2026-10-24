import OffsetsTool from '@/components/OffsetsTool'
import { loadOffsetsToolData } from '@/lib/loadCityRoutes'
import { DataFeatureCollection } from '@/lib/types'
import { notFound } from 'next/navigation'
import config from '../config'
import data from '../data/features.json'

// Dev-only offset processing tool for London.
//
// To enable this tool for another city:
//   1. Copy this directory to `src/app/(game)/<city>/offsets/`.
//   2. In the new copy, update the imports (`../config`, `../data/features.json`)
//      to resolve against the target city's folder (relative paths already do).
//   3. Duplicate `actions.ts` and change its `CITY` constant to the new slug.
//      Update this page's import path for `saveRoutes` accordingly (via the
//      OffsetsTool component, which imports the action directly).
//   4. Ensure the target city has `routes.json` committed. On first visit the
//      tool will seed `routes-unprocessed.json` from it.
//   5. Once offsets are dialled in and saved, the baked `routes.json` is what
//      the game page will render.
export const dynamic = 'force-dynamic'

export default function LondonOffsets() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  const { routesFc, savedSettings } = loadOffsetsToolData('london')

  const fc = {
    ...data,
    features: data.features.filter((f) => !!config.LINES[f.properties.line]),
  } as DataFeatureCollection

  return (
    <OffsetsTool
      fc={fc}
      routes={routesFc}
      savedSettings={savedSettings}
      lines={config.LINES}
      mapConfig={config.MAP_CONFIG}
    />
  )
}
