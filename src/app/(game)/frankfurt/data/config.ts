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
  railwayStations: {
    nodeId: number
    name?: string
    ds100: string[]
    lat: number
    lon: number
  }[]
  // administrative areas (level 6 = city/district, 8 = town, 9/10 = city district) per stop
  stationAreas: { [nodeId: number]: { level: number; name: string }[] }
  localStopCodes: { code: string; name: string; lat?: number; lon?: number }[]
}

// operator codes of U-Bahn/tram stops (VGF), compiled by Bjørn Bäuchle,
// licensed under the European Public License 1.2
export const localStopCodesUrl: string | undefined =
  'https://ds100.frankfurtium.de/dumps/orte_ffm/'

// OSM tags of tram stops holding operator codes
export const localStopCodeTags: string[] = []

export type LinesMetadata = {
  [id: string]: {
    name: string
    osm: {
      relationIds: number[]
      extraStationNodeIds: number[]
      extraRouteWayIds: number[]
      // use the relations only up to this station (e.g. when OSM has a diversion)
      truncateAtStation?: string
    }
    color: string
  }
}

const line = (
  name: string,
  relationIds: number[],
  color: string,
): LinesMetadata[string] => ({
  name,
  osm: { relationIds, extraStationNodeIds: [], extraRouteWayIds: [] },
  color,
})

// ----------------------------------------
// line configuration (OSM route_master or route relations)
// order of entries = order in game
// ----------------------------------------
export const linesMetadata: LinesMetadata = {
  FrankfurtS1: line('S1', [3413905], '#0095DA'),
  FrankfurtS2: line('S2', [3414422], '#EE1C23'),
  FrankfurtS3: line('S3', [2445553], '#00A896'),
  FrankfurtS4: line('S4', [2515408], '#FECB09'),
  FrankfurtS5: line('S5', [2515355], '#8B5A2B'),
  FrankfurtS6: line('S6', [1880910], '#F57921'),
  FrankfurtS7: line('S7', [456933], '#20543F'),
  FrankfurtS8: line('S8', [3415070], '#A8B400'),
  FrankfurtS9: line('S9', [3415113], '#91268F'),
  FrankfurtU1: line('U1', [4656730], '#B8282E'),
  FrankfurtU2: line('U2', [1150977], '#00A54F'),
  FrankfurtU3: line('U3', [4656731], '#4A5EAA'),
  FrankfurtU4: line('U4', [4656732], '#F172AC'),
  FrankfurtU5: line('U5', [4656733], '#007942'),
  FrankfurtU6: line('U6', [3524791], '#007EC6'),
  FrankfurtU7: line('U7', [4656734], '#E4A024'),
  FrankfurtU8: line('U8', [4656735], '#C77DB5'),
  FrankfurtU9: line('U9', [4656736], '#C9B800'),
  // tram colours from the official traffiQ "Liniennetz Frankfurt am Main 2026"
  // (school line 19 is not in the plan, its colour is chosen to fit)
  FrankfurtTram11: line('11', [1875166], '#FDC300'),
  FrankfurtTram12: line('12', [1875167], '#C54409'),
  FrankfurtTram14: line('14', [1875169], '#E94E0F'),
  FrankfurtTram15: line('15', [1875170], '#FDC300'),
  FrankfurtTram16: line('16', [1871120], '#EF7D00'),
  FrankfurtTram17: line('17', [1875171], '#E94E0F'),
  FrankfurtTram18: {
    // OSM has the diversion during the construction works on Mörfelder Landstraße;
    // regular route: Südbahnhof - Südbahnhof/Schweizer Straße - Schweizer Straße/Mörfelder
    // Landstraße - Oppenheimer Landstraße - Breslauer Straße - ... - Louisa Bahnhof
    ...line('18', [1875175], '#F7A600'),
    osm: {
      relationIds: [1875175],
      truncateAtStation: 'Südbahnhof',
      extraStationNodeIds: [
        763206441, 582939282, 763206460, 115927728, 115927733, 763206488,
        763206467,
      ],
      extraRouteWayIds: [
        60792306, 60933252, 4566832, 60792303, 23115547, 12691650, 1494338282,
        1484529052, 1494338287, 1494338288, 1484529050, 1484529049, 1494338285,
        894827395,
      ],
    },
  },
  // school line Südbahnhof - Rheinlandstraße
  FrankfurtTram19: line('19', [948994], '#D45A1E'),
  FrankfurtTram20: line('20', [1875174], '#F7A600'),
  FrankfurtTram21: line('21', [1871117], '#F7A600'),
}

