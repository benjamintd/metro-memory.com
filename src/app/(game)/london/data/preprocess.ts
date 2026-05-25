import Color from 'color'
import { promises as fs } from 'fs'
import pkg from 'lodash'
import * as path from 'path'
const { groupBy, mapValues, sortBy, uniqBy } = pkg

import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const Bun = {
  file(path: string) {
    return {
      async json() {
        return JSON.parse(await fs.readFile(path, 'utf8'))
      },
    }
  },

  async write(path: string, content: string) {
    await fs.writeFile(path, content, 'utf8')
  },
}

const main = async () => {
  // --- STATIONS ---
  const data = Bun.file(path.join(__dirname, './source.json'))

  const { routes, stops } = (await data.json()) as any

  const availableLines = new Set(
    routes.map((route: any) => route.live_line_code),
  )

  const featuresRoutes = routes
    .flatMap((route: any, i: number) => {
      return route.patterns.map((pattern: any) => {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pattern.path.map((coord: any) => [coord[1], coord[0]]),
          },
          properties: {
            line: route.live_line_code,
            name: route.name,
            color: route.color,
            order: i,
          },
        }
      })
    })
    .filter((feature: any) => availableLines.has(feature.properties.line))

  // Load in a previous features.json to preserve existing station ids
  let oldFeatures: any[] = []
  const oldData = Bun.file(path.join(__dirname, './features-old.json'))
  oldFeatures = (await oldData.json() as any).features || []
  
  console.log(oldFeatures.length)

  const oldFeatureMap: { [key: string]: any } = {}
  oldFeatures.forEach((feature) => {
    const name = feature.properties.name
    const line = feature.properties.line
    const key = name + '-' + line
    oldFeatureMap[key] = feature
  })

  const usedIds = new Set<number>();

  oldFeatures.forEach(feature => usedIds.add(feature.id))

  let index = 0

  const featuresStations = uniqBy(
    routes.flatMap((route: any) => {
      return route.patterns
        .flatMap((pattern: any) => {
          return pattern.stop_points.map(
            ({ id: code, path_index }: { id: string; path_index: number }) => {
              let id: number
              const key = stops[code].name + '-' + route.live_line_code
              if (oldFeatureMap[key]) {
                id = oldFeatureMap[key].id
              }
              else {
                while (usedIds.has(index)) {
                  index++
                }
                id = index;
                usedIds.add(id)
              }

              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [
                    stops[code].coords[1],
                    stops[code].coords[0],
                  ],
                },
                properties: {
                  id,
                  name: stops[code].name,
                  line: route.live_line_code,
                  order: path_index,
                },
                id,
              }
            },
          )
        })
        .filter((feature: any) => availableLines.has(feature.properties.line))
    }),
    (f: any) => f.properties.line + f.properties.name,
  )



  Bun.write(
    path.join(__dirname, './features.json'),
    JSON.stringify(
      {
        type: 'FeatureCollection',
        features: sortBy(
          featuresStations,
          (f) => -(f.properties.order || Infinity),
        ),
        properties: {
          totalStations: featuresStations.length,
          stationsPerLine: mapValues(
            groupBy(featuresStations, (feature) => feature.properties!.line),
            (stations) => stations.length,
          ),
        },
      },
      null,
      2,
    ),
  )

  Bun.write(
    path.join(__dirname, './routes.json'),
    JSON.stringify(
      {
        type: 'FeatureCollection',
        features: sortBy(featuresRoutes, (f) => -f.properties.order),
      },
      null,
      2,
    ),
  )

  Bun.write(
    path.join(__dirname, './lines.json'),
    JSON.stringify(
      routes.reduce((acc: any, route: any, i: number) => {
        acc[route.live_line_code] = {
          name: route.name,
          color: route.color,
          backgroundColor: Color(route.color).darken(0.5).hex(),
          textColor: route.text_color || '#FFFFFF',
          order: i,
        }
        return acc
      }, {}),
      null,
      2,
    ),
  )
}

main()
