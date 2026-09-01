import Color from 'color'
import { promises as fs } from 'fs'
import * as path from 'path'
import {
  alternateNames,
  linesMetadata,
  stationAliases,
  KVB_STATIONS_CSV,
  SAME_STATION_MAX_DISTANCE_M,
  type SourceJson,
} from './config'

const Bun = {
  file(path: string) {
    return {
      async json() {
        return JSON.parse(await fs.readFile(path, 'utf8'))
      },
      async text() {
        return fs.readFile(path, 'utf8')
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

type KvbStop = {
  name: string
  lat: number
  lon: number
}

/**
 * Same normalization the game applies to typed answers (see hooks/useNormalizeString.ts,
 * `koeln` replacer). Two names that normalize to the same string are the same station as
 * far as a player is concerned, so we use it to match KVB names against OSM names.
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/[‐-―]/g, ' ')
    .replace(/straße/g, 'str')
    .replace(/strasse/g, 'str')
    .replace(/\bhbf\b/g, 'hauptbahnhof')
    .replace(/\bbf\b/g, 'bahnhof')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[^a-z0-9]/g, '')
}

/** Rough metres between two WGS84 points; fine at the scale of a tram network. */
function distanceInMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const latMeters = (a.lat - b.lat) * 111_320
  const lonMeters =
    (a.lon - b.lon) * 111_320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.sqrt(latMeters * latMeters + lonMeters * lonMeters)
}

/**
 * Parse the official KVB stop export. Every row is one platform, so a station shows up
 * several times; we keep them all because the nearest-platform match is what we compare
 * OSM stop nodes against.
 */
async function parseKvbStops(): Promise<{
  stopsByLineName: Map<string, KvbStop[]>
  allStationNames: Set<string>
}> {
  const csv = await Bun.file(path.join(__dirname, KVB_STATIONS_CSV)).text()
  const [header, ...rows] = csv.split('\n').filter((line) => line.length > 0)
  const columns = header.split(';')
  const columnIndex = (name: string) => {
    const ix = columns.indexOf(name)
    if (ix === -1)
      throw new Error(`Missing column ${name} in ${KVB_STATIONS_CSV}`)
    return ix
  }
  const ixName = columnIndex('Name')
  const ixLon = columnIndex('XKoordinate')
  const ixLat = columnIndex('YKoordinate')
  const ixMode = columnIndex('Betriebsbereich')
  const ixLines = columnIndex('Linien')

  const stopsByLineName = new Map<string, KvbStop[]>()
  const allStationNames = new Set<string>()
  for (const row of rows) {
    const fields = row.split(';')
    // STRAB is tram/Stadtbahn; the rest of the export is buses.
    if (fields[ixMode] !== 'STRAB') continue
    const stop: KvbStop = {
      name: fields[ixName],
      lat: Number(fields[ixLat]),
      lon: Number(fields[ixLon]),
    }
    if (Number.isNaN(stop.lat) || Number.isNaN(stop.lon)) {
      throw new Error(`Invalid coordinates for KVB stop ${stop.name}`)
    }
    allStationNames.add(stop.name)
    for (const lineName of fields[ixLines].split(' ').filter(Boolean)) {
      const stops = stopsByLineName.get(lineName)
      if (stops) {
        stops.push(stop)
      } else {
        stopsByLineName.set(lineName, [stop])
      }
    }
  }
  return { stopsByLineName, allStationNames }
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

/**
 * Names a player is likely to type for a station, beyond its own name. The S-Bahn stations
 * come from OSM as "Köln-Ehrenfeld" / "Köln Trimbornstraße"; without the bare form the
 * input handler rejects "Ehrenfeld", because it requires the match to be close in length to
 * what was typed. Anchored so that "Köln/Bonn Flughafen" keeps its name.
 *
 * Parenthesised suffixes are deliberately left alone: "Merten (Sieg)" -> "Merten" would
 * collide with the tram station Merten near Bornheim.
 */
function derivedAlternateNames(stationName: string): string[] {
  const withoutKoeln = stationName.replace(/^Köln[- ]/, '')
  return withoutKoeln === stationName ? [] : [withoutKoeln]
}

/**
 * Line names are either a tram number ('1', '18') or an S-Bahn one ('S6', 'S19'). Order
 * both numerically, with every tram ahead of every S-Bahn.
 */
function lineSortKey(name: string): number {
  const isSBahn = name.startsWith('S')
  const number = Number(isSBahn ? name.slice(1) : name)
  if (Number.isNaN(number)) {
    throw new Error(`Cannot order line ${name}: not a number or S<number>`)
  }
  return (isSBahn ? 1000 : 0) + number
}

/**
 * Drop alternate names that the game would not tell apart anyway — either from the
 * station's own name or from an alternate we already kept.
 */
function dedupeByNormalizedName(
  names: string[],
  stationName: string,
): string[] {
  const seen = new Set<string>([normalizeName(stationName)])
  const kept: string[] = []
  for (const name of names) {
    const key = normalizeName(name)
    if (seen.has(key)) continue
    seen.add(key)
    kept.push(name)
  }
  return kept
}

const main = async () => {
  const data = Bun.file(path.join(__dirname, './source.json'))
  const { lines: rawLines, nodes, ways } = (await data.json()) as SourceJson
  const { stopsByLineName, allStationNames } = await parseKvbStops()

  const getStationId = await parseOldStationsAndCreateStationIdGetter()
  const waysMap = toMap(ways, 'wayId')
  const nodesMap = toMap(nodes, 'nodeId')

  /**
   * Cut one route relation down to the part between the segment's two termini, for lines
   * that run well beyond the Cologne network (S6 towards Essen, S11 towards Düsseldorf).
   *
   * Both the stop list and the track are cut. This is exact rather than a heuristic:
   * every stop node lies on one of the relation's route ways, and the way positions of
   * the stops run monotonically along the relation's member order, so slicing the ordered
   * way list between the two termini yields precisely the segment.
   *
   * The two boundary ways are kept whole. Measured against the real data the track
   * overshoots a terminus by at most ~240 m, which is far below a pixel at the zoom where
   * this network fits on screen, and trimming them would mean carrying per-line overrides
   * of shared way geometry.
   */
  function clipRelationToSegment(
    lineId: string,
    relation: SourceJson['lines'][number]['relations'][number],
    segment: { from: string; to: string },
  ): SourceJson['lines'][number]['relations'][number] {
    const wayIndexByNodeId = new Map<number, number>()
    relation.routesWayIds.forEach((wayId, ix) => {
      for (const nodeId of waysMap.get(wayId)!.nodeIds) {
        if (!wayIndexByNodeId.has(nodeId)) wayIndexByNodeId.set(nodeId, ix)
      }
    })

    const stopIndexOf = (stationName: string): number => {
      const ix = relation.stationsNodeIds.findIndex(
        (nodeId) => nodesMap.get(nodeId)?.name === stationName,
      )
      if (ix === -1) {
        throw new Error(
          `Line ${lineId}: relation ${relation.relationId} has no stop named "${stationName}" to cut the segment at`,
        )
      }
      return ix
    }
    const [firstStop, lastStop] = [
      stopIndexOf(segment.from),
      stopIndexOf(segment.to),
    ].sort((a, b) => a - b)

    const wayIndexOfStop = (stopIx: number): number => {
      const nodeId = relation.stationsNodeIds[stopIx]
      const ix = wayIndexByNodeId.get(nodeId)
      if (ix === undefined) {
        throw new Error(
          `Line ${lineId}: terminus node ${nodeId} of relation ${relation.relationId} does not lie on any of its route ways`,
        )
      }
      return ix
    }
    const [firstWay, lastWay] = [
      wayIndexOfStop(firstStop),
      wayIndexOfStop(lastStop),
    ].sort((a, b) => a - b)

    return {
      ...relation,
      stationsNodeIds: relation.stationsNodeIds.slice(firstStop, lastStop + 1),
      routesWayIds: relation.routesWayIds.slice(firstWay, lastWay + 1),
    }
  }

  const lines: SourceJson['lines'] = rawLines.map((line) => {
    const segment = linesMetadata[line.lineId]?.segment
    if (!segment) return line
    const relations = line.relations.map((relation) =>
      clipRelationToSegment(line.lineId, relation, segment),
    )
    console.debug(
      `Clipping ${line.lineId} to ${segment.from} .. ${segment.to}: ` +
        line.relations
          .map(
            (r, ix) =>
              `${r.routesWayIds.length}->${relations[ix].routesWayIds.length} ways`,
          )
          .join(', '),
    )
    return { ...line, relations }
  })

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
    // Sort numerically, trams before S-Bahn: a lexicographic sort would order the legend
    // 1, 12, 13, 15, 16, 17, 18, 3, 4, ... and Number('S6') is NaN.
    .sort(
      ([, line1], [, line2]) =>
        lineSortKey(line1.name) - lineSortKey(line2.name),
    )
    .map(([lineId, lineMetadata], ix, arr): string => {
      const numLines = arr.length
      augmentedLinesMetadataMap.set(lineId, {
        ...lineMetadata,
        id: lineId,
        order: ix + 1,
        // Nudge each line sideways so the many shared trunks (3/4/16/18 through Neumarkt,
        // 1/7/9 through Heumarkt) fan out instead of hiding each other.
        latLonOffset: (ix / (numLines - 1) - 0.5) * 0.000_06,
      })
      return lineId
    })

  console.debug(`Writing ${sortedLineIds.length} lines to lines.json ...`)
  Bun.write(
    path.join(__dirname, './lines.json'),
    JSON.stringify(
      sortedLineIds.reduce(
        (acc, lineId) => {
          const lineMetadata = augmentedLinesMetadataMap.get(lineId)!
          const color = Color(lineMetadata.color)
          acc[lineId] = {
            name: lineMetadata.name,
            color: lineMetadata.color,
            backgroundColor: color.darken(0.5).hex(),
            // The pale lines (12, 17) are unreadable with white on top.
            textColor: color.luminosity() > 0.45 ? '#000000' : '#FFFFFF',
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
    /** hand-written in config.ts — an ambiguous one is an error */
    alternateNames: string[]
    /** derived (OSM spelling, "Köln " prefix dropped) — an ambiguous one is discarded */
    autoAlternateNames: string[]
  }

  const mapKvbNamesUsed = new Map<string, boolean>()
  const mapStationAliasesUsed = new Map<string, boolean>()

  /**
   * The KVB export is the naming authority, but it stops at the KVB/SWB boundary, so it
   * has nothing for the Bonn halves of lines 16 and 18. For every OSM stop we therefore
   * look for the KVB stop of the same line that it corresponds to — by normalized name
   * first, then by distance — and use the KVB name when we find one. Stops with no match
   * keep their OSM name.
   *
   * S-Bahn lines have no rows in the KVB export at all, so their stops fall through to
   * their OSM name unless `stationAliases` says the stop is really one of the tram
   * stations, in which case the two become a single station on the map.
   */
  function resolveStationName(lineId: string, nodeId: number): string {
    const node = nodesMap.get(nodeId)!
    if (!node.name) {
      throw new Error(`Unknown name for station with node id ${nodeId}`)
    }
    const alias = stationAliases[node.name]
    if (alias) {
      mapStationAliasesUsed.set(node.name, true)
      return alias
    }
    const lineName = linesMetadata[lineId].name
    const candidates = stopsByLineName.get(lineName) ?? []
    const normalized = normalizeName(node.name)

    const byName = candidates.find(
      (stop) => normalizeName(stop.name) === normalized,
    )
    if (byName) {
      mapKvbNamesUsed.set(byName.name, true)
      return byName.name
    }

    let nearest: KvbStop | undefined
    let nearestDistance = Infinity
    for (const stop of candidates) {
      const distance = distanceInMeters(node, stop)
      if (distance < nearestDistance) {
        nearest = stop
        nearestDistance = distance
      }
    }
    if (nearest && nearestDistance <= SAME_STATION_MAX_DISTANCE_M) {
      mapKvbNamesUsed.set(nearest.name, true)
      return nearest.name
    }
    return node.name
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
        const stationName = resolveStationName(line.lineId, stationNodeId)
        const existingStation = mapUniqueStationsByName.get(stationName)
        if (existingStation === undefined) {
          const stationAlternateNames = [...(alternateNames[stationName] ?? [])]
          if (stationAlternateNames.length > 0) {
            mapAlternateNamesUsed.set(stationName, true)
          }

          // The KVB and OSM spellings of a station routinely differ ("Poststr." vs
          // "Poststraße", "Bensberg" vs "Bensberg U", and every S-Bahn stop merged into a
          // tram station by `stationAliases`); accept both. The purely orthographic
          // variants (Straße/Str., Bf/Bahnhof, Hbf/Hauptbahnhof) need no entry here — the
          // `koeln` replacer in hooks/useNormalizeString.ts folds them together for every
          // station, and the filter below drops any alternate that is already equivalent
          // under it.
          const autoAlternateNames = [
            stationNode.name!,
            ...derivedAlternateNames(stationName),
          ]

          mapUniqueStationsByName.set(stationName, {
            name: stationName,
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
                getStationId({ lineId: line.lineId, name: stationName }),
              ],
            ]),
            alternateNames: dedupeByNormalizedName(
              stationAlternateNames,
              stationName,
            ),
            autoAlternateNames,
          })
        } else {
          existingStation.autoAlternateNames.push(stationNode.name!)
          if (existingStation.stationIdByLineId.has(line.lineId) === false) {
            existingStation.stationIdByLineId.set(
              line.lineId,
              getStationId({ lineId: line.lineId, name: stationName }),
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
    // Fold the derived alternates in. Unlike the hand-written ones, a derived name that
    // would match a second station is simply dropped rather than failing the build: they
    // are generated for every station, so one clash is a fact about the network, not a
    // mistake in config.ts. ("Köln Steinstraße" -> "Steinstraße" clashes with the tram
    // stop Porz Steinstr., whose OSM spelling is already "Steinstraße".)
    const stationByTypedName = new Map<string, string>()
    for (const station of mapUniqueStationsByName.values()) {
      for (const label of [station.name, ...station.alternateNames]) {
        stationByTypedName.set(normalizeName(label), station.name)
      }
    }
    for (const station of mapUniqueStationsByName.values()) {
      for (const candidate of dedupeByNormalizedName(
        station.autoAlternateNames,
        station.name,
      )) {
        const key = normalizeName(candidate)
        const owner = stationByTypedName.get(key)
        if (owner === undefined) {
          stationByTypedName.set(key, station.name)
          station.alternateNames.push(candidate)
        } else if (owner !== station.name) {
          console.debug(
            ` *** Note: not adding "${candidate}" to ${station.name}: it already identifies ${owner} ***`,
          )
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
    for (const name of Object.keys(alternateNames)) {
      if (mapAlternateNamesUsed.has(name) === false) {
        console.debug(
          ` *** Warning: Alternate names for station ${name} weren't used because no such station exists ***`,
        )
      }
    }
    for (const name of Object.keys(stationAliases)) {
      if (mapStationAliasesUsed.has(name) === false) {
        console.debug(
          ` *** Warning: station alias ${name} was never used: no OSM stop has that name ***`,
        )
      }
    }
    for (const name of allStationNames) {
      if (mapKvbNamesUsed.has(name) === false) {
        console.debug(
          ` *** Warning: KVB station ${name} was never matched to an OSM stop ***`,
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
    path.join(__dirname, './routes.json'),
    JSON.stringify(routes, null, 2),
  )

  // sanity checks: shout rather than silently ship a half-empty network
  console.debug(
    `\nStations per line (${stations.properties.totalStations} unique):`,
  )
  for (const lineId of sortedLineIds) {
    const stationCount = stations.properties.stationsPerLine[lineId] ?? 0
    const routeCount = routes.features.filter(
      (f) => f.properties.line === lineId,
    ).length
    console.debug(
      `  ${lineId.padEnd(8)} ${String(stationCount).padStart(
        3,
      )} stations, ${String(routeCount).padStart(3)} paths`,
    )
    if (stationCount === 0 || routeCount === 0) {
      throw new Error(`Line ${lineId} has no stations or no route geometry`)
    }
  }
  if (sortedLineIds.length !== Object.keys(linesMetadata).length) {
    throw new Error('Not every configured line made it into the output')
  }
  // ids are allocated per (line, station) and are what player progress is keyed on, so a
  // collision would silently mark the wrong station as found
  const seenIds = new Set<number>()
  for (const feature of stations.features) {
    if (seenIds.has(feature.id)) {
      throw new Error(
        `Duplicate station id ${feature.id} (${feature.properties.line} ${feature.properties.name})`,
      )
    }
    seenIds.add(feature.id)
  }

  // Every name a player can type must identify exactly one station. The input handler
  // credits *all* matches, so an ambiguous alternate would hand out two stations for one
  // answer — Köln Hbf and Köln Messe/Deutz each have two tram stops and are easy to get
  // wrong here. Pick a single owner in `alternateNames` instead.
  const stationsByTypedName = new Map<string, Set<string>>()
  for (const feature of stations.features) {
    for (const label of [
      feature.properties.name,
      ...(feature.properties.alternate_names ?? []),
    ]) {
      const key = normalizeName(label)
      const owners = stationsByTypedName.get(key)
      if (owners) {
        owners.add(feature.properties.name)
      } else {
        stationsByTypedName.set(key, new Set([feature.properties.name]))
      }
    }
  }
  const ambiguous = [...stationsByTypedName.entries()].filter(
    ([, owners]) => owners.size > 1,
  )
  if (ambiguous.length > 0) {
    for (const [key, owners] of ambiguous) {
      console.debug(`  "${key}" matches ${[...owners].join(' / ')}`)
    }
    throw new Error(
      `${ambiguous.length} name(s) match more than one station; see above`,
    )
  }
}

main()
