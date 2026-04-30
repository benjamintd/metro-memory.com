import Color from 'color'
import { promises as fs } from 'fs'
import * as path from 'path'

export type SourceJson = {
  lines: {
    lineId: string
    relations: {
      relationId: number
      stationsNodeIds: number[]
      routesWayIds: number[]
    }[]
    extraStationNodeIds: number[]
    extraRouteWayIds: number[]
  }[]
  ways: { wayId: number; nodeIds: number[] }[]
  nodes: { nodeId: number; name?: string; lat: number; lon: number }[]
}

// ----------------------------------------
// line configuration
// ----------------------------------------
export const linesMetadata: {
  [id: string]: {
    name: string
    osm: {
      relationIds: number[]
      extraStationNodeIds: number[]
      extraRouteWayIds: number[]
    }
    color: string
  }
} = {
  LyonA: {
    name: 'A',
    osm: {
      relationIds: [153123],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#EB4599',
  },
  LyonB: {
    name: 'B',
    osm: {
      relationIds: [113907],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#0076C0',
  },
  LyonC: {
    name: 'C',
    osm: {
      relationIds: [3687321],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#F79829',
  },
  LyonD: {
    name: 'D',
    osm: {
      relationIds: [113903],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#00A950',
  },
  LyonF1: {
    name: 'F1',
    osm: {
      relationIds: [5972769],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#8BC752',
  },
  LyonF2: {
    name: 'F2',
    osm: {
      relationIds: [5972767],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#8BC752',
  },
  LyonT1: {
    name: 'T1',
    osm: {
      relationIds: [1689215],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT2: {
    name: 'T2',
    osm: {
      relationIds: [2519561],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT3: {
    name: 'T3',
    osm: {
      relationIds: [2523792],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT4: {
    name: 'T4',
    osm: {
      relationIds: [2524191],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT5: {
    name: 'T5',
    osm: {
      relationIds: [2578549],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT6: {
    name: 'T6',
    osm: {
      relationIds: [10218859],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonT7: {
    name: 'T7',
    osm: {
      relationIds: [6794364],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#873F98',
  },
  LyonRX: {
    name: 'Rhône Express',
    osm: {
      relationIds: [2523935],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#b80e28',
  },
}



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

type StationsFeatureCollection = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: {
      id: number
      name: string
      alternate_names?: string[]
      line: string
      order: number
    }
    id: number
  }[]
  properties: {
    totalStations: number
    stationsPerLine: {
      [lineId: string]: number
    }
    nextStationId?: number
  }
}

type RoutesFeatureCollection = {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    geometry: {
      type: 'LineString'
      coordinates: [number, number][]
    }
    properties: {
      line: string
      name: string
      color: string
      order: number
    }
  }[]
}

function getStationMapKeyByLineIdAndName(args: {
  lineId: string
  name: string
}): string {
  return `${args.lineId}::${args.name}`
}

function getStationMapKeyByLineIdAndNodeId(args: {
  lineId: string
  nodeId: number
}): string {
  return `${args.lineId}::${args.nodeId}`
}

async function parseOldStationsAndCreateStationIdGetter(): Promise<
  (args: { lineId: string; name: string }) => number
> {
  const oldStationsIdMap = new Map<string, number>()
  let maxStationId = 0
  try {
    const oldFeatureCollection = Bun.file(
      path.join('C:/Users/nbeli/Documents/metro-memory/src/app/(game)/lyon/data', './features.json'),
    )
    const { features, properties } =
      (await oldFeatureCollection.json()) as StationsFeatureCollection
    maxStationId = (properties.nextStationId ?? 1) - 1
    for (const feature of features) {
      const { name, line, id } = feature.properties
      oldStationsIdMap.set(
        getStationMapKeyByLineIdAndName({
          lineId: line,
          name,
        }),
        id,
      )
      maxStationId = Math.max(maxStationId, id)
    }
  } catch (err) {
    console.warn(
      'Could not find or parse old features.json',
      (err as Error).message,
    )
  }
  let nextStationId = maxStationId + 1

  function getStationId(args: { lineId: string; name: string }): number {
    const mapKey = getStationMapKeyByLineIdAndName(args)
    return oldStationsIdMap.get(mapKey) ?? nextStationId++
  }
  return getStationId
}

function toMap<T, K extends keyof T>(
  array: T[],
  keyPropertyName: K,
): Map<T[K], T> {
  const map = new Map<T[K], T>()
  for (const item of array) {
    map.set(item[keyPropertyName], item)
  }
  return map
}

function isDefined<T>(arg: T): arg is Exclude<T, null | undefined> {
  return arg !== null && typeof arg !== 'undefined'
}

const main = async () => {
  const data = Bun.file(path.join('C:/Users/nbeli/Documents/metro-memory/src/app/(game)/lyon/data', './source.json'))
  const { lines, nodes, ways } = (await data.json()) as SourceJson

  const getStationId = await parseOldStationsAndCreateStationIdGetter()
  const waysMap = toMap(ways, 'wayId')
  const nodesMap = toMap(nodes, 'nodeId')

  // lines
  const augmentedLinesMetadataMap = new Map<
    string,
    (typeof linesMetadata)[string] & {
      id: string
      order: number
      latLonOffset: number
    }
  >()
  const sortedLineIds = Object.entries(linesMetadata)
    .sort(([, lineMetadata1], [, lineMetadata2]) =>
      lineMetadata1.name.localeCompare(lineMetadata2.name),
    )
    .map(([lineId, lineMetadata], ix, arr): string => {
      const numLines = arr.length
      augmentedLinesMetadataMap.set(lineId, {
        ...lineMetadata,
        id: lineId,
        order: ix + 1,
        latLonOffset: (ix / (numLines - 1) - 0.5) * 0.000_015,
      })
      return lineId
    })

  console.debug(`Writing ${sortedLineIds.length} lines to lines.json ...`)
  Bun.write(
    path.join('C:/Users/nbeli/Documents/metro-memory/src/app/(game)/lyon/data', './lines.json'),
    JSON.stringify(
      sortedLineIds.reduce(
        (acc, lineId) => {
          const lineMetadata = augmentedLinesMetadataMap.get(lineId)!
          acc[lineId] = {
            name: lineMetadata.name,
            color: lineMetadata.color,
            backgroundColor: Color(lineMetadata.color).darken(0.5).hex(),
            textColor: '#FFFFFF',
            order: lineMetadata.order,
          }
          return acc
        },
        {} as {
          [lineId: string]: {
            name: string
            color: string
            backgroundColor: string
            textColor: string
            order: number
          }
        },
      ),
      null,
      2,
    ),
  )

  // stations
  type StationDetails = {
    name: string
    coords: {
      lat: number
      lon: number
      lineIds: Map<string, boolean>
      nodeIds: { lineId: string; nodeId: number }[]
    }[]
    stationIdByLineId: Map<string, number>
    alternateNames: string[]
  }
  /**
   * Get station details but ensure we have each station only once (per line), i.e. usually a station has at least two
   * nodes (one for each direction of the line) but we only want to have one.
   * As we want to access it by lineId/nodeId later, we eventually build another map for that purpose.
   */
  function getUniqueStationsByLineIdAndNodeId(): Map<string, StationDetails> {
    const mapUniqueStationsByName = new Map<string, StationDetails>()
    for (const line of lines) {
      for (const stationNodeId of line.relations
        .map((relation) => relation.stationsNodeIds)
        .flat()
        .concat(...line.extraStationNodeIds)) {
        const stationNode = nodesMap.get(stationNodeId)!
        if (!stationNode.name)
          throw new Error(
            `Unknown name for station with node id ${stationNodeId}`,
          )
        const existingStation = mapUniqueStationsByName.get(stationNode.name)
        if (existingStation === undefined) {
          mapUniqueStationsByName.set(stationNode.name, {
            name: stationNode.name,
            coords: [
              {
                lat: stationNode.lat,
                lon: stationNode.lon,
                lineIds: new Map<string, boolean>([[line.lineId, true]]),
                nodeIds: [{ lineId: line.lineId, nodeId: stationNodeId }],
              },
            ],
            stationIdByLineId: new Map<string, number>([
              [
                line.lineId,
                getStationId({ lineId: line.lineId, name: stationNode.name }),
              ],
            ]),
            alternateNames: [],
          })
        } else {
          if (existingStation.stationIdByLineId.has(line.lineId) === false) {
            existingStation.stationIdByLineId.set(
              line.lineId,
              getStationId({ lineId: line.lineId, name: stationNode.name }),
            )
          }
          const existingCoords = existingStation.coords.find(
            (c) => c.lat === stationNode.lat && c.lon === stationNode.lon,
          )
          if (existingCoords) {
            existingCoords.lineIds.set(line.lineId, true)
            existingCoords.nodeIds.push({
              lineId: line.lineId,
              nodeId: stationNodeId,
            })
          } else {
            existingStation.coords.push({
              lat: stationNode.lat,
              lon: stationNode.lon,
              lineIds: new Map<string, boolean>([[line.lineId, true]]),
              nodeIds: [{ lineId: line.lineId, nodeId: stationNodeId }],
            })
          }
        }
      }
    }
    const mapUniqueStationsByLineIdAndNodeId = new Map<string, StationDetails>()
    for (const stationDetails of mapUniqueStationsByName.values()) {
      // sort nodes by which node covers more lines -> ideally first node covers all lines and only in rare cases we need to use 2nd+ node for some lines (if there's no node matching all lines)
      stationDetails.coords.sort(
        (c1, c2) =>
          c2.lineIds.size - c1.lineIds.size ||
          c1.lat - c2.lat ||
          c1.lon - c2.lon,
      )
      for (const coords of stationDetails.coords) {
        for (const { lineId, nodeId } of coords.nodeIds) {
          mapUniqueStationsByLineIdAndNodeId.set(
            getStationMapKeyByLineIdAndNodeId({ lineId, nodeId }),
            stationDetails,
          )
        }
      }
    }

    // print unique station names a-z (for easier review where alternate names are missing / might be helpful)
    const stationSortedAtoZ = [...mapUniqueStationsByName.values()].sort(
      (s1, s2) => s1.name.localeCompare(s2.name),
    )
    console.debug(`Stations (a-z, ${stationSortedAtoZ.length}):`)
    for (const station of stationSortedAtoZ) {
      console.debug(
        `  ${station.name}${
          station.alternateNames.length > 0
            ? `   (${station.alternateNames.join('; ')})`
            : ''
        }`,
      )
    }

    return mapUniqueStationsByLineIdAndNodeId
  }
  const mapUniqueStationsByLineIdAndNodeId =
    getUniqueStationsByLineIdAndNodeId()
  const mapStationsUsed = new Map<string, boolean>()
  const stationFeatures: StationsFeatureCollection['features'] = lines
    .map((line) => {
      const nodeIds = [
        // we sort relations by length to get most-complete list of stations so that order of station names in output is closest to actual order and stations are not too scattered
        ...line.relations
          .sort((r1, r2) =>
            r1.stationsNodeIds.length !== r2.stationsNodeIds.length
              ? r2.stationsNodeIds.length - r1.stationsNodeIds.length
              : r1.relationId - r2.relationId,
          )
          .map((relation) => relation.stationsNodeIds)
          .flat(),
        ...line.extraStationNodeIds,
      ]
      return nodeIds
        .map((nodeId) => {
          const stationDetails = mapUniqueStationsByLineIdAndNodeId.get(
            getStationMapKeyByLineIdAndNodeId({
              lineId: line.lineId,
              nodeId,
            }),
          )!
          const coords = stationDetails.coords.find((c) =>
            c.lineIds.has(line.lineId),
          )!
          // we check if we already have station with that name at those coordinates for that line
          const mapKey = `${line.lineId}::${stationDetails.name}::${coords.lat}::${coords.lon}`
          if (mapStationsUsed.has(mapKey)) {
            // we already have this station in the output => skip
            return undefined
          } else {
            mapStationsUsed.set(mapKey, true)
            return {
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [coords.lon, coords.lat] as [number, number],
              },
              properties: {
                id: stationDetails.stationIdByLineId.get(line.lineId)!,
                name: stationDetails.name,
                alternateNames: [],
                line: line.lineId,
                order: augmentedLinesMetadataMap.get(line.lineId)!.order,
              },
              id: stationDetails.stationIdByLineId.get(line.lineId)!,
            }
          }
        })
        .filter(isDefined)
    })
    .flat()
  const mapStationsNamesUsed = new Map<string, boolean>()
  const mapStationsNamesUsedByLine = new Map<string, boolean>()
  const stations: StationsFeatureCollection = {
    type: 'FeatureCollection',
    features: stationFeatures,
    properties: {
      ...stationFeatures.reduce(
        (properties, station) => {
          if (mapStationsNamesUsed.has(station.properties.name) === false) {
            mapStationsNamesUsed.set(station.properties.name, true)
            properties.totalStations += 1
          }
          const mapKey = getStationMapKeyByLineIdAndName({
            lineId: station.properties.line,
            name: station.properties.name,
          })
          if (mapStationsNamesUsedByLine.has(mapKey) === false) {
            mapStationsNamesUsedByLine.set(mapKey, true)
            properties.stationsPerLine[station.properties.line] += 1
          }
          return properties
        },
        {
          totalStations: 0,
          stationsPerLine: Object.fromEntries(
            lines.map((line) => [line.lineId, 0]),
          ),
        },
      ),
      // using a non-existant line/station to get next station id
      nextStationId: getStationId({ lineId: '', name: '' }),
    },
  }

  console.debug(
    `Writing ${stations.features.length} stations to features.json ...`,
  )
  stationFeatures.forEach((station) =>
    console.debug(`  ${station.properties.line} ${station.properties.name}`),
  )
  Bun.write(
    path.join('C:/Users/nbeli/Documents/metro-memory/src/app/(game)/lyon/data', './features.json'),
    JSON.stringify(stations, null, 2),
  )

  // routes
  const routes: RoutesFeatureCollection = {
    type: 'FeatureCollection',
    features: lines
      .map((line) => {
        const wayIds = [
          ...line.relations.map((relation) => relation.routesWayIds).flat(),
          ...line.extraRouteWayIds,
        ]
        const uniqueWayIds = [...new Set(wayIds)].sort((w1, w2) => w1 - w2)
        return uniqueWayIds.map((wayId) => {
          const nodeIds = waysMap.get(wayId)!.nodeIds
          const nodes = nodeIds.map((nodeId) => nodesMap.get(nodeId)!)
          const { latLonOffset, name, color, order } =
            augmentedLinesMetadataMap.get(line.lineId)!
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: nodes.map(
                (node) =>
                  [node.lon + latLonOffset, node.lat + latLonOffset] as [
                    number,
                    number,
                  ],
              ),
            },
            properties: {
              line: line.lineId,
              name,
              color,
              order,
            },
          }
        })
      })
      .flat(),
  }

  console.debug(`Writing ${routes.features.length} paths to routes.json ...`)
  Bun.write(
    path.join('C:/Users/nbeli/Documents/metro-memory/src/app/(game)/lyon/data', './routes.json'),
    JSON.stringify(routes, null, 2),
  )
}

main()
