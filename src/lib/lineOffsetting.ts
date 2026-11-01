import { FeatureCollection, LineString, MultiLineString, Position } from 'geojson'
import { Line } from './types'

// ---------------------------------------------------------------------------
// Geography helpers
// ---------------------------------------------------------------------------

export const EARTH_RADIUS_KM = 6371

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI
}

/** Great-circle distance in kilometres between two [lng, lat] positions. */
export function distance(a: Position, b: Position): number {
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])
  const dLat = lat2 - lat1
  const dLng = toRadians(b[0] - a[0])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Initial bearing (degrees, 0–360) from a to b. */
export function bearing(a: Position, b: Position): number {
  const lat1 = toRadians(a[1])
  const lat2 = toRadians(b[1])
  const dLng = toRadians(b[0] - a[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/**
 * Returns true when two bearings are parallel (same or opposite direction)
 * within the given tolerance (degrees).
 */
export function areBearingsParallel(
  b1: number,
  b2: number,
  toleranceDeg = 15,
): boolean {
  const diff = Math.abs(((b1 - b2 + 540) % 360) - 180)
  return diff < toleranceDeg || diff > 180 - toleranceDeg
}

// ---------------------------------------------------------------------------
// Coordinate grid (for snapping/deduplication)
// ---------------------------------------------------------------------------

export class CoordGrid {
  private grid = new Map<string, Position>()
  private cellSize: number

  constructor(cellSizeDeg = 0.0001) {
    this.cellSize = cellSizeDeg
  }

  private key(pos: Position): string {
    const col = Math.round(pos[0] / this.cellSize)
    const row = Math.round(pos[1] / this.cellSize)
    return `${col},${row}`
  }

  /** Return the canonical snapped position for a coordinate. */
  snap(pos: Position): Position {
    const k = this.key(pos)
    if (!this.grid.has(k)) {
      this.grid.set(k, pos)
    }
    return this.grid.get(k)!
  }

  has(pos: Position): boolean {
    return this.grid.has(this.key(pos))
  }
}

// ---------------------------------------------------------------------------
// Overlap detection between two routes
// ---------------------------------------------------------------------------

/** Minimum distance in km from a point to a line segment. */
function pointToSegmentDistance(
  point: Position,
  segStart: Position,
  segEnd: Position,
): number {
  const A = point[0] - segStart[0]
  const B = point[1] - segStart[1]
  const C = segEnd[0] - segStart[0]
  const D = segEnd[1] - segStart[1]
  const lenSq = C * C + D * D
  const param = lenSq === 0 ? -1 : (A * C + B * D) / lenSq
  let closest: Position
  if (param < 0) closest = segStart
  else if (param > 1) closest = segEnd
  else closest = [segStart[0] + param * C, segStart[1] + param * D]
  return distance(point, closest)
}

/** Minimum distance in km between two line segments. */
function segmentToSegmentDistance(
  s1a: Position, s1b: Position,
  s2a: Position, s2b: Position,
): number {
  return Math.min(
    pointToSegmentDistance(s1a, s2a, s2b),
    pointToSegmentDistance(s1b, s2a, s2b),
    pointToSegmentDistance(s2a, s1a, s1b),
    pointToSegmentDistance(s2b, s1a, s1b),
  )
}

/**
 * Returns the coordinate index sets from each route that form a parallel
 * overlap: segments must be both spatially close AND running in the same
 * (or opposite) direction.  Lines that merely cross near each other are
 * excluded by the bearing check.
 */
export function findOverlappingSegments(
  coordsA: Position[],
  coordsB: Position[],
  thresholdKm = 0.05,
  bearingToleranceDeg = 10,
): { indices1: Set<number>; indices2: Set<number> } {
  const indices1 = new Set<number>()
  const indices2 = new Set<number>()

  for (let i = 0; i < coordsA.length - 1; i++) {
    for (let j = 0; j < coordsB.length - 1; j++) {
      if (segmentToSegmentDistance(coordsA[i], coordsA[i + 1], coordsB[j], coordsB[j + 1]) > thresholdKm) continue
      if (!areBearingsParallel(bearing(coordsA[i], coordsA[i + 1]), bearing(coordsB[j], coordsB[j + 1]), bearingToleranceDeg)) continue
      indices1.add(i); indices1.add(i + 1)
      indices2.add(j); indices2.add(j + 1)
    }
  }

  return { indices1, indices2 }
}

// ---------------------------------------------------------------------------
// Route splitting utilities
// ---------------------------------------------------------------------------

export interface RouteSegment {
  coords: Position[]
  /** Index in the original coordinate array where this segment starts. */
  startIdx: number
  /** Index in the original coordinate array where this segment ends (inclusive). */
  endIdx: number
  isOverlap: boolean
  /** Set after addSegmentContinuity. */
  section?: OverlapSection
}

/**
 * Split a coordinate array into alternating non-overlap / overlap segments
 * based on `overlapIndices`.
 */
export function splitRouteByOverlap(
  coords: Position[],
  overlapIndices: Set<number>,
): RouteSegment[] {
  if (coords.length === 0) return []

  const segments: RouteSegment[] = []
  let segStart = 0
  let inOverlap = overlapIndices.has(0)

  for (let i = 1; i <= coords.length; i++) {
    const nowOverlap = i < coords.length ? overlapIndices.has(i) : !inOverlap
    if (nowOverlap !== inOverlap || i === coords.length) {
      segments.push({
        coords: coords.slice(segStart, i),
        startIdx: segStart,
        endIdx: i - 1,
        isOverlap: inOverlap,
      })
      segStart = i - 1 // share endpoint for continuity
      inOverlap = nowOverlap
    }
  }

  return segments
}

/**
 * Ensures adjacent segments share their boundary point so the rendered line
 * is continuous.
 */
export function addSegmentContinuity(segments: RouteSegment[]): void {
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i]
    const b = segments[i + 1]
    if (a.coords.length > 0 && b.coords.length > 0) {
      b.coords[0] = a.coords[a.coords.length - 1]
    }
  }
}

// ---------------------------------------------------------------------------
// Median spacing
// ---------------------------------------------------------------------------

/**
 * Compute the median great-circle distance between consecutive coordinates
 * across all features in a feature collection.  Used to set grid cell size.
 */
export function computeMedianSpacing(
  fc: FeatureCollection<LineString | MultiLineString, any>,
): number {
  const spacings: number[] = []
  for (const feature of fc.features) {
    const coordSets: Position[][] =
      feature.geometry.type === 'MultiLineString'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates]
    for (const coords of coordSets) {
      for (let i = 1; i < coords.length; i++) {
        spacings.push(distance(coords[i - 1], coords[i]))
      }
    }
  }
  if (spacings.length === 0) return 0.05
  spacings.sort((a, b) => a - b)
  return spacings[Math.floor(spacings.length / 2)]
}

