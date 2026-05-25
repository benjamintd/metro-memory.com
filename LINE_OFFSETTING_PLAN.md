# Line Offsetting Implementation Plan

## Overview
When `MAP_FROM_DATA = true`, multiple transit lines may share the same route segments (e.g., Circle and District lines in London running parallel). Currently, these render on top of each other, making them invisible. This plan adds intelligent detection and perpendicular offsetting to ensure all overlapping lines are visible.

## Problem Statement
- **Input**: GeoJSON FeatureCollection of routes with multiple LineString features
- **Issue**: When lines share the same coordinates (colinear), only the top-rendered line is visible
- **Goal**: Detect colinear segments and apply perpendicular offsets proportional to line order/color, ensuring all lines remain visible

### Real World Examples
- **London**: Circle/District lines run parallel in many sections
- **München**: Multiple lines overlap on shared trunk routes
- **Hamburg**: U-Bahn and S-Bahn lines share some segments

## Architecture

### Data Flow
```
routes.json (FeatureCollection)
    ↓
[NEW] processRoutesForOffsets() in GamePage
    ↓
Modified FeatureCollection with offset coordinates
    ↓
mapboxgl addSource('lines', modifiedRoutes)
    ↓
Rendered with visible separation
```

### Core Files
1. **`src/lib/lineOffsetting.ts`** (NEW)
   - Geometry utility functions
   - Colinearity detection
   - Offset calculation
   - Main processing function

2. **`src/components/GamePage.tsx`** (MODIFIED)
   - Import processor
   - Call when `MAP_FROM_DATA && routes`
   - Pass processed routes to `addSource()`

## Algorithm Design

### Phase 1: Geometry Utilities
Create `src/lib/lineOffsetting.ts` with:

```typescript
// Distance between two points (haversine for accuracy at zoom levels)
function distance(p1: [number, number], p2: [number, number]): number

// Direction/bearing from p1 to p2 in radians
function bearing(p1: [number, number], p2: [number, number]): number

// Calculate perpendicular offset point
// Given a point on a line, move it perpendicular by distance
function offsetPoint(
  point: [number, number],
  bearing: number,
  offsetDistance: number,
  perpendicular: boolean // true = move perpendicular, false = move in bearing direction
): [number, number]

// Check if three consecutive points form a colinear (straight) segment
// Returns true if angle variation is < threshold (e.g., 2 degrees)
function areColinear(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  angleThreshold: number = 2
): boolean
```

**Key Insight**: Use haversine distance to account for lat/lng curvature, especially important for large geographic areas.

### Phase 2: Colinearity Detection
Identify segments where multiple routes overlap:

```typescript
interface SegmentMatch {
  segment: [number, number][] // matched coordinates
  lineIndex: number[]          // which line IDs match this segment
  bearing: number              // direction of segment
}

function findColinearSegments(
  routes: FeatureCollection,
  distanceThreshold: number = 0.0001 // ~10 meters at equator
): SegmentMatch[]
```

**Algorithm**:
1. Extract all coordinate segments from all routes
2. For each pair of routes:
   - Find coordinate pairs that are within `distanceThreshold`
   - Verify bearing matches (same direction)
   - Group consecutive matching coordinates into segments
3. Return list of overlapping segments with participating line IDs

### Phase 3: Offset Calculation
Determine offset distance for each line in an overlapping segment:

```typescript
interface LineOffset {
  lineIndex: number
  offsetDistance: number  // negative = left, positive = right
  offsetDirection: number // perpendicular bearing
}

function calculateOffsets(
  segment: SegmentMatch,
  routes: FeatureCollection
): LineOffset[]
```

**Strategy**:
- Base offset distance: `0.0001` degrees (~10 meters at equator, scalable by zoom)
- Line order matters: use `config.LINES[lineId].order` to determine priority
  - Lower order = closer to original line (offset: -offsetDistance)
  - Higher order = farther from original (offset: +offsetDistance)
- Stagger pattern: for 2 lines: [-offset, +offset], for 3 lines: [-offset, 0, +offset], etc.

### Phase 4: Apply Offsets with Smooth Transitions
Modify route coordinates with feathered transition zones:

```typescript
function applyOffsetsToRoutes(
  routes: FeatureCollection,
  colinearSegments: SegmentMatch[],
  lineOrders: { [lineId: string]: number }
): FeatureCollection
```

