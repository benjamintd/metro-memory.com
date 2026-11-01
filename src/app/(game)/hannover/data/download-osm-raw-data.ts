import { linesMetadata, type SourceJson } from './config'
import axios from 'axios'
import * as path from 'path'
import { promises as fs } from 'fs'

const osmApi = axios.create({
  baseURL: 'https://www.openstreetmap.org/api/0.6/',
})

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
      relationsDetails.push({ relationId, stationsNodeIds, routesWayIds })
    }),
  )
  return relationsDetails
}

/**
 * Retrieve details (name, lat, lon) for each station in a list of stations (OSM node IDs)
 */
async function getOsmStationsDetails(
  stationsNodeIds: number[],
): Promise<{ nodeId: number; name: string; lat: number; lon: number }[]> {
  const stationsDetails: {
    nodeId: number
    name: string
    lat: number
    lon: number
  }[] = []
  await Promise.all(
    stationsNodeIds.map(async (nodeId) => {
      const response = await osmApi.get(`node/${nodeId}.json`)
      for (const element of response.data.elements) {
        if (element.type !== 'node' || element.id !== nodeId) continue
        stationsDetails.push({
          nodeId,
          name: element.tags.name,
          lat: element.lat,
          lon: element.lon,
        })
      }
    }),
  )
  return stationsDetails
}

/**
 * Retrieve list of coordinates (lat, lon) for each way in a list of OSM way IDs
 */
async function getOsmWaysDetails(wayIds: number[]): Promise<{
  ways: { wayId: number; nodeIds: number[] }[]
  nodes: { nodeId: number; lat: number; lon: number }[]
}> {
  const ways: {
    wayId: number
    nodeIds: number[]
  }[] = []
  await Promise.all(
    wayIds.map(async (wayId) => {
      const response = await osmApi.get(`way/${wayId}.json`)
      for (const element of response.data.elements) {
        if (element.type !== 'way' || element.id !== wayId) continue
        ways.push({ wayId, nodeIds: element.nodes })
      }
    }),
  )

  const uniqueNodeIds = [...new Set(ways.map((way) => way.nodeIds).flat())]
  console.debug(
    `Fetched node IDs for ${ways.length} ways, now fetching details for ${uniqueNodeIds.length} nodes ...`,
  )
  const nodes: { nodeId: number; lat: number; lon: number }[] = []
  await Promise.all(
    uniqueNodeIds.map(async (nodeId, ix) => {
      // very naive DoS protection: wait a bit for each request, to have max ~30 req/second
      await wait(30 * ix)
      const response = await osmApi.get(`node/${nodeId}.json`)
      for (const element of response.data.elements) {
        if (element.type !== 'node' || element.id !== nodeId) continue
        const { lat, lon } = element
        nodes.push({ nodeId, lat, lon })
      }
      if ((ix + 1) % 10 === 0)
        console.debug(`  Finished request #${ix + 1}/${uniqueNodeIds.length}`)
    }),
  )
  return { ways, nodes }
}

async function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
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

  // get details of stations and routes
  console.debug(`Fetching details for ${uniqueStationsNodeIds.length} nodes...`)
  const stationsDetails = await getOsmStationsDetails(uniqueStationsNodeIds)
  console.debug(`Fetched details for ${uniqueStationsNodeIds.length} nodes`)

  console.debug(`Fetching details for ${uniqueRoutesWayIds.length} ways...`)
  const waysDetails = await getOsmWaysDetails(uniqueRoutesWayIds)
  console.debug(`Fetched details for ${uniqueRoutesWayIds.length} ways`)

  console.debug(`Saving data...`)

  // store station node IDs for easier lookup
  const setStationNodeIds = new Set(
    stationsDetails.map((station) => station.nodeId),
  )

  // save data to source.json
  const sourceData: SourceJson = {
    lines: relationsDetailsPerLine,
    ways: waysDetails.ways,
    nodes: [
      ...stationsDetails,
      ...waysDetails.nodes.filter(
        (node) => setStationNodeIds.has(node.nodeId) === false,
      ),
    ],
  }
  await fs.writeFile(
    path.join(__dirname, './source.json'),
    JSON.stringify(sourceData, null, 2),
    'utf8',
  )
}

main()