// ---------------------------------------------------------------------------
// Line abbreviations
// ---------------------------------------------------------------------------

/**
 * Returns a short abbreviation for a line key used in segment naming.
 * Takes the first two letters of each capitalised word (or just the first two
 * characters for single-word keys).
 */
export function lineInitials(lineKey: string): string {
  const words = lineKey.replace(/([A-Z])/g, ' $1').trim().split(/\s+/)
  if (words.length >= 2) {
    return words[0].charAt(0) + words[1].charAt(0)
  }
  return lineKey.slice(0, 2)
}

// ---------------------------------------------------------------------------
// Same-line overlap removal
// ---------------------------------------------------------------------------

/** Spatial grid for degree-space proximity lookups used during deduplication. */
class DedupGrid {
  private cells = new Map<string, Position[]>()
  readonly threshold: number
  private cellSize: number

  constructor(thresholdDeg: number) {
    this.threshold = thresholdDeg
    this.cellSize = thresholdDeg * 2
  }

  private key(lon: number, lat: number): string {
    return `${Math.floor(lon / this.cellSize)},${Math.floor(lat / this.cellSize)}`
  }

  add(c: Position): void {
    const k = this.key(c[0], c[1])
    if (!this.cells.has(k)) this.cells.set(k, [])
    this.cells.get(k)!.push(c)
  }

