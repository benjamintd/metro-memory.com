'use client'

import {
  buildSegmentedRoutes,
  computeInterpolatedOffsets,
  detectOverlapSections,
  processRoutesForSameLineOverlaps,
} from '@/lib/lineOffsetting'
import {
  DataFeatureCollection,
  Line,
  ProcessedSettings,
  RoutesFeatureCollection,
} from '@/lib/types'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bbox } from '@turf/turf'
import { saveRoutes } from '@/app/(game)/london/offsets/actions'

const DEFAULT_STEP_SIZE = 3

export default function OffsetsTool({
  fc,
  routes,
  savedSettings,
  lines,
  mapConfig,
}: {
  fc: DataFeatureCollection
  routes: RoutesFeatureCollection
  savedSettings: ProcessedSettings | undefined
  lines: { [key: string]: Line }
  mapConfig: mapboxgl.MapboxOptions
}) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const filteredRoutesRef = useRef<RoutesFeatureCollection | undefined>(undefined)
  const [routeStates, setRouteStates] = useState<Map<string, 'hidden' | 'magenta'>>(new Map())
  const [segmentOffsets, setSegmentOffsets] = useState<Map<string, number>>(new Map())
  const [globalStepSize, setGlobalStepSize] = useState<number>(DEFAULT_STEP_SIZE)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [latestSavedSettings, setLatestSavedSettings] = useState<ProcessedSettings | undefined>(savedSettings)

  const hasChanges = segmentOffsets.size > 0 || globalStepSize !== DEFAULT_STEP_SIZE

  const savedSettingsMatchCurrent = useMemo(() => {
    if (!latestSavedSettings) return false
    if (latestSavedSettings.globalStepSize !== globalStepSize) return false
    const saved = latestSavedSettings.segmentOffsets
    if (Object.keys(saved).length !== segmentOffsets.size) return false
    for (const [k, v] of segmentOffsets) {
      if (saved[k] !== v) return false
    }
    return true
  }, [latestSavedSettings, segmentOffsets, globalStepSize])

  const stationsForOffsets = useMemo(() => {
    return fc.features
      .filter(f => f.geometry.type === 'Point')
      .map(f => ({ coord: f.geometry.coordinates as number[] }))
  }, [fc])

  // Step 1: Deduplicate same-line overlaps
  const deduped = useMemo(() => {
    return processRoutesForSameLineOverlaps(routes, lines)
  }, [routes, lines])

  // Step 2: Detect overlap sections between different lines
  const overlapSections = useMemo(() => {
    return detectOverlapSections(deduped)
  }, [deduped])

  // Step 3: Build named segments (no auto offsets); split transition segments at stations
  const segmentedRoutes = useMemo(() => {
    return buildSegmentedRoutes(deduped, overlapSections, lines, stationsForOffsets)
  }, [deduped, overlapSections, lines, stationsForOffsets])

  const segmentInfoMap = segmentedRoutes.segments
  const segmentsByLine = segmentedRoutes.segmentsByLine

  // Step 4: Compute interpolated offsets
  const interpolatedOffsets = useMemo(() => {
    return computeInterpolatedOffsets(segmentedRoutes.segmentsByLine, segmentOffsets)
  }, [segmentedRoutes, segmentOffsets])

  // Step 5: Stamp overlapOffsetPx on each feature
  const processedRoutes = useMemo(() => {
    const features = segmentedRoutes.fc.features.map(f => {
      const segName = (f.properties as { segmentName?: string })?.segmentName as string
      const unitOffset = interpolatedOffsets.get(segName) ?? 0
      return { ...f, properties: { ...f.properties, overlapOffsetPx: unitOffset * globalStepSize } }
    })
    return { ...segmentedRoutes.fc, features } as RoutesFeatureCollection
  }, [segmentedRoutes, interpolatedOffsets, globalStepSize])

  useEffect(() => {
    setSaveSuccess(false)
  }, [segmentOffsets, globalStepSize])

  const handleLoadSavedSettings = useCallback(() => {
    if (!latestSavedSettings) return
    setSegmentOffsets(new Map(Object.entries(latestSavedSettings.segmentOffsets)))
    setGlobalStepSize(latestSavedSettings.globalStepSize)
  }, [latestSavedSettings])

  const handleReset = useCallback(() => {
    if (!confirm('Reset all offset settings back to zero?')) return
    setSegmentOffsets(new Map())
    setGlobalStepSize(DEFAULT_STEP_SIZE)
  }, [])

  const handleSaveRoutes = useCallback(async () => {
    if (!processedRoutes) return
    setSaving(true)
    setSaveSuccess(false)
    const newSettings: ProcessedSettings = {
      segmentOffsets: Object.fromEntries(segmentOffsets),
      globalStepSize,
    }
    try {
      const res = await saveRoutes(processedRoutes, newSettings)
      if (res.ok) {
        setLatestSavedSettings(newSettings)
        setSaveSuccess(true)
      }
    } finally {
      setSaving(false)
    }
  }, [processedRoutes, segmentOffsets, globalStepSize])

  const filteredRoutes = useMemo(() => {
    if (routeStates.size === 0) return processedRoutes
    const features = processedRoutes.features
      .map(f => {
        const segName = (f.properties as { segmentName?: string }).segmentName as string
        const state = routeStates.get(segName)
        if (state === 'hidden') return null
        if (state === 'magenta') return { ...f, properties: { ...f.properties, color: '#ff00ff' } }
        return f
      })
      .filter(Boolean) as RoutesFeatureCollection['features']
    return { ...processedRoutes, features }
  }, [processedRoutes, routeStates])

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const mapboxMap = new mapboxgl.Map({
      ...mapConfig,
      container,
    })

    const resizeObserver = new ResizeObserver(() => mapboxMap.resize())
    resizeObserver.observe(container)

    // Belt-and-braces: mapbox reads container size synchronously in the
    // constructor, and if that happens before the first layout pass the height
    // falls back to Mapbox's 300px default. Force a re-measure once the browser
    // has definitely laid the element out.
    requestAnimationFrame(() => mapboxMap.resize())

    mapboxMap.on('load', () => {
      mapboxMap.addSource('features', {
        type: 'geojson',
        data: fc,
      })

      mapboxMap.addSource('lines', {
        type: 'geojson',
        data: filteredRoutesRef.current ?? routes,
      })

      mapboxMap.addLayer({
        id: 'lines',
        type: 'line',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['-', 100, ['get', 'order']],
        },
        paint: {
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8.763,
            1.5,
            15,
            3,
            22,
            3,
          ],
          'line-color': ['get', 'color'],
          'line-offset': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            ['coalesce', ['get', 'overlapOffsetPx'], 0],
            13,
            ['*', 2, ['coalesce', ['get', 'overlapOffsetPx'], 0]],
            18,
            ['*', 4, ['coalesce', ['get', 'overlapOffsetPx'], 0]],
          ],
        },
        source: 'lines',
      })

      mapboxMap.addLayer({
        type: 'circle',
        source: 'features',
        id: 'stations',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            1.5,
            16,
            10,
          ],
          'circle-color': '#ffffff',
          'circle-stroke-color': 'rgb(122, 122, 122)',
          'circle-stroke-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8,
            0.5,
            22,
            2,
          ],
        },
      })

      const box = bbox(routes)

      mapboxMap.fitBounds(
        [
          [box[0], box[1]],
          [box[2], box[3]],
        ],
        { padding: 100, duration: 0 },
      )

      mapboxMap.setMaxBounds([
        [box[0] - 1, box[1] - 1],
        [box[2] + 1, box[3] + 1],
      ])

      mapboxMap.once('data', () => {
        setMap((m) => (m === null ? mapboxMap : m))
      })

      mapboxMap.once('idle', () => {
        setMap((m) => (m === null ? mapboxMap : m))
      })
    })

    return () => {
      resizeObserver.disconnect()
      setMap(null)
      mapboxMap.remove()
    }
  // routes intentionally excluded — updates flow via filteredRoutesRef.current/setData, not map reinit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fc, lines, mapConfig])

  // Keep the lines source up-to-date when filteredRoutes changes
  useEffect(() => {
    filteredRoutesRef.current = filteredRoutes
    if (!map) return
    const src = map.getSource('lines') as mapboxgl.GeoJSONSource | undefined
    if (src) src.setData(filteredRoutes)
  }, [filteredRoutes, map])

  return (
    <>
      <div
        ref={mapContainerRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white px-6 py-4 shadow-xl text-sm font-medium text-gray-700 flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Saving routes…
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-10 flex flex-col max-w-sm" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="overflow-y-auto rounded-lg bg-white shadow-md text-xs">
          {/* Global step size control */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Step size</span>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={globalStepSize}
                onChange={e => setGlobalStepSize(Number(e.target.value))}
                className="flex-1 h-1 accent-gray-600"
              />
              <span className="text-[10px] font-mono text-gray-600 w-6 text-right">{globalStepSize}</span>
            </div>
          </div>

          {/* Per-line collapsible sections */}
          <div className="p-2 flex flex-col gap-1">
            {[...segmentsByLine.entries()].map(([lineKey, segNames]) => {
              const lineConfig = lines[lineKey]
              if (!lineConfig) return null
              const isExpanded = expandedLines.has(lineKey)
              const color = lineConfig.color

              return (
                <div key={lineKey} className="rounded border border-gray-100 overflow-hidden">
                  {/* Collapsible line header */}
                  <button
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                    onClick={() => setExpandedLines(prev => {
                      const next = new Set(prev)
                      if (next.has(lineKey)) next.delete(lineKey)
                      else next.add(lineKey)
                      return next
                    })}
                  >
                    <span className="flex-1">{lineConfig.name}</span>
                    <span className="text-[10px] opacity-70">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Segment rows */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {segNames.map(segName => {
                        const isExplicit = segmentOffsets.has(segName)
                        const interpolated = interpolatedOffsets.get(segName) ?? 0
                        const displayValue = interpolated
                        const segInfo = segmentInfoMap.get(segName)
                        const isOverlap = segInfo?.type === 'overlap'

                        const routeState = routeStates.get(segName)

                        return (
                          <div key={segName} className="flex items-center gap-1.5 px-2 py-1">
                            {/* Visibility toggle */}
                            <button
                              className="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
                              style={
                                routeState === 'magenta'
                                  ? { backgroundColor: '#ff00ff', borderColor: '#ff00ff' }
                                  : routeState === 'hidden'
                                  ? { backgroundColor: 'transparent', borderColor: '#d1d5db', borderStyle: 'dashed' }
                                  : { backgroundColor: color, borderColor: color }
                              }
                              title={routeState === 'magenta' ? 'Highlighted' : routeState === 'hidden' ? 'Hidden' : 'Visible'}
                              onClick={() => setRouteStates(prev => {
                                const next = new Map(prev)
                                const current = next.get(segName)
                                if (!current) next.set(segName, 'magenta')
                                else if (current === 'magenta') next.set(segName, 'hidden')
                                else next.delete(segName)
                                return next
                              })}
                            />
                            {/* Segment name */}
                            <span
                              className={`font-mono text-[10px] flex-1 truncate ${routeState === 'hidden' ? 'line-through text-gray-300' : isOverlap ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}
                              title={segName}
                            >
                              {segName}
                            </span>

                            {/* Offset controls */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button
                                className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-[11px] font-bold"
                                disabled={displayValue <= -5}
                                onClick={() => setSegmentOffsets(prev => {
                                  const next = new Map(prev)
                                  next.set(segName, Math.max(-5, (Math.ceil(displayValue * 2) - 1) / 2))
                                  return next
                                })}
                              >−</button>
                              <span
                                className={`w-8 text-center text-[10px] font-mono tabular-nums ${isExplicit ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}
                              >
                                {displayValue % 1 === 0 ? displayValue.toFixed(0) : displayValue.toFixed(1)}
                              </span>
                              <button
                                className="w-5 h-5 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30 text-[11px] font-bold"
                                disabled={displayValue >= 5}
                                onClick={() => setSegmentOffsets(prev => {
                                  const next = new Map(prev)
                                  next.set(segName, Math.min(5, (Math.floor(displayValue * 2) + 1) / 2))
                                  return next
                                })}
                              >+</button>
                              {/* Reset button — only shown when explicitly set */}
                              <button
                                className={`w-5 h-5 flex items-center justify-center rounded text-[10px] transition-opacity ${isExplicit ? 'text-gray-400 hover:text-red-400 hover:bg-red-50' : 'opacity-0 pointer-events-none'}`}
                                onClick={() => setSegmentOffsets(prev => {
                                  const next = new Map(prev)
                                  next.delete(segName)
                                  return next
                                })}
                                title="Reset to interpolated"
                              >×</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-t border-gray-100 flex flex-col gap-1.5">
            {latestSavedSettings && !savedSettingsMatchCurrent && (
              <button
                className="w-full rounded px-3 py-1.5 text-xs font-semibold border transition-colors"
                style={{ backgroundColor: '#f9fafb', borderColor: '#d1d5db', color: '#374151' }}
                onClick={handleLoadSavedSettings}
              >
                Load saved settings
              </button>
            )}
            {hasChanges && (
              <button
                className="w-full rounded px-3 py-1.5 text-xs font-semibold border transition-colors"
                style={{ backgroundColor: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                onClick={handleReset}
              >
                Reset all changes
              </button>
            )}
            <button
              className="w-full rounded px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              style={{
                backgroundColor: saveSuccess ? '#16a34a' : hasChanges ? '#374151' : '#9ca3af',
                cursor: hasChanges && !saving ? 'pointer' : 'not-allowed',
              }}
              disabled={!hasChanges || saving}
              onClick={handleSaveRoutes}
            >
              {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save processed routes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