// ----------------------------------------
// station names: OSM name -> name used in game
// ----------------------------------------
export const renamedStations: { [osmName: string]: string } = {
  // Frankfurt city: S-Bahn stations without "Frankfurt" prefix, merged with U-Bahn/tram stops
  'Hauptbahnhof (tief)': 'Hauptbahnhof',
  'Frankfurt (Main) Hauptbahnhof': 'Hauptbahnhof',
  'Frankfurt Hauptwache': 'Hauptwache',
  'Frankfurt am Main Messe': 'Messe',
  'Frankfurt Messe': 'Messe',
  'Frankfurt am Main West': 'Westbahnhof',
  'Frankfurt (Main) Süd': 'Südbahnhof',
  'Frankfurt am Main Sindlingen': 'Sindlingen',
  'Frankfurt-Höchst Farbwerke': 'Höchst Farbwerke',
  'Frankfurt-Höchst': 'Höchst',
  'Frankfurt-Rödelheim': 'Rödelheim',
  'Frankfurt-Zeilsheim': 'Zeilsheim',
  'Frankfurt am Main Ginnheim': 'Ginnheim',
  'Frankfurt-Eschersheim': 'Eschersheim',
  'Frankfurt Frankfurter Berg': 'Frankfurter Berg',
  'Frankfurt-Berkersheim': 'Berkersheim',
  'Frankfurt-Louisa': 'Louisa',
  'Louisa Bahnhof': 'Louisa',
  'Stresemannallee Bahnhof': 'Stresemannallee',
  'Frankfurt-Niederrad': 'Niederrad',
  'Niederrad Bahnhof': 'Niederrad',
  'Frankfurt am Main Stadion': 'Stadion',
  'Frankfurt am Main Flughafen Regionalbahnhof': 'Flughafen Regionalbahnhof',
  'Frankfurt-Gateway Gardens': 'Gateway Gardens',
  'Hugo-Junkers-Straße/Schleife': 'Hugo-Junkers-Straße',
  // Offenbach
  'Offenbach (Main) Kaiserlei': 'Offenbach Kaiserlei',
  Ledermuseum: 'Offenbach Ledermuseum',
  Marktplatz: 'Offenbach Marktplatz',
  'Offenbach (Main) Ost': 'Offenbach Ost',
  // surrounding towns
  'Wiesbaden Hbf': 'Wiesbaden Hauptbahnhof',
  'Hanau Hbf': 'Hanau Hauptbahnhof',
  'Hochheim(Main)': 'Hochheim (Main)',
  'Flörsheim(Main)': 'Flörsheim (Main)',
  'Oberursel(Taunus)': 'Oberursel (Taunus)',
  'Bad Homburg v. d. Höhe': 'Bad Homburg',
  'Rödermark-Ober Roden': 'Rödermark-Ober-Roden',
  'Langen (Hess)': 'Langen (Hessen)',
  'Steinheim/Main (Hanau)': 'Steinheim (Main)',
  'Mühlheim (Main)-Dietesheim': 'Mühlheim-Dietesheim',
  'Nieder Wöllstadt': 'Nieder-Wöllstadt',
  'Groß-Gerau Dornberg': 'Groß-Gerau-Dornberg',
  Opelwerk: 'Rüsselsheim Opelwerk',
}

// district names as commonly used (OSM splits some districts into parts)
export const renamedDistricts: { [osmName: string]: string } = {
  'Sachsenhausen Nord': 'Sachsenhausen',
  'Sachsenhausen Süd': 'Sachsenhausen',
  'Westend Nord': 'Westend',
  'Westend Süd': 'Westend',
  'Nordend Ost': 'Nordend',
  'Nordend West': 'Nordend',
}

// stop positions without name in OSM
export const stationNamesByNodeId: { [nodeId: number]: string } = {}

// same OSM name in different towns: rename only within area [minLon, minLat, maxLon, maxLat]
export const renamedStationsInArea: {
  area: [number, number, number, number]
  names: { [osmName: string]: string }
}[] = []

// ----------------------------------------
// alternate names
// ----------------------------------------
export const alternateNames: { [stationName: string]: string[] | undefined } = {
  Hauptbahnhof: ['Frankfurt Hauptbahnhof', 'Frankfurt Hbf'],
  Messe: ['Frankfurt Messe'],
  Westbahnhof: ['Frankfurt West', 'West'],
  Südbahnhof: ['Frankfurt Süd', 'Süd'],
  'Flughafen Regionalbahnhof': ['Flughafen', 'Frankfurt Flughafen'],
  'Höchst Farbwerke': ['Farbwerke'],
  'Offenbach Kaiserlei': ['Kaiserlei'],
  'Offenbach Ledermuseum': ['Ledermuseum'],
  'Offenbach Marktplatz': ['Marktplatz'],
  'Bad Homburg': ['Bad Homburg vor der Höhe'],
  'Rüsselsheim Opelwerk': ['Opelwerk'],
  'Miquel-/Adickesallee': ['Miquelallee', 'Adickesallee'],
  'Festhalle/Messe': ['Festhalle'],
  'Dom/Römer': ['Dom', 'Römer'],
  'Eissporthalle/Festplatz': ['Eissporthalle'],
  'Ginnheim/Niddapark': ['Niddapark'],
  'Riedwiese/Mertonviertel': ['Riedwiese', 'Mertonviertel'],
  'Marbachweg/Sozialzentrum': ['Marbachweg'],
  'Römer/Paulskirche': ['Paulskirche'],
  'Heinrich-Hoffmann-Straße/Blutspendedienst': ['Heinrich-Hoffmann-Straße'],
  'Weißkirchen/Steinbach': ['Weißkirchen', 'Steinbach'],
  'Schwalbach Limes': ['Schwalbach'],
  Friedensbrücke: ['Stresemannallee/Gartenstraße'], // former name
  Ostbahnhof: ['Frankfurt Ost', 'Frankfurt Ostbahnhof', 'Frankfurt (Main) Ost'],
  Heerstraße: ['Praunheim Heerstraße', 'Praunheim'],
}
