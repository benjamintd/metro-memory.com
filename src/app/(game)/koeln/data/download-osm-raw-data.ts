import { linesMetadata, type SourceJson } from './config'
import axios from 'axios'
import * as path from 'path'
import { promises as fs } from 'fs'

const osmApi = axios.create({
  baseURL: 'https://www.openstreetmap.org/api/0.6/',
})

// The OSM API accepts up to 725 ids per multi-fetch call; stay well below that. Fetching
// the ~1300 ways and ~17k nodes of this network one request at a time is slow enough that
// the API drops connections, so everything below goes through the multi-fetch endpoints.
const BATCH_SIZE = 200

/**
 * Retrieve IDs of stations (node in OSM) and routes (path of the line; way in OSM) for a given relation ID.
 * If the relation includes child relations (e.g., relation is a route_master and includes multiple routes),
 * those are retrieved as well (recursively).
 */
async function getOsmRelationsDetails(relationIds: number[]): Promise<
  {
    relationId: number
    stationsNodeIds: number[]
    routesWayIds: number[]
  }[]
> {
  const relationsDetails: {
    relationId: number
    stationsNodeIds: number[]
    routesWayIds: number[]
  }[] = []
  await Promise.all(
    relationIds.map(async (relationId) => {
      const stationsNodeIds: number[] = []
      const routesWayIds: number[] = []
      const response = await osmApi.get(`relation/${relationId}.json`)
      for (const element of response.data.elements) {
        if (element.type !== 'relation' || element.id !== relationId) continue
        for (const member of element.members as {
          type: string
          ref: number
          role: string
        }[]) {
          if (member.type === 'relation') {
            const relationDetails = await getOsmRelationsDetails([member.ref])
            relationsDetails.push(...relationDetails)
          } else if (member.type === 'node' && member.role.startsWith('stop')) {
            stationsNodeIds.push(member.ref)
          } else if (member.type === 'way' && member.role === '') {
            // we ignore ways with role platform*
            routesWayIds.push(member.ref)
          }
        }
      }
      // A route_master only contains child relations; don't emit an empty entry for it.
      if (stationsNodeIds.length > 0 || routesWayIds.length > 0) {
        relationsDetails.push({ relationId, stationsNodeIds, routesWayIds })
      }
    }),
  )
  return relationsDetails
}

/**
 * Retrieve details (name, lat, lon) for a list of OSM node IDs, in batches.
 * The Cologne network has ~17k way nodes; fetching them one by one takes minutes, so we
 * use the multi-fetch endpoint instead.
 */
async function getOsmNodesDetails(
  nodeIds: number[],
): Promise<{ nodeId: number; name?: string; lat: number; lon: number }[]> {
  const nodesDetails: {
    nodeId: number
    name?: string
    lat: number
    lon: number
  }[] = []
  for (let ix = 0; ix < nodeIds.length; ix += BATCH_SIZE) {
    const batch = nodeIds.slice(ix, ix + BATCH_SIZE)
    const response = await osmApi.get(`nodes.json?nodes=${batch.join(',')}`)
    for (const element of response.data.elements) {
      if (element.type !== 'node') continue
      const name = element.tags?.name
      nodesDetails.push({
        nodeId: element.id,
        ...(name ? { name } : {}),
        lat: element.lat,
        lon: element.lon,
      })
    }
    console.debug(`  Fetched nodes ${ix + batch.length}/${nodeIds.length} ...`)
  }
  return nodesDetails
}

/**
 * Retrieve the list of node IDs making up each way in a list of OSM way IDs, in batches.
 */
async function getOsmWaysDetails(
  wayIds: number[],
): Promise<{ wayId: number; nodeIds: number[] }[]> {
  const ways: {
    wayId: number
    nodeIds: number[]
  }[] = []
  for (let ix = 0; ix < wayIds.length; ix += BATCH_SIZE) {
    const batch = wayIds.slice(ix, ix + BATCH_SIZE)
    const response = await osmApi.get(`ways.json?ways=${batch.join(',')}`)
    for (const element of response.data.elements) {
      if (element.type !== 'way') continue
      ways.push({ wayId: element.id, nodeIds: element.nodes })
    }
    console.debug(`  Fetched ways ${ix + batch.length}/${wayIds.length} ...`)
  }
  return ways
}

const main = async () => {
  // get OSM IDs of stops and routes
  console.debug(
    `Fetching stations and routes for ${
      Object.keys(linesMetadata).length
    } lines...`,
  )
  const relationsDetailsPerLine: SourceJson['lines'] = await Promise.all(
    Object.entries(linesMetadata).map(async ([lineId, lineMetadata]) => {
      const relations = await getOsmRelationsDetails(
        lineMetadata.osm.relationIds,
      )
      return {
        lineId,
        relations,
        extraStationNodeIds: lineMetadata.osm.extraStationNodeIds ?? [],
        extraRouteWayIds: lineMetadata.osm.extraRouteWayIds ?? [],
      }
    }),
  )

  const uniqueStationsNodeIds = [
    ...new Set(
      relationsDetailsPerLine
        .map((lineDetails) => [
          ...lineDetails.relations
            .map((relation) => relation.stationsNodeIds)
            .flat(),
          ...lineDetails.extraStationNodeIds,
        ])
        .flat(),
    ),
  ]
  const uniqueRoutesWayIds = [
    ...new Set(
      relationsDetailsPerLine
        .map((lineDetails) => [
          ...lineDetails.relations
            .map((relation) => relation.routesWayIds)
            .flat(),
          ...lineDetails.extraRouteWayIds,
        ])
        .flat(),
    ),
  ]
  console.debug(
    `Fetched ${uniqueStationsNodeIds.length} unique station node IDs and ${uniqueRoutesWayIds.length} route way IDs`,
  )

  // get details of routes first: we need their node IDs before we can fetch coordinates
  console.debug(`Fetching details for ${uniqueRoutesWayIds.length} ways...`)
  const ways = await getOsmWaysDetails(uniqueRoutesWayIds)

  const setStationNodeIds = new Set(uniqueStationsNodeIds)
  const uniqueWayNodeIds = [
    ...new Set(ways.map((way) => way.nodeIds).flat()),
  ].filter((nodeId) => setStationNodeIds.has(nodeId) === false)

  console.debug(
    `Fetching details for ${uniqueStationsNodeIds.length} station nodes and ${uniqueWayNodeIds.length} way nodes...`,
  )
  const nodes = await getOsmNodesDetails([
    ...uniqueStationsNodeIds,
    ...uniqueWayNodeIds,
  ])

  const setFetchedNodeIds = new Set(nodes.map((node) => node.nodeId))
  const missingStations = uniqueStationsNodeIds.filter(
    (nodeId) => setFetchedNodeIds.has(nodeId) === false,
  )
  if (missingStations.length > 0) {
    throw new Error(
      `Could not fetch details for station nodes ${missingStations.join(', ')}`,
    )
  }

  console.debug(`Saving data...`)

  // save data to source.json
  const sourceData: SourceJson = {
    lines: relationsDetailsPerLine,
    ways,
    nodes,
  }
  await fs.writeFile(
    path.join(__dirname, './source.json'),
    JSON.stringify(sourceData, null, 2),
    'utf8',
  )
}

main()