**Algorithm**:
1. For each route feature, identify all coordinate indices involved in colinear segments
2. For each identified segment:
   - **Entry transition zone** (2-3 points before overlap): gradually interpolate offset from 0 → full
   - **Core overlap section**: apply full offset
   - **Exit transition zone** (2-3 points after overlap): gradually interpolate offset from full → 0
3. Transition is linear: offset multiplier goes 0.0 → 1.0 → 0.0

**Visualization**:
```
Original:  A ---- B ---- [C ---- D ---- E] ---- F ---- G
           (no)  (ramp   (full)  (full) (ramp)  (no)   (no)
                  up 0-1)         down 1-0)

Result:    A ---- B'---- [C'--- D'--- E'] ---- F'---- G
           where B'→C' has smooth curve (offset 0→1)
           and E'→F' has smooth curve (offset 1→0)
```

**Key Points**:
- Transition zones are **2-3 coordinates** on each side (configurable)
- Offset multiplier: `0.0` → `0.33` → `0.67` → `1.0` (linear interpolation)
- Creates smooth S-curve at boundaries instead of sharp kinks
- Requires inserting new intermediate points at boundaries

### Phase 4.5: Transition Zone Interpolation Helper

Create utility function for smooth transitions:

```typescript
interface OffsetZone {
  startIndex: number           // first coordinate of transition/core zone
  endIndex: number             // last coordinate of transition/core zone
  offsetMultiplier: number[]   // per-coordinate: 0.0 to 1.0 (one value per coordinate in zone)
  zoneType: 'entry' | 'core' | 'exit'
}

function createTransitionZones(
  colinearIndices: number[],      // indices of all colinear coordinates in this route
  transitionWidth: number = 3     // number of points to feather on each side
): OffsetZone[]
```

**Algorithm**:
1. Find start/end indices of colinear section
2. **Entry zone**: points from `[start - transitionWidth]` to `[start - 1]`
   - Offsets: `[0.0, 0.33, 0.67]` (ramp up to 1.0)
3. **Core zone**: points from `[start]` to `[end]`
   - Offsets: all `1.0` (full offset)
4. **Exit zone**: points from `[end + 1]` to `[end + transitionWidth]`
   - Offsets: `[0.67, 0.33, 0.0]` (ramp down from 1.0)

**Edge cases**:
- If colinear section starts/ends near beginning/end of route: reduce transition width
- Avoid overlapping transition zones from different overlapping segments

### Phase 5: Integration in GamePage

In `GamePage.tsx` `useEffect` for Mapbox setup:

```typescript
if (MAP_FROM_DATA && routes) {
  // NEW: Process routes for offset
  const processedRoutes = processRoutesForOffsets(routes, LINES)
  
  
  mapboxMap.addSource('lines', {
    type: 'geojson',
    data: processedRoutes,  // Use processed routes instead of raw
  })
  
  // Rest of layer setup unchanged...
}
```

## Implementation Steps

### Step 1: Create Utility Library (Phase 1)
- [ ] Create `src/lib/lineOffsetting.ts`
- [ ] Implement distance calculation (haversine)
- [ ] Implement bearing calculation
- [ ] Implement offsetPoint function
- [ ] Implement areColinear check
- **Testing**: Unit test each function with known coordinate pairs

### Step 2: Implement Colinearity Detection (Phase 2)
- [ ] Implement `findColinearSegments()`
- [ ] Test with London routes (Circle/District overlap)
- **Validation**: Log detected overlaps, verify they match visual inspection

### Step 3: Implement Offset Calculation (Phase 3)
- [ ] Implement `calculateOffsets()` with line priority logic
- [ ] Handle edge cases: 2 lines, 3+ lines, single line (no offset)
- **Testing**: Verify offset distances are reasonable

### Step 4: Implement Transition Zone Helper (Phase 4.5) ⭐ NEW
- [ ] Implement `createTransitionZones()` helper
- [ ] Handle edge cases: sections near start/end of route
- [ ] Ensure no overlapping transition zones
- **Testing**: Verify feathering multipliers produce smooth curves

### Step 5: Implement Offset Application with Transitions (Phase 4)
- [ ] Implement `applyOffsetsToRoutes()` using transition zones
- [ ] For each coordinate, calculate interpolated offset using zone multiplier
- [ ] Create modified FeatureCollection structure
- [ ] Preserve non-overlapping segments exactly
- **Testing**: Verify smooth S-curves at boundaries, no sharp kinks

