'use client'

import FoundList from '@/components/FoundList'
import FoundSummary from '@/components/FoundSummary'
import Input from '@/components/Input'
import IntroModal from '@/components/IntroModal'
import MenuComponent from '@/components/Menu'
import StripeModal from '@/components/StripeModal'
import useHideLabels from '@/hooks/useHideLabels'
import useNormalizeString from '@/hooks/useNormalizeString'
import useTranslation from '@/hooks/useTranslation'
import { useConfig } from '@/lib/configContext'
import {
  buildSegmentedRoutes,
  computeInterpolatedOffsets,
  detectOverlapSections,
  processRoutesForSameLineOverlaps
} from '@/lib/lineOffsetting'
import {
  DataFeature,
  DataFeatureCollection,
  ProcessedSettings,
  RoutesFeatureCollection,
} from '@/lib/types'
import { useLocalStorageValue } from '@react-hookz/web'
import { coordEach } from '@turf/meta'
import { bbox } from '@turf/turf'
import Fuse from 'fuse.js'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'react-circular-progressbar/dist/styles.css'

const DEFAULT_STEP_SIZE = 3

export default function GamePage({
  fc,
  routes,
  savedSettings,
}: {
  fc: DataFeatureCollection
  routes?: RoutesFeatureCollection
  savedSettings?: ProcessedSettings
}) {
  const { BEG_THRESHOLD, CITY_NAME, MAP_CONFIG, LINES, MAP_FROM_DATA, OFFSET_PROCESSING_MODE } =
    useConfig()
  const { t } = useTranslation()

  const normalizeString = useNormalizeString()

  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const filteredRoutesRef = useRef<typeof routes | undefined>(undefined)
  const { hideLabels, setHideLabels } = useHideLabels(map)
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false)
  const [routeStates, setRouteStates] = useState<Map<string, 'hidden' | 'magenta'>>(new Map())
  const [segmentOffsets, setSegmentOffsets] = useState<Map<string, number>>(new Map())
  const [globalStepSize, setGlobalStepSize] = useState<number>(3)
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  // Mirrors what's actually on disk — starts from the server-loaded prop, updated after each save
  const [latestSavedSettings, setLatestSavedSettings] = useState<ProcessedSettings | undefined>(savedSettings)

  // Show overlay while map is initialising (startup + any post-save reinit) — dev tool only
  const showSavingOverlay = !!OFFSET_PROCESSING_MODE && (!map || saving)

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

  const { value: hasShownStripeModal, set: setHasShownStripeModal } =
    useLocalStorageValue<boolean>('has-shown-stripe-modal', {
      defaultValue: false,
      initializeWithValue: false,
    })

  const idMap = useMemo(() => {
    const map = new Map<number, DataFeature>()
    fc.features.forEach((feature) => {
      map.set(feature.id! as number, feature)
    })
    return map
  }, [fc.features])

  const stationsPerLine = useMemo(() => {
    const stationsPerLine: { [key: string]: number } = {}
    for (let feature of fc.features) {
      const line = feature.properties.line
      if (!line) {
        continue
      }
      stationsPerLine[line] = (stationsPerLine[line] || 0) + 1
    }

    return stationsPerLine
  }, [fc])

  const { value: localFound, set: setFound } = useLocalStorageValue<
    number[] | null
  >(`${CITY_NAME}-stations`, {
    defaultValue: null,
    initializeWithValue: false,
  })

  const { value: isNewPlayer, set: setIsNewPlayer } =
    useLocalStorageValue<boolean>(`${CITY_NAME}-stations-is-new-player`, {
      defaultValue: true,
      initializeWithValue: false,
    })

  const found: number[] = useMemo(() => {
    return (localFound || []).filter((f) => idMap.has(f))
  }, [localFound, idMap])

  const onReset = useCallback(() => {
    if (confirm(t('restartWarning'))) {
      setFound([])
      setIsNewPlayer(true)
      setHasShownStripeModal(false)
    }
  }, [setFound, setIsNewPlayer, setHasShownStripeModal, t])

  const foundStationsPerLine = useMemo(() => {
    const foundStationsPerLine: { [key: string]: number } = {}
    for (let id of found || []) {
      const feature = idMap.get(id)
      if (!feature) {
        continue
      }
      const line = feature.properties.line
      if (!line) {
        continue
      }
      foundStationsPerLine[line] = (foundStationsPerLine[line] || 0) + 1
    }

    return foundStationsPerLine
  }, [found, idMap])

  const fuse = useMemo(
    () =>
      new Fuse(fc.features, {
        includeScore: true,
        includeMatches: true,
        keys: [
          'properties.name',
          'properties.long_name',
          'properties.short_name',
          'properties.alternate_names',
        ],
        minMatchCharLength: 2,
        threshold: 0.15,
        distance: 10,
        getFn: (obj, path) => {
          const value = Fuse.config.getFn(obj, path)
          if (value === undefined) {
            return ''
          } else if (Array.isArray(value)) {
            return value.map((el) => normalizeString(el))
          } else {
            return normalizeString(value as string)
          }
        },
      }),
    [fc, normalizeString],
  )

  const foundProportion = found.length / fc.features.length

  // Station positions for transition splitting
  const stationsForOffsets = useMemo(() => {
    return fc.features
      .filter(f => f.geometry.type === 'Point')
      .map(f => ({ coord: f.geometry.coordinates as number[] }))
  }, [fc])

  // Step 1: Deduplicate same-line overlaps
  const deduped = useMemo(() => {
    if (!routes || !MAP_FROM_DATA || !OFFSET_PROCESSING_MODE) return undefined
    return processRoutesForSameLineOverlaps(routes, LINES)
  }, [routes, LINES, MAP_FROM_DATA, OFFSET_PROCESSING_MODE])

  // Step 2: Detect overlap sections between different lines
  const overlapSections = useMemo(() => {
    if (!deduped) return []
    return detectOverlapSections(deduped)
  }, [deduped])

  // Step 3: Build named segments (no auto offsets); split transition segments at stations
  const segmentedRoutes = useMemo(() => {
    if (!deduped || !MAP_FROM_DATA || !OFFSET_PROCESSING_MODE) return undefined
    return buildSegmentedRoutes(deduped, overlapSections, LINES, stationsForOffsets)
  }, [deduped, overlapSections, LINES, MAP_FROM_DATA, stationsForOffsets])

  const segmentInfoMap = segmentedRoutes?.segments
  const segmentsByLine = segmentedRoutes?.segmentsByLine
  const overlapSegmentNames = segmentedRoutes?.overlapSegmentNames

  // Step 4: Compute interpolated offsets
  const interpolatedOffsets = useMemo(() => {
    if (!segmentedRoutes) return new Map<string, number>()
    return computeInterpolatedOffsets(segmentedRoutes.segmentsByLine, segmentOffsets)
  }, [segmentedRoutes, segmentOffsets])

  // Step 5: Stamp overlapOffsetPx on each feature
  const processedRoutes = useMemo(() => {
    if (!segmentedRoutes) return undefined
    const features = segmentedRoutes.fc.features.map(f => {
      const segName = (f.properties as any)?.segmentName as string
      const unitOffset = interpolatedOffsets.get(segName) ?? 0
      return { ...f, properties: { ...f.properties, overlapOffsetPx: unitOffset * globalStepSize } }
    })
    return { ...segmentedRoutes.fc, features } as typeof routes
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
      const res = await fetch('/api/save-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: CITY_NAME, data: processedRoutes, settings: newSettings }),
      })
      if (res.ok) {
        setLatestSavedSettings(newSettings)
        setSaveSuccess(true)
      }
    } finally {
      setSaving(false)
    }
  }, [processedRoutes, CITY_NAME, segmentOffsets, globalStepSize])

  const filteredRoutes = useMemo(() => {
    if (!processedRoutes) return processedRoutes
    if (routeStates.size === 0) return processedRoutes
    const features = processedRoutes.features
      .map(f => {
        const segName = (f.properties as any).segmentName as string
        const state = routeStates.get(segName)
        if (state === 'hidden') return null
        if (state === 'magenta') return { ...f, properties: { ...f.properties, color: '#ff00ff' } }
        return f
      })
      .filter(Boolean) as typeof processedRoutes.features
    return { ...processedRoutes, features }
  }, [processedRoutes, routeStates])

  useEffect(() => {
    if (foundProportion > BEG_THRESHOLD && !hasShownStripeModal) {
      // once we reach a certain threshold, we show the stripe modal
      // and unlock the rest of the game.
      setShowStripeModal(true)
      setHasShownStripeModal(true)
    }
  }, [
    hasShownStripeModal,
    setHasShownStripeModal,
    foundProportion,
    found,
    setFound,
    idMap,
    BEG_THRESHOLD,
  ])

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const mapboxMap = new mapboxgl.Map(MAP_CONFIG)

    mapboxMap.on('load', () => {
      mapboxMap.addSource('features', {
        type: 'geojson',
        data: fc,
      })

      mapboxMap.addSource('hovered', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      if (MAP_FROM_DATA && routes) {
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
      }

      mapboxMap.addLayer({
        id: 'stations-hovered',
        type: 'circle',
        paint: {
          'circle-radius': 16,
          'circle-color': '#fde047',
          'circle-blur-transition': {
            duration: 100,
          },
          'circle-blur': 1,
        },
        source: 'hovered',
        filter: ['==', '$type', 'Point'],
      })

      mapboxMap.addLayer({
        type: 'circle',
        source: 'features',
        id: 'stations-circles',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            ['case', ['to-boolean', ['feature-state', 'found']], 2, 1],
            16,
            ['case', ['to-boolean', ['feature-state', 'found']], 6, 4],
          ],
          'circle-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            [
              'match',
              ['get', 'line'],
              ...Object.keys(LINES).flatMap((line) => [
                [line],
                LINES[line].color,
              ]),
              'rgba(255, 255, 255, 0.8)',
            ],
            'rgba(255, 255, 255, 0.8)',
          ],
          'circle-stroke-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            [
              'match',
              ['get', 'line'],
              ...Object.keys(LINES).flatMap((line) => [
                [line],
                LINES[line].backgroundColor,
              ]),
              'rgba(255, 255, 255, 0.8)',
            ],
            'rgba(255, 255, 255, 0.8)',
          ],
          'circle-stroke-width': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            1,
            0,
          ],
        },
        layout: {
          'circle-sort-key': ['-', 100, ['get', 'order']],
        },
      })

      mapboxMap.addLayer({
        minzoom: 11,
        layout: {
          'text-field': ['to-string', ['get', 'name']],
          'text-font': ['Cabin Regular', 'Arial Unicode MS Regular'],
          'text-anchor': 'bottom',
          'text-offset': [0, -0.5],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 12, 22, 14],
        },
        type: 'symbol',
        source: 'features',
        id: 'stations-labels',
        paint: {
          'text-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            'rgb(29, 40, 53)',
            'rgba(0, 0, 0, 0)',
          ],
          'text-halo-color': [
            'case',
            ['to-boolean', ['feature-state', 'found']],
            'rgba(255, 255, 255, 0.8)',
            'rgba(0, 0, 0, 0)',
          ],
          'text-halo-blur': 1,
          'text-halo-width': 1,
        },
      })

      mapboxMap.addLayer({
        id: 'hover-label-point',
        type: 'symbol',
        paint: {
          'text-halo-color': 'rgb(255, 255, 255)',
          'text-halo-width': 2,
          'text-halo-blur': 1,
          'text-color': 'rgb(29, 40, 53)',
        },
        layout: {
          'text-field': ['to-string', ['get', 'name']],
          'text-font': ['Cabin Bold', 'Arial Unicode MS Regular'],
          'text-anchor': 'bottom',
          'text-offset': [0, -0.6],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 14, 22, 16],
          'symbol-placement': 'point',
        },
        source: 'hovered',
        filter: ['==', '$type', 'Point'],
      })

      mapboxMap.once('data', () => {
        setMap((map) => (map === null ? mapboxMap : map))
      })

      mapboxMap.once('idle', () => {
        setMap((map) => (map === null ? mapboxMap : map))
        mapboxMap.on('mousemove', ['stations-circles'], (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features.find((f) => f.state.found && f.id)
            if (feature && feature.id) {
              return setHoveredId(feature.id as number)
            }
          }

          setHoveredId(null)
        })

        mapboxMap.on('mouseleave', ['stations-circles'], () => {
          setHoveredId(null)
        })
      })
    })

    return () => {
      setMap(null)
      mapboxMap.remove()
    }
  // routes intentionally excluded — updates flow via filteredRoutesRef.current/setData, not map reinit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMap, fc, LINES, MAP_CONFIG, MAP_FROM_DATA])

  useEffect(() => {
    if (!map) {
      return
    } else {
      ;(map.getSource('hovered') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: hoveredId ? [idMap.get(hoveredId)!] : [],
      })
    }
  }, [map, hoveredId, idMap])

  useEffect(() => {
    if (!map || !found) return

    map.removeFeatureState({ source: 'features' })

    for (const id of found) {
      map.setFeatureState({ source: 'features', id }, { found: true })
    }
  }, [found, map])

  // Keep the lines source up-to-date when filteredRoutes changes
  useEffect(() => {
    filteredRoutesRef.current = filteredRoutes
    if (!map || !filteredRoutes || !MAP_FROM_DATA) return
    const src = map.getSource('lines') as mapboxgl.GeoJSONSource | undefined
    if (src) src.setData(filteredRoutes as any)
  }, [filteredRoutes, map, MAP_FROM_DATA])

  const zoomToFeature = useCallback(
    (id: number) => {
      if (!map) return

      const feature = idMap.get(id)
      if (!feature) return

      if (feature.geometry.type === 'Point') {
        map.flyTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: 14,
        })
      } else {
        const bounds = new mapboxgl.LngLatBounds()
        coordEach(feature, (coord) => {
          bounds.extend(coord as [number, number])
        })
        map.fitBounds(bounds, { padding: 100 })
      }
    },
    [map, idMap],
  )

  return (
    <div className="relative flex h-screen flex-row items-top justify-between">
      {showSavingOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white px-6 py-4 shadow-xl text-sm font-medium text-gray-700 flex items-center gap-3">
            <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {saving ? 'Saving routes…' : 'Loading map…'}
          </div>
        </div>
      )}
      <div className="relative flex h-screen grow justify-center">
        <div className="absolute left-0 top-0 h-screen w-full" id="map" />
        <div className="absolute top-4 h-12 w-96 max-w-full px-1 lg:top-32">
          <FoundSummary
            className="mb-4 rounded-lg bg-white p-4 shadow-md lg:hidden"
            foundProportion={foundProportion}
            foundStationsPerLine={foundStationsPerLine}
            stationsPerLine={stationsPerLine}
            defaultMinimized
            minimizable
          />
          <div className="flex gap-2 lg:gap-4">
            <Input
              fuse={fuse}
              found={found}
              setFound={setFound}
              setIsNewPlayer={setIsNewPlayer}
              inputRef={inputRef}
              map={map}
              idMap={idMap}
            />
            <MenuComponent
              onReset={onReset}
              hideLabels={hideLabels}
              setHideLabels={setHideLabels}
            />
          </div>
        </div>

        {MAP_FROM_DATA && processedRoutes && segmentsByLine && segmentInfoMap && (
          <div className="absolute bottom-4 left-4 z-10 flex flex-col max-w-sm" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
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
                  const lineConfig = LINES[lineKey]
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
        )}
      </div>
      <div className="z-10 hidden h-full overflow-y-auto bg-zinc-50 p-6 shadow-lg lg:block lg:w-96 xl:w-[32rem]">
        <FoundSummary
          foundProportion={foundProportion}
          foundStationsPerLine={foundStationsPerLine}
          stationsPerLine={stationsPerLine}
          minimizable
          defaultMinimized
        />
        <hr className="my-4 w-full border-b border-zinc-100" />
        <FoundList
          found={found}
          idMap={idMap}
          setHoveredId={setHoveredId}
          hoveredId={hoveredId}
          hideLabels={hideLabels}
          zoomToFeature={zoomToFeature}
        />
      </div>
      <IntroModal
        inputRef={inputRef}
        open={isNewPlayer}
        setOpen={setIsNewPlayer}
      >
        {t('introInstruction')} ⏎
      </IntroModal>
      <StripeModal
        foundProportion={foundProportion}
        open={showStripeModal}
        setOpen={setShowStripeModal}
      />
    </div>
  )
}
