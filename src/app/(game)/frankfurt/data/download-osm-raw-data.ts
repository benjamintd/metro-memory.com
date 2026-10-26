import {
  linesMetadata,
  localStopCodeTags,
  localStopCodesUrl,
  type SourceJson,
} from './config'
import * as path from 'path'
import { promises as fs } from 'fs'

/**
 * Read the table "Abk | Name" of a ds100.frankfurtium.de dump, keeping letter codes only
 * (numbers are internal stop numbers, "_" marks turning loops).
 */
async function getLocalStopCodes(): Promise<SourceJson['localStopCodes']> {
  if (!localStopCodesUrl) return []
  const html = await (await fetch(localStopCodesUrl)).text()
  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .trim()
  return [
    ...html.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>/g),
  ]
    .map((match) => ({ code: stripTags(match[1]), name: stripTags(match[2]) }))
    .filter(({ code }) => /^[A-ZÄÖÜ]{2,4}$/.test(code))
}

// Several public Overpass instances, tried in turn (they are often busy)
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

type OsmMember = { type: string; ref: number; role: string }
type OsmElement =
  | { type: 'relation'; id: number; members: OsmMember[] }
  | { type: 'way'; id: number; nodes: number[] }
  | {
      type: 'node'
      id: number
      lat: number
      lon: number
      tags?: { [key: string]: string }
    }

async function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function queryOverpass(query: string): Promise<OsmElement[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    for (const server of OVERPASS_SERVERS) {
      try {
        const response = await fetch(server, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'metro-memory.com data download',
          },
          body: 'data=' + encodeURIComponent(query),
        })
        const text = await response.text()
        if (response.ok && text.trimStart().startsWith('{')) {
          return JSON.parse(text).elements
        }
        console.debug(`  ${server} failed with status ${response.status}`)
      } catch (err) {
        console.debug(`  ${server} failed: ${(err as Error).message}`)
      }
    }
    await wait(15_000)
  }
  throw new Error('All Overpass servers failed')
}

/**
 * Retrieve all relations (incl. child relations of route_masters), their ways and nodes in one Overpass query.
 */
async function getOsmElements(relationIds: number[]) {
  // stations and ways configured in addition to the relations
  const extraNodeIds = Object.values(linesMetadata).flatMap(
    (lineMetadata) => lineMetadata.osm.extraStationNodeIds,
  )
  const extraWayIds = Object.values(linesMetadata).flatMap(
    (lineMetadata) => lineMetadata.osm.extraRouteWayIds,
  )
  const query = `
    [out:json][timeout:300];
    relation(id:${relationIds.join(',')});
    (._; rel(r);)->.routes;
    .routes out body;
    node(r.routes)->.stops;
    .stops out body;
    node(around.stops:600)["railway"~"^(station|halt)$"]["railway:ref"]["station"!~"^(subway|light_rail)$"];
    out body;
    ${
      localStopCodeTags.length > 0
        ? 'node(around.stops:80)["public_transport"~"^(platform|stop_position)$"]; out body;'
        : ''
    }
    way(r.routes)->.ways;
    .ways out body;
    node(w.ways);
    out skel;
    ${
      extraNodeIds.length > 0
        ? `node(id:${extraNodeIds.join(',')}); out body;`
        : ''
    }
    ${
      extraWayIds.length > 0
        ? `way(id:${extraWayIds.join(
            ',',
          )})->.extraWays; .extraWays out body; node(w.extraWays); out skel;`
        : ''
    }
  `
  const elements = await queryOverpass(query)
  const relations = new Map<number, OsmMember[]>()
  const ways = new Map<number, number[]>()
  const nodes = new Map<number, SourceJson['nodes'][number]>()
  const railwayStations = new Map<
    number,
    SourceJson['railwayStations'][number]
  >()
  const localStopCodes: SourceJson['localStopCodes'] = []
  for (const element of elements) {
    if (element.type === 'relation') relations.set(element.id, element.members)
    else if (element.type === 'way') ways.set(element.id, element.nodes)
    else if (element.type === 'node') {
      if (!nodes.get(element.id)?.name)
        nodes.set(element.id, {
          nodeId: element.id,
          name: element.tags?.name,
          lat: element.lat,
          lon: element.lon,
        })
      const { railway, 'railway:ref': ref } = element.tags ?? {}
      if (ref && (railway === 'station' || railway === 'halt'))
        // DS100 codes of railway stations, e.g. "FF" for Frankfurt Hbf
        railwayStations.set(element.id, {
          nodeId: element.id,
          name: element.tags!.name,
          ds100: ref.split(';').map((code) => code.trim()),
          lat: element.lat,
          lon: element.lon,
        })
      // operator codes of tram stops, e.g. rnv "MIWA" for Wasserturm
      for (const tag of localStopCodeTags) {
        const value = element.tags?.[tag]
        if (!value || !element.tags?.name) continue
        for (const code of value.split(';')) {
          localStopCodes.push({
            code: code.trim(),
            name: element.tags.name,
            lat: element.lat,
            lon: element.lon,
          })
        }
      }
    }
  }
  return { relations, ways, nodes, railwayStations, localStopCodes }
}

/**
 * Get IDs of stations (nodes with role stop*) and routes (ways without role) for a relation.
 * Child relations (e.g. routes of a route_master) are resolved recursively.
 */