  has(c: Position): boolean {
    const cx = Math.floor(c[0] / this.cellSize)
    const cy = Math.floor(c[1] / this.cellSize)
    const t2 = this.threshold * this.threshold
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const p of bucket) {
          const dlon = c[0] - p[0], dlat = c[1] - p[1]
          if (dlon * dlon + dlat * dlat <= t2) return true
        }
      }
    }
    return false
  }

  nearest(c: Position): Position | null {
    const cx = Math.floor(c[0] / this.cellSize)
    const cy = Math.floor(c[1] / this.cellSize)
    let best = Infinity, bestCoord: Position | null = null
    for (let dx = -10; dx <= 10; dx++) {
      for (let dy = -10; dy <= 10; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const p of bucket) {
          const dlon = c[0] - p[0], dlat = c[1] - p[1]
          const d2 = dlon * dlon + dlat * dlat
          if (d2 < best) { best = d2; bestCoord = p }
        }
      }
    }
    return bestCoord
  }

  nearestDist2(c: Position): number {
    const cx = Math.floor(c[0] / this.cellSize)
    const cy = Math.floor(c[1] / this.cellSize)
    let best = Infinity
    for (let dx = -10; dx <= 10; dx++) {
      for (let dy = -10; dy <= 10; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`)
        if (!bucket) continue
        for (const p of bucket) {
          const dlon = c[0] - p[0], dlat = c[1] - p[1]
          const d2 = dlon * dlon + dlat * dlat
          if (d2 < best) best = d2
        }
      }
    }
    return best
  }
}

/** Median inter-point spacing in degrees for a group of route features. */
function computeMedianSpacingDeg(
  lineRoutes: FeatureCollection<LineString | MultiLineString, any>['features'],
): number {
  const spacings: number[] = []
  for (const route of lineRoutes) {
    const coords: Position[] =
      route.geometry.type === 'MultiLineString'
        ? (route.geometry as MultiLineString).coordinates.flat()
        : (route.geometry as LineString).coordinates
    for (let i = 1; i < coords.length; i++) {
      const dx = coords[i][0] - coords[i - 1][0]
      const dy = coords[i][1] - coords[i - 1][1]
      spacings.push(Math.sqrt(dx * dx + dy * dy))
    }
  }
  if (spacings.length === 0) return 0.001
  spacings.sort((a, b) => a - b)
  return spacings[Math.floor(spacings.length / 2)]
}

/**
 * Deduplicate same-line overlapping routes.
 *
 * Groups routes by line, keeps the first route whole, then for each subsequent
 * route of the same line extracts only the unique (non-duplicate) sections.
 * Uses per-line adaptive proximity matching based on coordinate spacing so
 * that lines with wider point spacing still match correctly.
 *
 * Algorithm per line group:
 * 1. Compute median coordinate spacing → adaptive threshold (1.5× median).
 * 2. Keep the first route as-is and index all its coordinates.
 * 3. For each subsequent route, walk its coordinates:
 *    - Pre-classify as duplicate/unique with hysteresis to absorb short
 *      false-unique blips (< 3 coords) inside shared sections.
 *    - Accumulate consecutive unique coords into segments, bridging at
 *      boundaries by prepending/appending overlap coords snapped to the
 *      nearest kept coordinate.
 * 4. Merge adjacent segments whose endpoints meet.
 * 5. Index newly added unique coordinates so later routes don't repeat them.
 */
export function processRoutesForSameLineOverlaps(
  fc: FeatureCollection<LineString | MultiLineString, any>,
  lines: { [key: string]: Line },
): FeatureCollection<LineString | MultiLineString, any> {
  // Group features by line, filtering to known lines only
  const lineGroups = new Map<string, FeatureCollection<LineString | MultiLineString, any>['features']>()
  for (const feature of fc.features) {
    const lineKey = feature.properties?.line as string | undefined
    if (!lineKey || !lines[lineKey]) continue
    if (!lineGroups.has(lineKey)) lineGroups.set(lineKey, [])
    lineGroups.get(lineKey)!.push(feature)
  }

  const processedFeatures: FeatureCollection<LineString | MultiLineString, any>['features'] = []

  for (const [, lineRoutes] of lineGroups) {
    if (lineRoutes.length === 0) continue

    const medianSpacing = computeMedianSpacingDeg(lineRoutes)
    const lineThreshold = Math.min(0.01, Math.max(0.001, medianSpacing * 1.5))
    const keptCoords = new DedupGrid(lineThreshold)
    const convergeThresh2 = (lineThreshold / 5) ** 2

    // Keep the first route in full and index its coordinates
    const firstRoute = lineRoutes[0]
    const firstCoords: Position[] =
      firstRoute.geometry.type === 'MultiLineString'
        ? (firstRoute.geometry as MultiLineString).coordinates.flat()
        : (firstRoute.geometry as LineString).coordinates
    for (const c of firstCoords) keptCoords.add(c)
    processedFeatures.push(firstRoute)

    for (let routeIdx = 1; routeIdx < lineRoutes.length; routeIdx++) {
      const route = lineRoutes[routeIdx]
      const coords: Position[] =
        route.geometry.type === 'MultiLineString'
          ? (route.geometry as MultiLineString).coordinates.flat()
          : (route.geometry as LineString).coordinates

      // Pre-classify each coordinate as duplicate or unique
      const isDup: boolean[] = coords.map(c => keptCoords.has(c))

      // Hysteresis: absorb short unique runs (< 3 coords) bordered by duplicates
      const MIN_UNIQUE_RUN = 3
      let rs = 0
      while (rs < isDup.length) {
        if (isDup[rs]) { rs++; continue }
        let re = rs
        while (re < isDup.length && !isDup[re]) re++
        if (re - rs < MIN_UNIQUE_RUN && rs > 0 && re < isDup.length) {
          for (let k = rs; k < re; k++) isDup[k] = true
        }
        rs = re
      }

      // Walk coords collecting unique segments, bridging at overlap boundaries
      const routeSegments: Position[][] = []
      let uniqueSegment: Position[] = []
      let recentDups: Position[] = []

      for (let i = 0; i < coords.length; i++) {
        if (!isDup[i]) {
          if (uniqueSegment.length === 0 && recentDups.length > 0) {
            // Prepend duplicate coords back to where the route converges with kept
            const overlapCoords: Position[] = []
            for (let k = recentDups.length - 1; k >= 0; k--) {
              overlapCoords.unshift(recentDups[k])
              if (keptCoords.nearestDist2(recentDups[k]) <= convergeThresh2) break
            }
            if (overlapCoords.length > 0) {
              const snapped = keptCoords.nearest(overlapCoords[0])
              if (snapped) overlapCoords[0] = snapped
            }
            uniqueSegment.push(...overlapCoords)
          }
          uniqueSegment.push(coords[i])
          recentDups = []
        } else {
          if (uniqueSegment.length > 0) {
            // Append duplicate coords forward until back on the kept route
            for (let k = i; k < coords.length; k++) {
              if (!isDup[k]) break
              uniqueSegment.push(coords[k])
              if (keptCoords.nearestDist2(coords[k]) <= convergeThresh2) break
            }
            if (uniqueSegment.length >= 2) {
              const lastIdx = uniqueSegment.length - 1
              const snapped = keptCoords.nearest(uniqueSegment[lastIdx])
              if (snapped) uniqueSegment[lastIdx] = snapped
              routeSegments.push(uniqueSegment)
            }
            uniqueSegment = []
          }
          recentDups.push(coords[i])
        }
      }
      if (uniqueSegment.length >= 2) routeSegments.push(uniqueSegment)

      // Merge adjacent segments whose endpoints meet within threshold
      const mergeThresh2 = lineThreshold * lineThreshold
      for (let s = 0; s < routeSegments.length - 1; ) {
        const endA = routeSegments[s][routeSegments[s].length - 1]
        const startB = routeSegments[s + 1][0]
        const dx = endA[0] - startB[0], dy = endA[1] - startB[1]
        if (dx * dx + dy * dy <= mergeThresh2) {
          routeSegments[s] = [...routeSegments[s], ...routeSegments[s + 1].slice(1)]
          routeSegments.splice(s + 1, 1)
        } else {
          s++
        }
      }

      for (const seg of routeSegments) {
        processedFeatures.push({
          type: 'Feature',
          id: undefined,
          geometry: { type: 'LineString', coordinates: seg },
          properties: { ...route.properties },
        })
      }

      // Index unique coords so later routes don't re-add them
      for (const c of coords) keptCoords.add(c)
    }
  }

  return { type: 'FeatureCollection', features: processedFeatures }
}

// ---------------------------------------------------------------------------
// Overlap sections
// ---------------------------------------------------------------------------

export interface OverlapSection {
  id: string
  /** Set of lineKeys participating in the overlap. */
  lines: Set<string>
  /** Per-route coordinate index ranges that fall within this section. */
  routeRanges: Map<number, { startIdx: number; endIdx: number }>
}

/**
 * Detects corridors where two or more routes run parallel and close together.
 * Returns an array of OverlapSection objects.
 */
export function detectOverlapSections(
  fc: FeatureCollection<LineString | MultiLineString, any>,
  thresholdKm = 0.05,
): OverlapSection[] {
  const features = fc.features
  const sections: OverlapSection[] = []
  let sectionCounter = 0

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const lineA = features[i].properties?.line as string
      const lineB = features[j].properties?.line as string
      if (!lineA || !lineB || lineA === lineB) continue

      const coordsA: Position[] =
        features[i].geometry.type === 'MultiLineString'
          ? (features[i].geometry as MultiLineString).coordinates.flat()
          : (features[i].geometry as LineString).coordinates
      const coordsB: Position[] =
        features[j].geometry.type === 'MultiLineString'
          ? (features[j].geometry as MultiLineString).coordinates.flat()
          : (features[j].geometry as LineString).coordinates

      const { indices1: overlapA, indices2: overlapB } = findOverlappingSegments(coordsA, coordsB, thresholdKm)

      if (overlapA.size === 0 && overlapB.size === 0) continue

      const toRanges = (
        indices: Set<number>,
      ): { startIdx: number; endIdx: number }[] => {
        const sorted = [...indices].sort((a, b) => a - b)
        const ranges: { startIdx: number; endIdx: number }[] = []
        if (sorted.length === 0) return ranges
        let start = sorted[0]
        let prev = sorted[0]
        for (let k = 1; k <= sorted.length; k++) {
          if (k === sorted.length || sorted[k] > prev + 1) {
            ranges.push({ startIdx: start, endIdx: prev })
            if (k < sorted.length) {
              start = sorted[k]
              prev = sorted[k]
            }
          } else {
            prev = sorted[k]
          }
        }
        return ranges
      }

      const rangesA = toRanges(overlapA)
      const rangesB = toRanges(overlapB)

      const numSections = Math.max(rangesA.length, rangesB.length)
      for (let s = 0; s < numSections; s++) {
        const routeRanges = new Map<number, { startIdx: number; endIdx: number }>()
        if (s < rangesA.length) routeRanges.set(i, rangesA[s])
        if (s < rangesB.length) routeRanges.set(j, rangesB[s])

        const section: OverlapSection = {
          id: `section_${sectionCounter++}`,
          lines: new Set([lineA, lineB]),
          routeRanges,
        }
        sections.push(section)
      }
    }
  }

  return sections
}

// ---------------------------------------------------------------------------
// New interfaces
// ---------------------------------------------------------------------------

export interface SegmentInfo {
  name: string
  type: 'solo' | 'overlap'
  line: string
  overlapSectionId?: string
  featureIndex: number
}

export interface SegmentedRoutesResult {
  fc: FeatureCollection<LineString, any>
  segments: Map<string, SegmentInfo>
  segmentsByLine: Map<string, string[]>
  /** sectionId → Map<lineKey, segmentName> */
  overlapSegmentNames: Map<string, Map<string, string>>
}

// ---------------------------------------------------------------------------
// Station projection helpers
// ---------------------------------------------------------------------------

/**
 * Project a point onto a polyline using simple planar arithmetic (sufficient
 * for small areas at any longitude).  Returns the segment index and fraction
 * along that segment, plus the projected coordinate and distance in km.
 * Returns null if no projection lands within maxDistKm.
 */
export function projectOntoPolyline(
  point: Position,
  coords: Position[],
  maxDistKm = 0.1,
): { segmentIdx: number; frac: number; coord: Position; distKm: number } | null {
  let best: { segmentIdx: number; frac: number; coord: Position; distKm: number } | null = null

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i]
    const b = coords[i + 1]
    const ax = b[0] - a[0]
    const ay = b[1] - a[1]
    const len2 = ax * ax + ay * ay
    if (len2 < 1e-18) continue

    const px = point[0] - a[0]
    const py = point[1] - a[1]
    let frac = (px * ax + py * ay) / len2
    frac = Math.max(0, Math.min(1, frac))

    const proj: Position = [a[0] + frac * ax, a[1] + frac * ay]
    const d = distance(point, proj)

    if (d < maxDistKm && (!best || d < best.distKm)) {
      best = { segmentIdx: i, frac, coord: proj, distKm: d }
    }
  }

  return best
}

/**
 * Split a polyline at projected station positions so that interpolated offset
 * transitions happen at station locations (hidden behind station circles).
 *
 * If no stations project onto the polyline, returns [{name: baseName, coords}].
 * If splits occur, returns [{name: baseName_a, coords}, {name: baseName_b, ...}, ...].
 */
export function splitTransitionAtStations(
  coords: Position[],
  stations: { coord: Position }[],
  baseName: string,
  maxDistKm = 0.05,
): Array<{ name: string; coords: Position[] }> {
  if (coords.length < 2 || stations.length === 0) {
    return [{ name: baseName, coords }]
  }

  type SplitPoint = { segmentIdx: number; frac: number; coord: Position }
  const splitPoints: SplitPoint[] = []

  for (const station of stations) {
    const proj = projectOntoPolyline(station.coord, coords, maxDistKm)
    if (!proj) continue
    // Exclude projections clamped to the very endpoints
    if (proj.segmentIdx === 0 && proj.frac < 0.01) continue
    if (proj.segmentIdx === coords.length - 2 && proj.frac > 0.99) continue
    splitPoints.push({ segmentIdx: proj.segmentIdx, frac: proj.frac, coord: proj.coord })
  }

  if (splitPoints.length === 0) {
    return [{ name: baseName, coords }]
  }

  // Sort by position along polyline
  splitPoints.sort((a, b) =>
    a.segmentIdx !== b.segmentIdx ? a.segmentIdx - b.segmentIdx : a.frac - b.frac,
  )

  // Deduplicate split points that are very close together on the same segment
  const deduped: SplitPoint[] = [splitPoints[0]]
  for (let i = 1; i < splitPoints.length; i++) {
    const prev = deduped[deduped.length - 1]
    const curr = splitPoints[i]
    if (prev.segmentIdx === curr.segmentIdx && curr.frac - prev.frac < 0.01) continue
    deduped.push(curr)
  }

  // Rebuild coordinate array with split points inserted
  const subCoords: Position[][] = []
  let current: Position[] = [coords[0]]

  for (let i = 0; i < coords.length - 1; i++) {
    const here = deduped.filter(s => s.segmentIdx === i)
    for (const s of here) {
      current.push(s.coord)
      subCoords.push(current)
      current = [s.coord]
    }
    current.push(coords[i + 1])
  }
  subCoords.push(current)

  const valid = subCoords.filter(c => c.length >= 2)
  if (valid.length <= 1) {
    return [{ name: baseName, coords }]
  }

  return valid.map((c, idx) => ({
    name: `${baseName}_${String.fromCharCode(97 + idx)}`,
    coords: c,
  }))
}

// ---------------------------------------------------------------------------
// buildSegmentedRoutes
// ---------------------------------------------------------------------------

/**
 * Splits each route into named segments with `overlapOffsetPx: 0` on all
 * features.  Caller stamps actual offsets via computeInterpolatedOffsets.
 *
 * Non-overlap segments adjacent to an overlap corridor are split at station
 * positions (when `stations` is provided) so that interpolated transitions
 * are hidden behind station circles.
 *
 * Naming convention:
 *   - overlap: `{ownAbbrev}_{otherAbbrevsSorted}_{counter}`
 *   - solo:    `{lineAbbrev}{counter}` (or `{lineAbbrev}{counter}_a/b/c` when split)
 */
export function buildSegmentedRoutes(
  fc: FeatureCollection<LineString | MultiLineString, any>,
  sections: OverlapSection[],
  lines: { [key: string]: Line },
  stations?: { coord: Position }[],
): SegmentedRoutesResult {
  const abbr = (lineKey: string) => lines[lineKey]?.abbreviation ?? lines[lineKey]?.name ?? lineInitials(lineKey)

  const features = fc.features

  // Step 1: Build routeOverlapRanges
  const routeOverlapRanges = new Map<
    number,
    Array<{ section: OverlapSection; startIdx: number; endIdx: number }>
  >()

  for (const section of sections) {
    for (const [routeIdx, range] of section.routeRanges) {
      if (!routeOverlapRanges.has(routeIdx)) {
        routeOverlapRanges.set(routeIdx, [])
      }
      routeOverlapRanges.get(routeIdx)!.push({
        section,
        startIdx: range.startIdx,
        endIdx: range.endIdx,
      })
    }
  }

  // Step 2: Assign names to all (section, lineKey) pairs
  const overlapNameCounters = new Map<string, number>()
  const sectionLineNames = new Map<string, string>()
  const overlapSegmentNames = new Map<string, Map<string, string>>()

  for (const section of sections) {
    const sortedLines = [...section.lines].sort()
    if (!overlapSegmentNames.has(section.id)) {
      overlapSegmentNames.set(section.id, new Map())
    }
    for (const lineKey of sortedLines) {
      const ownAbbr = abbr(lineKey)
      const otherAbbrStr = sortedLines
        .filter(l => l !== lineKey)
        .map(abbr)
        .sort()
        .join('_')
      const prefix = `${ownAbbr}_${otherAbbrStr}`
      const counter = overlapNameCounters.get(prefix) ?? 0
      overlapNameCounters.set(prefix, counter + 1)
      const name = `${prefix}_${counter}`
      sectionLineNames.set(`${section.id}+${lineKey}`, name)
      overlapSegmentNames.get(section.id)!.set(lineKey, name)
    }
  }

  // Step 3: Process each route feature
  const outFeatures: Array<{
    type: 'Feature'
    id: number
    geometry: { type: 'LineString'; coordinates: Position[] }
    properties: Record<string, any>
  }> = []

  const segmentMap = new Map<string, SegmentInfo>()
  const segmentsByLine = new Map<string, string[]>()
  const soloCounters = new Map<string, number>()

  let outId = 0

  for (let ri = 0; ri < features.length; ri++) {
    const feature = features[ri]
    const lineKey = feature.properties?.line as string | undefined
    if (!lineKey || !lines[lineKey]) continue

    let coords: Position[]
    if (feature.geometry.type === 'MultiLineString') {
      coords = (feature.geometry as MultiLineString).coordinates.flat()
    } else {
      coords = (feature.geometry as LineString).coordinates
    }

    if (!segmentsByLine.has(lineKey)) segmentsByLine.set(lineKey, [])

    const overlapRanges = routeOverlapRanges.get(ri) ?? []

    if (overlapRanges.length === 0) {
      // Entire route is solo — emit as one feature (no station splitting needed
      // since there are no adjacent overlap segments)
      const soloCounter = soloCounters.get(lineKey) ?? 0
      soloCounters.set(lineKey, soloCounter + 1)
      const segName = `${abbr(lineKey)}${soloCounter}`

      outFeatures.push({
        type: 'Feature',
        id: outId++,
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          ...feature.properties,
          segmentName: segName,
          segmentType: 'solo',
          overlapOffsetPx: 0,
        },
      })
      segmentMap.set(segName, { name: segName, type: 'solo', line: lineKey, featureIndex: outId - 1 })
      segmentsByLine.get(lineKey)!.push(segName)
      continue
    }

    // Build overlapIndices and indexToSection
    const overlapIndices = new Set<number>()
    const indexToSection = new Map<number, OverlapSection>()
    for (const { section, startIdx, endIdx } of overlapRanges) {
      for (let idx = startIdx; idx <= endIdx; idx++) {
        if (idx < coords.length) {
          overlapIndices.add(idx)
          indexToSection.set(idx, section)
        }
      }
    }

    const routeSegments = splitRouteByOverlap(coords, overlapIndices)
    addSegmentContinuity(routeSegments)

    // Assign sections to overlap segments via midpoint lookup
    for (const seg of routeSegments) {
      if (!seg.isOverlap) continue
      const midIdx = Math.floor((seg.startIdx + seg.endIdx) / 2)
      let closestSection: OverlapSection | undefined
      for (let di = 0; di <= seg.endIdx - seg.startIdx; di++) {
        closestSection = indexToSection.get(midIdx + di) ?? indexToSection.get(midIdx - di)
        if (closestSection) break
      }
      seg.section = closestSection
    }

    for (let si = 0; si < routeSegments.length; si++) {
      const seg = routeSegments[si]
      if (seg.coords.length < 2) continue

      let segName: string
      let segType: 'solo' | 'overlap'
      let overlapSectionId: string | undefined

      if (seg.isOverlap && seg.section) {
        const lookupKey = `${seg.section.id}+${lineKey}`
        segName = sectionLineNames.get(lookupKey) ?? (() => {
          const c = soloCounters.get(lineKey) ?? 0
          soloCounters.set(lineKey, c + 1)
          return `${abbr(lineKey)}${c}`
        })()
        segType = 'overlap'
        overlapSectionId = seg.section.id
      } else {
        const soloCounter = soloCounters.get(lineKey) ?? 0
        soloCounters.set(lineKey, soloCounter + 1)
        segName = `${abbr(lineKey)}${soloCounter}`
        segType = 'solo'
      }

      // Split non-overlap segments adjacent to overlap corridors at station positions
      const isPrevOverlap = si > 0 && routeSegments[si - 1].isOverlap
      const isNextOverlap = si < routeSegments.length - 1 && routeSegments[si + 1].isOverlap
      const shouldSplit = segType === 'solo' && (isPrevOverlap || isNextOverlap) && stations && stations.length > 0

      if (shouldSplit) {
        const splits = splitTransitionAtStations(seg.coords, stations!, segName)
        for (const split of splits) {
          outFeatures.push({
            type: 'Feature',
            id: outId++,
            geometry: { type: 'LineString', coordinates: split.coords },
            properties: {
              ...feature.properties,
              segmentName: split.name,
              segmentType: 'solo',
              overlapOffsetPx: 0,
            },
          })
          segmentMap.set(split.name, { name: split.name, type: 'solo', line: lineKey, featureIndex: outId - 1 })
          segmentsByLine.get(lineKey)!.push(split.name)
        }
      } else {
        outFeatures.push({
          type: 'Feature',
          id: outId++,
          geometry: { type: 'LineString', coordinates: seg.coords },
          properties: {
            ...feature.properties,
            segmentName: segName,
            segmentType: segType,
            ...(overlapSectionId ? { overlapSectionId } : {}),
            overlapOffsetPx: 0,
          },
        })
        segmentMap.set(segName, {
          name: segName,
          type: segType,
          line: lineKey,
          ...(overlapSectionId ? { overlapSectionId } : {}),
          featureIndex: outId - 1,
        })
        segmentsByLine.get(lineKey)!.push(segName)
      }
    }
  }

  const outFc: FeatureCollection<LineString, any> = {
    type: 'FeatureCollection',
    features: outFeatures as any,
  }

  return {
    fc: outFc,
    segments: segmentMap,
    segmentsByLine,
    overlapSegmentNames,
  }
}

// ---------------------------------------------------------------------------
// computeInterpolatedOffsets
// ---------------------------------------------------------------------------

/**
 * Compute effective offset for every segment in every line, interpolating
 * between explicitly-set values and clamping at the extremes.
 *
 * Segments absent from explicitOffsets are "unspecified":
 *   - Between two specified segments: linearly interpolated
 *   - Before the first specified: clamped to its value
 *   - After the last specified: clamped to its value
 *   - If no segments are specified for a line: all default to 0
 */
export function computeInterpolatedOffsets(
  segmentsByLine: Map<string, string[]>,
  explicitOffsets: Map<string, number>,
): Map<string, number> {
  const result = new Map<string, number>()

  for (const [, segs] of segmentsByLine) {
    const specified: Array<{ idx: number; value: number }> = []
    for (let i = 0; i < segs.length; i++) {
      if (explicitOffsets.has(segs[i])) {
        specified.push({ idx: i, value: explicitOffsets.get(segs[i])! })
      }
    }

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i]
      if (explicitOffsets.has(seg)) {
        result.set(seg, explicitOffsets.get(seg)!)
        continue
      }

      const prev = [...specified].reverse().find(s => s.idx < i)
      const next = specified.find(s => s.idx > i)

      if (!prev && !next) {
        result.set(seg, 0)
      } else if (!prev) {
        result.set(seg, next!.value)
      } else if (!next) {
        result.set(seg, prev.value)
      } else {
        const t = (i - prev.idx) / (next.idx - prev.idx)
        result.set(seg, prev.value + t * (next.value - prev.value))
      }
    }
  }

  return result
}
