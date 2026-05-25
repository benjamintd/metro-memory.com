import fs from 'fs'
import path from 'path'
import { Config, ProcessedSettings, RoutesFeatureCollection } from './types'

export interface CityRoutesResult {
  routesFc: RoutesFeatureCollection
  savedSettings: ProcessedSettings | undefined
}

/**
 * Server-side helper for city page components.
 * When OFFSET_PROCESSING_MODE is enabled:
 *   - Creates routes-unprocessed.json from routes.json on first run
 *   - Loads from routes-unprocessed.json (the stable original)
 *   - Also loads routes-settings.json if it exists
 * When disabled:
 *   - Loads routes.json directly
 */
export function loadCityRoutes(citySlug: string, config: Config): CityRoutesResult {
  const dataDir = path.join(process.cwd(), 'src', 'app', '(game)', citySlug, 'data')
  const processedPath = path.join(dataDir, 'routes.json')

  if (config.OFFSET_PROCESSING_MODE) {
    const unprocessedPath = path.join(dataDir, 'routes-unprocessed.json')
    const settingsPath = path.join(dataDir, 'routes-settings.json')

    if (!fs.existsSync(unprocessedPath)) {
      fs.copyFileSync(processedPath, unprocessedPath)
    }

    const routesFc = JSON.parse(fs.readFileSync(unprocessedPath, 'utf-8')) as RoutesFeatureCollection
    const savedSettings = fs.existsSync(settingsPath)
      ? (JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as ProcessedSettings)
      : undefined

    return { routesFc, savedSettings }
  }

  return {
    routesFc: JSON.parse(fs.readFileSync(processedPath, 'utf-8')) as RoutesFeatureCollection,
    savedSettings: undefined,
  }
}