### Step 6: Create Main Processor Function
- [ ] Combine phases 2-4.5 into `processRoutesForOffsets(routes, LINES)`
- [ ] Add configuration for offset amount + transition width (make tunable if needed)
- [ ] Handle edge case: routes with fewer than 2 coordinates

### Step 7: Integrate into GamePage
- [ ] Import processor
- [ ] Call when MAP_FROM_DATA && routes
- [ ] Pass through LINES config for ordering
- [ ] Update dependency array in useEffect

### Step 8: Visual Testing

**London (22 lines, known overlaps)**:
1. Run `npm run dev`
2. Navigate to `/london`
3. Zoom to areas known to have overlapping lines:
   - Circle/District around Farringdon/Barbican
   - Elizabeth/Northern around Bank
   - Bakerloo/Circle around Oxford Circus
4. Verify all lines visible with smooth offset and transitions
5. **Inspect at multiple zoom levels** - offsets should look natural at all scales

**Hamburg (well-structured example)**:
1. Check S-Bahn and U-Bahn overlaps
2. Verify smooth transitions at segment boundaries

**München, Potsdam, Budapest, Dresden**: Quick visual check that offsets and transitions look reasonable

## Testing Strategy

### Unit Tests (Phase-by-phase)
For each utility function, create test cases with known coordinates:
```typescript
// Example: distance between two points 1 degree apart at equator
const p1 = [0, 0] as [number, number]
const p2 = [1, 0] as [number, number]
expect(distance(p1, p2)).toBeCloseTo(111.32, 1) // ~111 km per degree
```

### Integration Tests
1. Load London routes
2. Process with `processRoutesForOffsets()`
3. Verify output is valid GeoJSON
4. Verify line count unchanged
5. Verify coordinate counts match input

### Visual Tests
1. Launch dev server
2. Inspect rendered map at multiple zoom levels
3. Check:
   - Overlapping lines are offset and visible
   - Offset lines don't disconnect at segment boundaries
   - Non-overlapping lines unchanged
   - Performance acceptable (large feature sets)

## Edge Cases & Considerations

### Critical: Smooth Transitions at Segment Boundaries ⭐
**Problem**: Joining offset coordinates directly to non-offset coordinates creates sharp kinks.
**Solution**: Use **feathered transition zones** on entry/exit
- 2-3 points on each side of overlap section
- Offset multiplier ramps from 0.0 → 1.0 → 0.0
- Creates smooth S-curve instead of discontinuity
- This was the key insight from testing the initial design

### Zoom-dependent offsets
Offsets in degrees should scale visually at all zoom levels
- Consider: Offset in degrees vs. pixels (Mapbox handles pixel-based better)
- Alternative: Use Mapbox `line-offset` paint property instead of modifying coordinates
- **Decision**: Start with coordinate offsetting + transitions; can switch to paint property if needed

### Three or more overlapping lines
- Strategy: Stagger offsets (e.g., -2x, 0, +2x)
- Requires line priority/order configuration
- Transitions apply to each line independently

### Segment boundaries handling
- ✅ **SOLVED** by transition zones (see above)
- Smooth ramp ensures natural-looking curves
- No discontinuities even with rapid offset changes

### Performance
- Routes.json can be very large (London: 56k+ lines)
- Algorithm should be O(n²) at worst, optimized with spatial indexing if needed
- Transition zone creation adds minor O(n) pass per route

### Reversibility
- Don't modify input routes.json; only modify in memory
- Preprocessing should happen on each map load (not persisted)

## Configuration & Tuning

Potentially expose as config options:
```typescript
// In each city's config.ts
OFFSET_CONFIG: {
  enabled: true,
  distanceThreshold: 0.0001,      // degrees, ~10m at equator
  offsetDistance: 0.00015,         // degrees, ~15m between parallel lines
  useMapboxOffsets: false,         // true = use paint property, false = modify coordinates
}
```

**Start with hardcoded values; make configurable only if needed.**

## Success Criteria

- ✅ Overlapping lines are visible and offset
- ✅ All routes render without gaps or visual artifacts
- ✅ Works across all cities with MAP_FROM_DATA = true
- ✅ Performance acceptable (no noticeable lag)
- ✅ Non-overlapping sections unchanged
- ✅ Feature gracefully handles edge cases (1 line, 3+ lines, no overlaps)
