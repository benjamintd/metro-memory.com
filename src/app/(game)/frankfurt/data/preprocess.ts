import * as path from 'path'
import { groupBy, mapValues, sortBy, uniqBy } from 'lodash'
import { promises as fs } from 'fs'
import Color from 'color'

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

  let index = 0

  const featuresStations = uniqBy(
    routes.flatMap((route: any) => {
      return route.patterns
        .flatMap((pattern: any) => {
          return pattern.stop_points.map(
            ({ id: code, path_index }: { id: string; path_index: number }) => {
              const id = ++index
              return {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [
                    pattern.path[path_index][1],
                    pattern.path[path_index][0],
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
