export type SourceJson = {
  lines: {
    lineId: string
    relations: {
      relationId: number
      stationsNodeIds: number[]
      routesWayIds: number[]
    }[]
    extraStationNodeIds: number[]
    extraRouteWayIds: number[]
  }[]
  ways: { wayId: number; nodeIds: number[] }[]
  nodes: { nodeId: number; name?: string; lat: number; lon: number }[]
}

// ----------------------------------------
// line configuration
// ----------------------------------------
// One shared green for every S-Bahn line, so they read as one system on the map.
const SBAHN_COLOR = '#009640'

// The relation ids below are the OSM `route_master` relations of the twelve KVB
// Stadtbahn/tram lines and the four S-Bahn lines. `download-osm-raw-data.ts` recurses into
// their child route relations, so listing the master is enough. Colours are the `colour`
// tags of those same relations, which match the official KVB network map.
export const linesMetadata: {
  [id: string]: {
    name: string
    osm: {
      relationIds: number[]
      extraStationNodeIds: number[]
      extraRouteWayIds: number[]
    }
    color: string
    /**
     * Only keep the part of the line between these two stops (OSM stop names, inclusive).
     * Both the station list and the drawn track are cut there. Used for the S-Bahn lines
     * that run far beyond the Cologne network; omit to keep a line whole.
     */
    segment?: { from: string; to: string }
  }
} = {
  Koeln1: {
    name: '1',
    osm: {
      relationIds: [5209167],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#d52330',
  },
  Koeln3: {
    name: '3',
    osm: {
      relationIds: [2026288],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#e693b5',
  },
  Koeln4: {
    name: '4',
    osm: {
      relationIds: [5742445],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#e06e9f',
  },
  Koeln5: {
    name: '5',
    osm: {
      relationIds: [2003477],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#948fb8',
  },
  Koeln7: {
    name: '7',
    osm: {
      relationIds: [5231292],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#e6855c',
  },
  Koeln9: {
    name: '9',
    osm: {
      relationIds: [36132],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#e6877e',
  },
  Koeln12: {
    name: '12',
    osm: {
      relationIds: [36133],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#8cc63f',
  },
  Koeln13: {
    name: '13',
    osm: {
      relationIds: [2003476],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#967b68',
  },
  Koeln15: {
    name: '15',
    osm: {
      relationIds: [36134],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#54ad4b',
  },
  Koeln16: {
    name: '16',
    osm: {
      relationIds: [5742444],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#21bfc1',
  },
  Koeln17: {
    name: '17',
    osm: {
      relationIds: [5740169],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#6dcff6',
  },
  Koeln18: {
    name: '18',
    osm: {
      relationIds: [1646141],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#0095da',
  },

  // S-Bahn. All four share one green; #009640 is the colour OSM carries on the S12
  // relation, so it has the same provenance as the tram colours above.
  KoelnS6: {
    name: 'S6',
    osm: {
      relationIds: [2445013],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: SBAHN_COLOR,
    // the relation continues to Essen Hbf
    segment: { from: 'Köln-Worringen', to: 'Langenfeld (Rheinland)' },
  },
  KoelnS11: {
    name: 'S11',
    osm: {
      relationIds: [2445000],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: SBAHN_COLOR,
    // the relation continues to Düsseldorf Flughafen Terminal
    segment: { from: 'Dormagen', to: 'Bergisch Gladbach' },
  },
  KoelnS12: {
    name: 'S12',
    osm: {
      relationIds: [2445001],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: SBAHN_COLOR,
  },
  KoelnS19: {
    name: 'S19',
    osm: {
      relationIds: [4434302],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: SBAHN_COLOR,
  },
}

// ----------------------------------------
// station data source
// ----------------------------------------
// Official KVB stop export (https://www.kvb.koeln open data), re-encoded from CP1252 to
// UTF-8. Rows with Betriebsbereich=STRAB are the tram/Stadtbahn stops; it is the naming
// authority for everything inside the KVB area. It stops at the KVB/SWB boundary, so the
// Bonn stops of lines 16 and 18 come from OSM instead.
export const KVB_STATIONS_CSV = './kvb-stations.csv'

// Two stops of the same line are considered the same physical station when their names
// normalise identically, or when they are closer than this. Measured against the real
// data, name variants sit within 33 m of their counterpart and the nearest genuinely
// different station is 1334 m away, so this threshold is far from either edge.
export const SAME_STATION_MAX_DISTANCE_M = 250

// ----------------------------------------
// alternate names
// ----------------------------------------
// The purely orthographic variants (Straße/Str., Bf/Bahnhof, Hbf/Hauptbahnhof) need no
// entry here: the `koeln` replacer in hooks/useNormalizeString.ts folds them together for
// every station. `preprocess.ts` also adds the OSM spelling of every station whose KVB
// name differs. These are the Cologne-specific ones on top of that.
export const alternateNames: { [stationName: string]: string[] | undefined } = {
  // Köln Hbf and Köln Messe/Deutz each have two tram stops, and `preprocess.ts` rejects an
  // alternate name that would match both. The colloquial name goes to the stop at the
  // station's main entrance: Dom/Hbf (5, 16, 18) rather than Breslauer Platz on the far
  // side, and Bf Deutz/Messe (1, 9) on the forecourt rather than the 3/4 stop further
  // south by the arena.
  'Dom/Hbf': ['Köln Hbf', 'Hauptbahnhof', 'Dom', 'Köln Hauptbahnhof'],
  'Breslauer Platz/Hbf': ['Breslauer Platz'],
  'Bf Deutz/LANXESS arena': ['Lanxess Arena'],
  'Bf Deutz/Messe': ['Deutz', 'Deutz Messe', 'Bahnhof Deutz', 'Deutz Bf'],
  Koelnmesse: ['Kölnmesse'],
  RheinEnergieSTADION: [
    'Rheinenergiestadion',
    'Müngersdorfer Stadion',
    'Stadion',
  ],
  'Rath/Heumar': ['Rath', 'Heumar'],
  'Zoo/Flora': ['Zoo', 'Flora'],
  'Uniklinik Köln': ['Uniklinik'],
  Universität: ['Universität Köln', 'Uni Köln'],
  'Alfter / Alanus Hochschule': ['Alfter', 'Alanus Hochschule'],
  'Eifelwall/Stadtarchiv': ['Eifelwall', 'Stadtarchiv'],
  'Christophstr./Mediapark': ['Christophstr.', 'Mediapark'],
  'Dasselstr./Bf Süd': ['Dasselstr.', 'Köln Süd', 'Bf Süd'],
  'Hans-Böckler-Platz/Bf West': ['Hans-Böckler-Platz', 'Köln West', 'Bf West'],
  'Geldernstr./Parkgürtel': ['Geldernstr.', 'Parkgürtel'],
  'Sparkasse Am Butzweilerhof': ['Butzweilerhof'],
  'IKEA Am Butzweilerhof': ['Ikea'],
  'Alter Flughafen Butzweilerhof': ['Alter Flughafen'],
  'Bundesrechnungshof/Auswärtiges Amt': [
    'Bundesrechnungshof',
    'Auswärtiges Amt',
  ],
  'Heussallee/Museumsmeile': ['Heussallee', 'Museumsmeile'],
  'Hochkreuz / Deutsches Museum Bonn': ['Hochkreuz', 'Deutsches Museum Bonn'],
  'Universität / Markt': ['Bonn Universität', 'Bonn Markt'],
  'Bad Godesberg Bahnhof': ['Bad Godesberg'],
}

// ----------------------------------------
// S-Bahn / tram interchanges
// ----------------------------------------
// An S-Bahn stop listed here is the *same station* as an existing tram stop, so it takes
// the tram station's name and the two share one entry on the map.
//
// This is a hand-checked table rather than a distance rule, because distance alone does not
// separate the cases: Trimbornstraße is 208 m from Kalk Post and is a different station,
// while Messe/Deutz is 292 m from its tram stop and is the same one. The signals used:
// OSM `public_transport=stop_area` relations (which tag only the first three), and the KVB
// stop export, which gives every station KVB considers separate its own Haltestelle name
// ("Bf Ehrenfeld", "Buchforst S-Bahn", "Longerich S-Bahn", "Steinstr. S-Bahn", "Bf Porz")
// but reuses the tram stop's name where it is one station.
//
// Deliberately NOT merged: Köln-Ehrenfeld, Köln Trimbornstraße, Köln-Buchforst,
// Köln Steinstraße, Porz (Rhein), Lövenich, Köln-Longerich, Köln-Holweide.
export const stationAliases: { [osmStationName: string]: string } = {
  'Köln Hansaring': 'Hansaring', // shared stop_area, 91 m
  'Köln-Chorweiler': 'Chorweiler', // shared stop_area, 19 m
  'Köln Geldernstraße/Parkgürtel': 'Geldernstr./Parkgürtel', // shared stop_area, 49 m
  'Köln-Weiden West': 'Weiden West', // same KVB Haltestelle name, 58 m
  'Köln-Mülheim': 'Bf Mülheim', // same KVB Haltestelle name, 135 m
  // The S-Bahn platforms sit almost exactly between the two tram stops at each of these
  // interchanges, so the choice follows `alternateNames` above: the stop at the main
  // entrance wins, keeping "Köln Hbf" and "Bahnhof Deutz" pointing where they already did.
  'Köln Hauptbahnhof': 'Dom/Hbf', // 187 m (Breslauer Platz is 178 m)
  'Köln Messe/Deutz': 'Bf Deutz/Messe', // 292 m
}
