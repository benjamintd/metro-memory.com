import fs from 'fs'
import path from 'path'
import { ProcessedSettings, RoutesFeatureCollection } from './types'

function cityDataDir(citySlug: string): string {
  return path.join(process.cwd(), 'src', 'app', '(game)', citySlug, 'data')
}

/**
 * Server-side helper for city game pages.
 * Always loads the baked routes.json — the final game-ready output.
 */
export function loadCityRoutes(citySlug: string): RoutesFeatureCollection {
  const routesPath = path.join(cityDataDir(citySlug), 'routes.json')
  return JSON.parse(fs.readFileSync(routesPath, 'utf-8')) as RoutesFeatureCollection
}

export interface OffsetsToolData {
  routesFc: RoutesFeatureCollection
  savedSettings: ProcessedSettings | undefined
}

/**
 * Server-side helper for the offsets tool page.
 * Loads routes-unprocessed.json (the stable input) plus routes-settings.json
 * if it exists. On first run, seeds routes-unprocessed.json from routes.json.
 */
export function loadOffsetsToolData(citySlug: string): OffsetsToolData {
  const dataDir = cityDataDir(citySlug)
  const processedPath = path.join(dataDir, 'routes.json')
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
