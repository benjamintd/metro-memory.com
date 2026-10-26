import Color from 'color'
import { promises as fs } from 'fs'
import * as path from 'path'
import {
  alternateNames,
  linesMetadata,
  renamedDistricts,
  renamedStations,
  renamedStationsInArea,
  stationNamesByNodeId,
  type SourceJson,
} from './config'

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
      path.join(__dirname, './features.json'),
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
  const data = Bun.file(path.join(__dirname, './source.json'))
  const {
    lines,
    nodes,
    ways,
    railwayStations,
    localStopCodes = [],
    stationAreas = {},
  } = (await data.json()) as SourceJson

  // unify station names (OSM names differ between S-Bahn, U-Bahn and tram stops)
  function renameStation(name: string, lat?: number, lon?: number): string {
    const areaRename = renamedStationsInArea.find(
      ({ area: [minLon, minLat, maxLon, maxLat], names }) =>
        names[name] &&
        lat !== undefined &&
        lon !== undefined &&
        lon >= minLon &&
        lon <= maxLon &&
        lat >= minLat &&
        lat <= maxLat,
    )
    return areaRename?.names[name] ?? renamedStations[name] ?? name
  }
  for (const node of nodes) {
    node.name ??= stationNamesByNodeId[node.nodeId]
    if (node.name) node.name = renameStation(node.name, node.lat, node.lon)
  }
  for (const stopCode of localStopCodes) {
    stopCode.name = renameStation(stopCode.name, stopCode.lat, stopCode.lon)
  }

  // stop positions without a name can't be guessed => skip them
  const namedNodeIds = new Set(
    nodes.filter((node) => node.name).map((node) => node.nodeId),
  )
  for (const line of lines) {
    for (const relation of line.relations) {
      const unnamed = relation.stationsNodeIds.filter(
        (nodeId) => !namedNodeIds.has(nodeId),
      )
      if (unnamed.length > 0) {
        console.debug(
          ` *** Warning: Skipping ${unnamed.length} unnamed stop(s) in relation ${relation.relationId} (${line.lineId}) ***`,
        )
        relation.stationsNodeIds = relation.stationsNodeIds.filter((nodeId) =>
          namedNodeIds.has(nodeId),
        )
      }
    }
  }

  const getStationId = await parseOldStationsAndCreateStationIdGetter()
  const waysMap = toMap(ways, 'wayId')
  const nodesMap = toMap(nodes, 'nodeId')

  // cut relations at a station (stops and ways are ordered along the route):
  // keep the part before it in one direction and the part after it in the other
  for (const line of lines) {
    const truncateAtStation = linesMetadata[line.lineId].osm.truncateAtStation
    if (!truncateAtStation) continue
    for (const relation of line.relations) {
      const stops = relation.stationsNodeIds
      const stopIndex = stops.findIndex(
        (nodeId) => nodesMap.get(nodeId)?.name === truncateAtStation,
      )
      const wayIndex = relation.routesWayIds.findIndex(
        (wayId) => waysMap.get(wayId)?.nodeIds.includes(stops[stopIndex]),
      )
      if (stopIndex < 0 || wayIndex < 0) {
        throw new Error(
          `Cannot cut relation ${relation.relationId} at ${truncateAtStation}`,
        )
      }
      const keepStart = stopIndex >= stops.length / 2
      relation.stationsNodeIds = keepStart
        ? stops.slice(0, stopIndex + 1)
        : stops.slice(stopIndex)
      relation.routesWayIds = keepStart
        ? relation.routesWayIds.slice(0, wayIndex + 1)
        : relation.routesWayIds.slice(wayIndex)
    }
  }

  // lines
  const augmentedLinesMetadataMap = new Map<
    string,
    (typeof linesMetadata)[string] & {
      id: string
      order: number
      latLonOffset: number
    }
  >()
  // lines keep the order of the config (S-Bahn, U-Bahn, tram)
  const sortedLineIds = Object.entries(linesMetadata).map(
    ([lineId, lineMetadata], ix, arr): string => {
      const numLines = arr.length
      augmentedLinesMetadataMap.set(lineId, {
        ...lineMetadata,
        id: lineId,
        order: ix + 1,
        latLonOffset: (ix / (numLines - 1) - 0.5) * 0.000_015,
      })
      return lineId
    },
  )

  console.debug(`Writing ${sortedLineIds.length} lines to lines.json ...`)
  Bun.write(
    path.join(__dirname, './lines.json'),
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
    const mapAlternateNamesUsed = new Map<string, boolean>()
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
          const stationAlternateNames = [
            ...(alternateNames[stationNode.name] ?? []),
          ]

          // Add some alternate names commonly used around the network
          if (/\s*\([^)]*\)/.test(stationNode.name)) {
            // e.g. "Hofheim (Taunus)" -> "Hofheim"
            stationAlternateNames.push(
              stationNode.name.replace(/\s*\([^)]*\)/g, '').trim(),
            )
          }
          if (stationNode.name.includes('Straße')) {
            stationAlternateNames.push(
              stationNode.name.replaceAll('Straße', 'Str'),
            )
          }
          if (stationNode.name.includes('straße')) {
            stationAlternateNames.push(
              stationNode.name.replaceAll('straße', 'str'),
            )
          }
          if (stationNode.name.includes('Bahnhof')) {
            stationAlternateNames.push(
              stationNode.name.replaceAll('Bahnhof', 'Bf'),
              stationNode.name.replaceAll(' Bahnhof', ''),
            )
          }
          if (stationNode.name.includes('Hauptbahnhof')) {
            stationAlternateNames.push(
              stationNode.name.replaceAll('Hauptbahnhof', 'Hbf'),
            )
          }
          if (/ bei /.test(stationNode.name)) {
            // e.g. "Neckarhausen bei Neckarsteinach" -> "Neckarhausen"
            stationAlternateNames.push(stationNode.name.split(' bei ')[0])
          }
          if (stationNode.name.includes('bei')) {
            stationAlternateNames.push(stationNode.name.replaceAll('bei', 'b.'))
          }

          if (alternateNames[stationNode.name]) {
            mapAlternateNamesUsed.set(stationNode.name, true)
          }
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
            alternateNames: stationAlternateNames,
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
    const distanceKm = (
      a: { lat: number; lon: number },
      b: { lat: number; lon: number },
    ) =>
      Math.hypot(
        (a.lat - b.lat) * 111,
        (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180),
      )
    for (const station of stationSortedAtoZ) {
      // S-Bahn stations can also be entered by their DS100 code (e.g. "FF")
      const sBahnCoords = station.coords.filter((coords) =>
        [...coords.lineIds.keys()].some((lineId) =>
          linesMetadata[lineId].name.startsWith('S'),
        ),
      )
      const nearbyRailwayStations = railwayStations
        .map((railwayStation) => ({
          ...railwayStation,
          distance: Math.min(
            ...sBahnCoords.map((c) => distanceKm(c, railwayStation)),
          ),
        }))
        .filter((railwayStation) => railwayStation.distance < 0.4)
        .sort((s1, s2) => s1.distance - s2.distance)
      // prefer stations with the same (renamed) name, otherwise take the nearest one
      const sameName = nearbyRailwayStations.filter(
        (railwayStation) =>
          railwayStation.name &&
          (renamedStations[railwayStation.name] ?? railwayStation.name) ===
            station.name,
      )
      for (const railwayStation of sameName.length > 0
        ? sameName
        : nearbyRailwayStations.slice(0, 1)) {
        station.alternateNames.push(...railwayStation.ds100)
      }

      // same name far apart usually means two different stations got merged by name
      for (const coords of station.coords) {
        const distance = distanceKm(station.coords[0], coords)
        if (distance > 1.5) {
          console.debug(
            ` *** Warning: Station ${station.name} has nodes ${distance.toFixed(
              1,
            )} km apart ***`,
          )
          break
        }
      }
      station.alternateNames = [...new Set(station.alternateNames)].filter(
        (name) => name !== station.name,
      )
    }

    // S-Bahn stations can also be entered without their town if that is unambiguous,
    // e.g. "Wixhausen" for "Darmstadt-Wixhausen" (towns: station names or prefixes of 2+ stations;
    // tram stops are left out as their names are mostly streets like "Carl-Benz-Straße")
    const stationNames = new Set(
      stationSortedAtoZ.map((station) => station.name),
    )
    const splitPoints = (name: string) =>
      [...name.matchAll(/[ -]/g)].map((match) => match.index!)
    const prefixCount = new Map<string, number>()
    for (const name of stationNames) {
      for (const prefix of new Set(
        splitPoints(name).map((i) => name.slice(0, i)),
      )) {
        prefixCount.set(prefix, (prefixCount.get(prefix) ?? 0) + 1)
      }
    }
    const notTowns = new Set([
      'Alt',
      'Bad',
      'Groß',
      'Klein',
      'Neu',
      'Nieder',
      'Ober',
      'St.',
      'Sankt',
    ])
    const genericWords =
      /^((Nord|Süd|Ost|West)(-?(Nord|Süd|Ost|West))?|Mitte|Bahnhof|Bf|Hbf|Hauptbahnhof|Platz|Straße|Weg|Allee|Endstelle)$/
    const shortNameCandidates = new Map<string, Set<StationDetails>>()
    for (const station of stationSortedAtoZ) {
      const servedBySBahn = station.coords.some((coords) =>
        [...coords.lineIds.keys()].some((lineId) =>
          linesMetadata[lineId].name.startsWith('S'),
        ),
      )
      if (!servedBySBahn) continue
      for (const i of splitPoints(station.name)) {
        const prefix = station.name.slice(0, i)
        const rest = station.name.slice(i + 1).trim()
        const isTown =
          !notTowns.has(prefix) &&
          (stationNames.has(prefix) || (prefixCount.get(prefix) ?? 0) >= 2)
        if (!isTown || rest.length < 4 || genericWords.test(rest)) continue
        if (!/^[A-ZÄÖÜ0-9]/.test(rest)) continue
        if (!shortNameCandidates.has(rest))
          shortNameCandidates.set(rest, new Set())
        shortNameCandidates.get(rest)!.add(station)
      }
    }
    const takenNames = new Map<string, Set<StationDetails>>()
    for (const station of stationSortedAtoZ) {
      for (const name of [station.name, ...station.alternateNames]) {
        if (!takenNames.has(name)) takenNames.set(name, new Set())
        takenNames.get(name)!.add(station)
      }
    }
    const shortNamesAdded: string[] = []
    for (const [rest, stations] of shortNameCandidates) {
      const [station] = stations
      const taken = takenNames.get(rest)
      if (stations.size > 1 || (taken && !taken.has(station))) continue
      station.alternateNames.push(rest)
      shortNamesAdded.push(`${station.name} -> ${rest}`)
    }
    console.debug(`Short names without town (${shortNamesAdded.length}):`)
    shortNamesAdded.forEach((line) => console.debug(`  ${line}`))

    // compare names roughly (case, umlauts, "Straße"/"Str.")
    const normalize = (name: string) =>
      name
        .toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/straße|strasse|str\./g, 'str')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9äöü]/g, '')

    // U-Bahn/tram stops can also be entered with their town or district in front,
    // e.g. "Eppelheim Kirchheimer Straße" or "Pfaffengrund Kranichweg/Stotz"
    const cleanAreaName = (name: string) =>
      name
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/ (am|an der|im|in der|vor der) .*$/, '')
        .trim()
    // e.g. Frankfurt "Ortsbezirke" like "Nord-Ost" or "Innenstadt I" are no real place names
    const genericDistricts =
      /^((Mitte|Nord|Süd|Ost|West)(-(Mitte|Nord|Süd|Ost|West))?|Altstadt|Zentrum)$|Innenstadt|\/| [IVX]+$/
    const areaNamesAdded: string[] = []
    for (const station of stationSortedAtoZ) {
      const nodeIds = station.coords.flatMap((coords) =>
        coords.nodeIds
          .filter(({ lineId }) => !linesMetadata[lineId].name.startsWith('S'))
          .map(({ nodeId }) => nodeId),
      )
      const areas = nodeIds
        .map((nodeId) => stationAreas[nodeId])
        .find((nodeAreas) => nodeAreas?.length)
      if (!areas) continue
      const town = cleanAreaName(
        areas.find((area) => area.level === 8)?.name ??
          areas.find((area) => area.level === 6 && !/kreis/i.test(area.name))
            ?.name ??
          '',
      )
      const districts = areas
        .filter((area) => area.level === 9 || area.level === 10)
        .map((area) => renamedDistricts[area.name] ?? area.name)
        .map((name) =>
          cleanAreaName(name)
            .replace(new RegExp(`^${town}[- ]`), '')
            .replace(new RegExp(`^${town}$`), ''),
        )
        .filter((district) => district && !genericDistricts.test(district))
      const stationName = normalize(station.name)
      // names that already start with their town ("Heidelberg Hauptbahnhof") stay as they are
      if (town && stationName.includes(normalize(town))) continue
      for (const prefix of new Set([town, ...districts].filter(Boolean))) {
        if (stationName.includes(normalize(prefix))) continue
        station.alternateNames.push(`${prefix} ${station.name}`)
        areaNamesAdded.push(`${prefix} ${station.name}`)
      }
    }
    console.debug(`Names with town/district (${areaNamesAdded.length}):`)
    areaNamesAdded.forEach((name) => console.debug(`  ${name}`))

    // U-Bahn/tram stops can also be entered by local operator codes (e.g. VGF "HW");
    // an ambiguous code reveals all stations using it
    const localCodesByStation = new Map<StationDetails, string[]>()
    for (const station of stationSortedAtoZ) {
      const servedByLocalLines = station.coords.some((coords) =>
        [...coords.lineIds.keys()].some(
          (lineId) => !linesMetadata[lineId].name.startsWith('S'),
        ),
      )
      if (!servedByLocalLines) continue
      const names = new Set(
        [station.name, ...station.alternateNames].map(normalize),
      )
      const codes = localStopCodes
        .filter((stopCode) => names.has(normalize(stopCode.name)))
        .map((stopCode) => stopCode.code)
      if (codes.length > 0) localCodesByStation.set(station, codes)
    }
    const stationsByToken = new Map<string, Set<StationDetails>>()
    for (const station of stationSortedAtoZ) {
      for (const token of [
        station.name,
        ...station.alternateNames,
        ...(localCodesByStation.get(station) ?? []),
      ]) {
        const key = normalize(token)
        if (!stationsByToken.has(key)) stationsByToken.set(key, new Set())
        stationsByToken.get(key)!.add(station)
      }
    }
    for (const [station, codes] of localCodesByStation) {
      for (const code of new Set(codes)) {
        if (stationsByToken.get(normalize(code))!.size > 1) {
          console.debug(
            `  Note: local code ${code} of ${station.name} is also used by another station`,
          )
        }
        station.alternateNames.push(code)
      }
    }

    for (const name of Object.keys(alternateNames)) {
      if (mapAlternateNamesUsed.has(name) === false) {
        console.debug(
          ` *** Warning: Alternate names for station ${name} weren't used because no such station exists ***`,
        )
      }
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
                ...(stationDetails.alternateNames.length > 0
                  ? { alternate_names: stationDetails.alternateNames }
                  : {}),
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
    path.join(__dirname, './features.json'),
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
                  [
                    // ~1 m precision keeps routes.json small
                    +(node.lon + latLonOffset).toFixed(5),
                    +(node.lat + latLonOffset).toFixed(5),
                  ] as [number, number],
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
  Bun.write(path.join(__dirname, './routes.json'), JSON.stringify(routes))

  // line icons: S-Bahn as pill, U-Bahn as square, tram as rounded square
  console.debug(`Writing ${sortedLineIds.length} line icons ...`)
  for (const lineId of sortedLineIds) {
    const { name, color } = augmentedLinesMetadataMap.get(lineId)!
    const textColor = Color(color).isLight() ? '#000000' : '#FFFFFF'
    const shape = name.startsWith('S')
      ? `<rect x="10" y="117" width="455" height="241" rx="120" fill="${color}"/>`
      : name.startsWith('U')
      ? `<rect x="40" y="40" width="395" height="395" fill="${color}"/>`
      : `<rect x="18" y="18" width="439" height="439" rx="72" fill="${color}"/>`
    const fontSize = name.length > 2 ? 170 : 210
    Bun.write(
      path.join(__dirname, `../../../../../public/images/${lineId}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" width="475" height="475" viewBox="0 0 475 475">
  ${shape}
  <text x="237.5" y="${
    237.5 + fontSize * 0.36
  }" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${textColor}">${name}</text>
</svg>
`,
    )
  }
}

main()
