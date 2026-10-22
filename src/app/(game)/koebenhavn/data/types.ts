import type { Feature, LineString, MultiLineString, Point } from "geojson";
import type { DataFeature } from "./gameTypes.js";

type IsOptional<O, K extends keyof O> = {} extends Pick<O, K> ? true : false;

type MakeOptionalExplicit<O> = {
  [K in keyof O]: IsOptional<O, K> extends true ? O[K] | undefined : O[K];
};

type Override<A, B> = Exclude<A, keyof B> & B;

export type Station = Override<
  Feature<
    Point,
    MakeOptionalExplicit<
      Override<
        DataFeature["properties"],
        {
          // Setting a station's id to null means that it will never be matched,
          // so we must disallow null
          id: number;

          // alternate_names is mentioned in the README, but not in any types
          alternate_names?: string | string[];
        }
      >
    >
  >,
  {
    // If id is missing (or undefined?), then any correct guess
    // reveals *all* stations.
    // If id is a string, then any correct guess matches reveals
    // *no* stations.
    // So we must constrain id to be a number.
    id: number;
  }
>;

export type Track = Feature<
  LineString | MultiLineString,
  { color: string; line: string } & Record<string, string>
>;

export type Line = {
  name: string;
  color: string;
  backgroundColor: string;
  textColor: string;

  // Used to order the results when "sort by: line" is chosen
  // 0 sorts after non-zeroes, so you probably want to start at 1.
  order: number;
};

export type LineWithCode = {
  k: string;
  v: Line;
};

export type DataFile = {
  lines: LineWithCode[];
  stations: Station[];
  tracks: Track[];
};
