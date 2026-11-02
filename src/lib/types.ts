import { FeatureCollection, MultiLineString, LineString, Point } from 'geojson'
import { MapboxOptions } from 'mapbox-gl'
import { Metadata } from 'next'

export type SortOptionType = 'order' | 'name' | 'line'

export type DataFeatureCollection = FeatureCollection<
  LineString | MultiLineString | Point,
  {
    name: string
    id?: number | null
    long_name?: string
    short_name?: string
    line?: string
  }
>

export type RoutesFeatureCollection = FeatureCollection<
  LineString | MultiLineString,
  {
    color: string
  }
>

export type DataFeature = DataFeatureCollection['features'][number]

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
   * - "default": the ring around the line logo is the line's 'color', and fills up with the line's 'textColor'
   * - "inverted": the ring around the line logo is white, and fills up with the line's 'color'
   */
  GAUGE_COLORS?: 'inverted' | 'default'

  LOCALE: string
  CITY_NAME: string
  STRIPE_LINK: string
  MAP_CONFIG: MapboxOptions
  METADATA: Metadata
  LINES: { [key: string]: Line }
  BEG_THRESHOLD: number
}