function getRelationsDetails(
  relationId: number,
  relations: Map<number, OsmMember[]>,
): SourceJson['lines'][number]['relations'] {
  const members = relations.get(relationId)
  if (!members) throw new Error(`Relation ${relationId} not found`)
  const stationsNodeIds: number[] = []
  const routesWayIds: number[] = []
  const childDetails: SourceJson['lines'][number]['relations'] = []
  for (const member of members) {
    if (member.type === 'relation') {
      // ignore non-route child relations (e.g. platform multipolygons)
      if (!relations.has(member.ref) || member.role !== '') continue
      childDetails.push(...getRelationsDetails(member.ref, relations))
    } else if (member.type === 'node' && member.role.startsWith('stop')) {
      stationsNodeIds.push(member.ref)
    } else if (member.type === 'way' && member.role === '') {
      // we ignore ways with role platform*
      routesWayIds.push(member.ref)
    }
  }
  return [{ relationId, stationsNodeIds, routesWayIds }, ...childDetails]
}

/**
 * Administrative areas (town, district) each stop lies in, e.g. "Eppelheim" for "Kirchheimer Straße"
 */
async function getStationAreas(
  nodeIds: number[],
): Promise<SourceJson['stationAreas']> {
  if (nodeIds.length === 0) return {}
  const query = `
    [out:json][timeout:300];
    node(id:${nodeIds.join(',')});
    foreach -> .stop (
      .stop out ids;
      .stop is_in -> .areas;
      area.areas["boundary"="administrative"]["admin_level"~"^(6|8|9|10)$"];
      out tags;
    );
  `
  const elements = (await queryOverpass(query)) as unknown as {
    type: string
    id: number
    tags?: { [key: string]: string }
  }[]
  const stationAreas: SourceJson['stationAreas'] = {}
  let current: number | undefined
  for (const element of elements) {
    if (element.type === 'node') {
      current = element.id
      stationAreas[current] = []
    } else if (current !== undefined && element.tags?.name) {
      stationAreas[current].push({
        level: Number(element.tags.admin_level),
        name: element.tags.name,
      })
    }
  }
  // some Overpass servers have no area data and silently return none
  if (!Object.values(stationAreas).some((areas) => areas.length > 0)) {
    throw new Error('Overpass returned no administrative areas, try again')
  }
  return stationAreas
}

const main = async () => {
  const allRelationIds = Object.values(linesMetadata).flatMap(
    (lineMetadata) => lineMetadata.osm.relationIds,
  )
  console.debug(
    `Fetching ${allRelationIds.length} relations for ${
      Object.keys(linesMetadata).length
    } lines from Overpass ...`,
  )
  const { relations, ways, nodes, railwayStations, localStopCodes } =
    await getOsmElements(allRelationIds)
  console.debug(
    `Fetched ${relations.size} relations, ${ways.size} ways, ${nodes.size} nodes`,
  )

  const lines: SourceJson['lines'] = Object.entries(linesMetadata).map(
    ([lineId, lineMetadata]) => ({
      lineId,
      relations: lineMetadata.osm.relationIds
        .flatMap((relationId) => getRelationsDetails(relationId, relations))
        // route_masters have no stops/ways themselves
        .filter(
          (relation) =>
            relation.stationsNodeIds.length > 0 ||
            relation.routesWayIds.length > 0,
        ),
      extraStationNodeIds: lineMetadata.osm.extraStationNodeIds,
      extraRouteWayIds: lineMetadata.osm.extraRouteWayIds,
    }),
  )

  const usedWayIds = new Set(
    lines.flatMap((line) => [
      ...line.relations.flatMap((relation) => relation.routesWayIds),
      ...line.extraRouteWayIds,
    ]),
  )
  const sourceWays = [...usedWayIds]
    .filter((wayId) => ways.has(wayId))
    .map((wayId) => ({ wayId, nodeIds: ways.get(wayId)! }))
  const usedNodeIds = new Set([
    ...lines.flatMap((line) => [
      ...line.relations.flatMap((relation) => relation.stationsNodeIds),
      ...line.extraStationNodeIds,
    ]),
    ...sourceWays.flatMap((way) => way.nodeIds),
  ])

  // areas only for U-Bahn and tram stops (S-Bahn station names already contain the town)
  const localStopNodeIds = [
    ...new Set(
      lines
        .filter((line) => !linesMetadata[line.lineId].name.startsWith('S'))
        .flatMap((line) => [
          ...line.relations.flatMap((relation) => relation.stationsNodeIds),
          ...line.extraStationNodeIds,
        ]),
    ),
  ]
  console.debug(`Fetching areas of ${localStopNodeIds.length} stops ...`)
  const stationAreas = await getStationAreas(localStopNodeIds)

  const sourceData: SourceJson = {
    lines,
    stationAreas,
    ways: sourceWays,
    nodes: [...usedNodeIds]
      .filter((nodeId) => nodes.has(nodeId))
      .map((nodeId) => nodes.get(nodeId)!),
    railwayStations: [...railwayStations.values()],
    localStopCodes: [...localStopCodes, ...(await getLocalStopCodes())],
  }
  console.debug(
    `Saving ${sourceData.ways.length} ways and ${sourceData.nodes.length} nodes ...`,
  )
  await fs.writeFile(
    path.join(__dirname, './source.json'),
    JSON.stringify(sourceData),
    'utf8',
  )
}

main()
