'use server'

import fs from 'fs'
import path from 'path'
import { ProcessedSettings, RoutesFeatureCollection } from '@/lib/types'

const CITY = 'london'

export async function saveRoutes(
  data: RoutesFeatureCollection,
  settings: ProcessedSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { ok: false, error: 'Dev only' }
  }

  const dataDir = path.join(process.cwd(), 'src', 'app', '(game)', CITY, 'data')

  if (!fs.existsSync(dataDir)) {
    return { ok: false, error: 'City data directory not found' }
  }

  try {
    fs.writeFileSync(path.join(dataDir, 'routes.json'), JSON.stringify(data, null, 2))
    fs.writeFileSync(path.join(dataDir, 'routes-settings.json'), JSON.stringify(settings, null, 2))
  } catch (e) {
    return { ok: false, error: `Write failed: ${String(e)}` }
  }

  return { ok: true }
}
