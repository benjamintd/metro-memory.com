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

// list of operator codes of tram stops (none for rnv, they come from OSM)
export const localStopCodesUrl: string | undefined = undefined

// OSM tags of tram stops holding operator codes:
// rnv RBL, MVV control system, OEG, Rhein-Haardtbahn and DB (DS100) codes
export const localStopCodeTags: string[] = [
  'ref:RNV:RBL',
  'railway:ref:MVV_VBL',
  'railway:ref:OEG',
  'railway:ref:RHB',
  'railway:ref:DBAG',
]

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
  RheinNeckarS1: line('S1', [2445551], '#EC192E'),
  RheinNeckarS2: line('S2', [2445552], '#2960B5'),
  RheinNeckarS3: line('S3', [2445554], '#FCD804'),
  RheinNeckarS33: line('S33', [14948, 1513483], '#803C9F'),
  RheinNeckarS4: line('S4', [32242, 556683], '#1A9D47'),
  RheinNeckarS44: line('S44', [2611244], '#1A9D47'),
  RheinNeckarS5: line('S5', [2587144], '#EC192E'),
  RheinNeckarS6: line('S6', [1483885, 12010749, 12010753], '#27C9F5'),
  RheinNeckarS7: line('S7', [1241173], '#F47A14'),
  RheinNeckarS8: line('S8', [2412316], '#F8A20D'),
  RheinNeckarS9: line('S9', [19971777, 12010750, 12010751], '#73C82C'),
  RheinNeckarS10: line('S10', [16381671], '#A46FA9'),
  RheinNeckarS12: line('S12', [16384836], '#F4A9CA'),
  // tram colours from the official rnv "Liniennetzplan Schiene" (Stand September 2026),
  // line 5 from Wikidata (its badge is drawn differently in the plan)
  RheinNeckarTram1: line('1', [2619044], '#F39B9A'),
  RheinNeckarTram2: line('2', [2619045], '#B00044'),
  RheinNeckarTram3: line('3', [2621587], '#D5AD00'),
  RheinNeckarTram4: line('4', [2619046], '#E3000B'),
  RheinNeckarTram4A: line('4A', [14712448], '#E3000B'),
  RheinNeckarTram5: line('5', [2619047], '#00AC6F'),
  RheinNeckarTram6: line('6', [2621588], '#956B25'),
  RheinNeckarTram6A: line('6A', [13417394], '#956B25'),
  RheinNeckarTram7: line('7', [2621590], '#FFCC00'),
  RheinNeckarTram9X: line('9X', [3757041], '#93C23B'),
  RheinNeckarTram10: line('10', [3303135], '#A60F80'),
  RheinNeckarTram12: line('12', [20822304], '#DB603C'),
  RheinNeckarTram15: line('15', [16179482], '#F7AB63'),
  RheinNeckarTram16: line('16', [16626601], '#5E6BAF'),
  RheinNeckarTram21: line('21', [2617691], '#E3000B'),
  RheinNeckarTram22: line('22', [2617692], '#FDC300'),
  RheinNeckarTram23: line('23', [2617693], '#E48E00'),
  RheinNeckarTram24: line('24', [2617694], '#8C1D75'),
  RheinNeckarTram26: line('26', [2617695], '#F39B9A'),
}

// ----------------------------------------
// station names: OSM name -> name used in game
// ----------------------------------------
export const renamedStations: { [osmName: string]: string } = {
  // S-Bahn stations merged with the tram stops of the same name/place
  'Mannheim, Hauptbahnhof': 'Mannheim Hauptbahnhof',
  'MA Hauptbahnhof Süd': 'Mannheim Hauptbahnhof Süd',
  'SAP Arena S-Bahnhof': 'Mannheim ARENA/Maimarkt',
  'Mannheim-Käfertal RNV': 'Mannheim-Käfertal',
  'Waldhof Bahnhof': 'Mannheim-Waldhof',
  Luzenberg: 'Mannheim-Luzenberg',
  'Neckarau Bahnhof': 'Mannheim-Neckarau',
  'Rheinau Bahnhof': 'Mannheim-Rheinau',
  'Ludwigshafen (Rhein) Hauptbahnhof': 'Ludwigshafen Hauptbahnhof',
  'LU Hauptbahnhof': 'Ludwigshafen Hauptbahnhof',
  'Ludwigshafen (Rhein) Mitte': 'Ludwigshafen Mitte',
  'Berliner Platz Süd Bf LU Mitte': 'Ludwigshafen Mitte',
  'Ludwigshafen(Rhein) BASF Nord': 'Ludwigshafen BASF Nord',
  'Ludwigshafen(Rhein) BASF Mitte': 'Ludwigshafen BASF Mitte',
  'Ludwigshafen(Rhein) BASF Süd': 'Ludwigshafen BASF Süd',
  'S-Bf. Weststadt/Südstadt': 'Heidelberg-Weststadt/Südstadt',
  'Weinheim (Bergstr) Hbf': 'Weinheim Hauptbahnhof',
  'Weinheim Hbf': 'Weinheim Hauptbahnhof',
  // spelling
  'Neustadt (Weinstr)Hbf': 'Neustadt (Weinstraße) Hauptbahnhof',
  'Neustadt(Weinstr)Hbf': 'Neustadt (Weinstraße) Hauptbahnhof',
  'Wiesbaden Hbf': 'Wiesbaden Hauptbahnhof',
  'Frankenthal Hbf': 'Frankenthal Hauptbahnhof',
  'Heppenheim (Bergstr)': 'Heppenheim (Bergstraße)',
  'Helmstadt  (Baden)': 'Helmstadt (Baden)',
  'Mauer (b Heidelberg)': 'Mauer (bei Heidelberg)',
  'Auerbach (b Mosbach)': 'Auerbach (bei Mosbach)',
  'Zimmern(b Seckach)': 'Zimmern (bei Seckach)',
  Eichholzheim: 'Eicholzheim',
  'Bad Dürkheim, Bahnhof': 'Bad Dürkheim Bahnhof',
  'Sandhofen, Endstelle': 'Sandhofen',
  'Schönau Endstelle': 'Schönau',
  'Vogelstang Endstelle': 'Vogelstang',
  'Pfalzbau / Wilhelm-Hack-Museum': 'Pfalzbau/Wilhelm-Hack-Museum',
}

