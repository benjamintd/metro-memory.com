import { Feature, FeatureCollection, MultiLineString, LineString, Point } from 'geojson'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'
import type { ReadonlyDeep } from 'type-fest'

export type SortOptionType = 'order' | 'name' | 'line'

export type Station = Feature<
  LineString | MultiLineString | Point,
  {
    /**
     * station.properties.id must be the same as station.id
     */
    id: number
    name: string
    line: string
    alternate_names?: string[]
    /**
     * @deprecated use {@link Station.alternate_names} instead
     */
    long_name?: string
    /**
     * @deprecated use {@link Station.alternate_names} instead
     */
    short_name?: string
  }
> & {
  /**
   * station.id must be the same as station.properties.id
   */
  id: number
}

/**
 * @deprecated use {@link Station} instead
 */
export type DataFeature = Station

export type StationCollection = {
  type: 'FeatureCollection'
  features: Station[]
}

/**
 * @deprecated use {@link StationCollection} instead
 */
export type DataFeatureCollection = StationCollection

export type RoutesFeatureCollection = FeatureCollection<
  LineString | MultiLineString,
  {
    color: string
  }
>

export type GameData = ReadonlyDeep<{
  fc: StationCollection
  routes?: RoutesFeatureCollection
}>

export interface SortOption {
  name: string
  id: SortOptionType
  shortName: React.ReactNode
}

export interface Line {
  name: string

  /**
   * - the colour of the middle dot of each found station
   * - also used for the gauges; see {@link Config.GAUGE_COLORS}
   */
  color: string

  /**
   * the shadow colour around the middle dot of each found station
   */
  backgroundColor: string

  /**
   * used for the gauges; see {@link Config.GAUGE_COLORS}
   */
  textColor: string

  /**
   * Used when viewing the results with 'sort by: line'.
   * Note that 0 sorts after non-zero values, so you probably want to start at 1.
   */
  order: number
}

export interface Config {
  MAP_FROM_DATA?: boolean

  /**
   * GAUGE_COLORS affects how the per-line gauges are rendered.
   * - "default": the ring around the line logo is {@link Line.color the line's 'color'},
   *    and fills up with {@link Line.textColor the line's 'textColor'}
   * - "inverted": the ring around the line logo is white, and fills up
   *    with {@link Line.color the line's 'color'}
   */
  GAUGE_COLORS?: 'inverted' | 'default'

  LOCALE: string
  CITY_NAME: string
  STRIPE_LINK: string
  MAP_CONFIG: MapboxOptions
  METADATA: Metadata
  LINES: { [key: string]: Line }

  /**
   * When (found stations / total stations) reaches BEG_THRESHOLD,
   * we prompt the player to make a donation to support the project.
   * e.g. `0.2` means once they have found 20% of the answers in this city.
   */
  BEG_THRESHOLD: number
}
