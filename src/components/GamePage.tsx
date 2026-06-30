'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Fuse from 'fuse.js'
import { useLocalStorageValue } from '@react-hookz/web'
import mapboxgl from 'mapbox-gl'
import { coordEach } from '@turf/meta'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'react-circular-progressbar/dist/styles.css'
import MenuComponent from '@/components/Menu'
import IntroModal from '@/components/IntroModal'
import FoundSummary from '@/components/FoundSummary'
import {
  DataFeatureCollection,
  DataFeature,
  RoutesFeatureCollection,
} from '@/lib/types'
import Input from '@/components/Input'
import useHideLabels from '@/hooks/useHideLabels'
import StripeModal from '@/components/StripeModal'
import { useConfig } from '@/lib/configContext'
import useTranslation from '@/hooks/useTranslation'
import FoundList from '@/components/FoundList'
import useNormalizeString from '@/hooks/useNormalizeString'
import { bbox } from '@turf/turf'

export default function GamePage({
  fc,
  routes,
  callout,
}: {
  fc: DataFeatureCollection
  routes?: RoutesFeatureCollection
  callout?: React.ReactNode
}) {
  const { BEG_THRESHOLD, CITY_NAME, MAP_CONFIG, LINES, MAP_FROM_DATA } =
    useConfig()
  const { t } = useTranslation()

  const normalizeString = useNormalizeString()

  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { hideLabels, setHideLabels } = useHideLabels(map)
  const [showStripeModal, setShowStripeModal] = useState<boolean>(false)

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
          data: routes,
        })

        mapboxMap.addLayer({
          id: 'lines',
          type: 'line',
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
            'line-offset': ['match', ['get', 'line'], '', 2, 0],
          },
          source: 'lines',
          layout: {
            'line-sort-key': ['-', 100, ['get', 'order']],
          },
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
      mapboxMap.remove()
    }
  }, [setMap, fc, LINES, MAP_CONFIG, MAP_FROM_DATA, routes])

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

    for (let id of found) {
      map.setFeatureState({ source: 'features', id }, { found: true })
    }
  }, [found, map])

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
    <div className="flex h-screen flex-row items-top justify-between">
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
      </div>
      <div className="z-10 hidden h-full overflow-y-auto bg-zinc-50 p-6 shadow-lg lg:block lg:w-96 xl:w-[32rem]">
        <FoundSummary
          foundProportion={foundProportion}
          foundStationsPerLine={foundStationsPerLine}
          stationsPerLine={stationsPerLine}
          minimizable
          defaultMinimized
        />
        {callout}
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