// district names as commonly used (OSM splits some districts into parts)
export const renamedDistricts: { [osmName: string]: string } = {}

// stop positions without name in OSM
export const stationNamesByNodeId: { [nodeId: number]: string } = {
  1587114239: 'Waibstadt',
  8788616129: 'Waibstadt',
}

// same OSM name in different towns: rename only within area [minLon, minLat, maxLon, maxLat]
export const renamedStationsInArea: {
  area: [number, number, number, number]
  names: { [osmName: string]: string }
}[] = [
  {
    // Eppelheim
    area: [8.6, 49.39, 8.65, 49.415],
    names: { Rathaus: 'Eppelheim Rathaus' },
  },
  {
    // Heidelberg
    area: [8.6, 49.35, 8.8, 49.46],
    names: { Rheinstraße: 'Heidelberg Rheinstraße' },
  },
  {
    // Weinheim
    area: [8.62, 49.53, 8.72, 49.58],
    names: { 'Freiburger Straße': 'Weinheim Freiburger Straße' },
  },
]

// ----------------------------------------
// alternate names
// ----------------------------------------
export const alternateNames: { [stationName: string]: string[] | undefined } = {
  'Mannheim Hauptbahnhof': ['Mannheim Hbf', 'MA Hbf'],
  'Ludwigshafen Hauptbahnhof': ['LU Hbf', 'Ludwigshafen Hbf'],
  'Mannheim ARENA/Maimarkt': ['SAP Arena S-Bahnhof', 'Mannheim Arena'],
  'Ludwigshafen Mitte': ['LU Mitte', 'Berliner Platz Süd'],
  'Mannheim-Waldhof': ['Waldhof'],
  'Mannheim-Luzenberg': ['Luzenberg'],
  'Mannheim-Neckarau': ['Neckarau'],
  'Mannheim-Rheinau': ['Rheinau'],
  'Mannheim-Käfertal': ['Käfertal'],
  'Heidelberg-Weststadt/Südstadt': ['Weststadt/Südstadt'],
  'Pfalzbau/Wilhelm-Hack-Museum': ['Pfalzbau', 'Wilhelm-Hack-Museum'],
  'Rathaus/REM': ['REM'],
  // stops renamed by town above: the plain name reveals all stops of that name
  'Eppelheim Rathaus': ['Rathaus'],
  'Heidelberg Rheinstraße': ['Rheinstraße'],
  'Weinheim Freiburger Straße': ['Freiburger Straße'],
  // stops outside the town they are usually associated with
  'Kirchheimer Straße': ['Eppelheim Kirchheimer Straße'],
  'Kranichweg/Stotz': ['Pfaffengrund Kranichweg/Stotz'],
  Friedhof: ['Leimen Friedhof'],
  // former stop names
  'Johann-Fischer-Straße': ['Biethsstraße'],
  'Gneisenaustraße Süd': ['Gneisenaustraße'],
  'Tivoli/Rhein-Neckar-Zentrum': ['Rhein-Neckar-Zentrum', 'Tivoli'],
  'Luisenpark/Technoseum': ['Luisenpark'],
  'Zum Guten Hirten/BG Unfallklinik': ['Zum Guten Hirten', 'BG Unfallklinik'],
  'Ebertpark/Fichtestraße': ['Fichtestraße'],
  'Neu-Edingen/Friedrichsfeld': ['Neu-Edingen', 'Friedrichsfeld'],
  'Heddesheim/Hirschberg': ['Hirschberg'],
  'St. Ilgen/Sandhausen': ['St. Ilgen', 'Sankt Ilgen'],
  'Heidelberg-Pfaffengrund/Wieblingen': ['Pfaffengrund/Wieblingen'],
  'Heidelberg-Kirchheim/Rohrbach': ['Kirchheim/Rohrbach'],
  'Heidelberg-Schlierbach/Ziegelhausen': ['Schlierbach/Ziegelhausen'],
}
