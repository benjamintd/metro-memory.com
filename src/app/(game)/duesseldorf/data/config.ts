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
export const linesMetadata: {
  [id: string]: {
    name: string
    osm: {
      relationIds: number[]
      extraStationNodeIds: number[]
      extraRouteWayIds: number[]
    }
    color: string
  }
} = {
  DuesseldorfU70: {
    name: 'U70',
    osm: {
      relationIds: [2425656, 2425657],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#68aecb',
  },
  DuesseldorfU71: {
    name: 'U71',
    osm: {
      relationIds: [5747257, 5748288],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#48c6f3',
  },
  DuesseldorfU72: {
    name: 'U72',
    osm: {
      relationIds: [5756145, 5756146],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#21bec6',
  },
  DuesseldorfU73: {
    name: 'U73',
    osm: {
      relationIds: [5756095, 5756096],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#436bb3',
  },
  DuesseldorfU75: {
    name: 'U75',
    osm: {
      relationIds: [2424189, 2424190],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#0691c0',
  },
  DuesseldorfU76: {
    name: 'U76',
    osm: {
      relationIds: [2425323, 2425324],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#006bb5',
  },
  DuesseldorfU77: {
    name: 'U77',
    osm: {
      relationIds: [2325258, 2325259],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#6992cc',
  },
  DuesseldorfU78: {
    name: 'U78',
    osm: {
      relationIds: [2430794, 2430792],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#0d99d6',
  },
  DuesseldorfU79: {
    name: 'U79',
    osm: {
      relationIds: [1804558, 1804557, 3227753, 3227754],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#0f9d94',
  },
  DuesseldorfU80: {
    name: 'U80',
    osm: {
      relationIds: [21303921, 21303920],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#006062',
  },
  DuesseldorfU81: {
    name: 'U81',
    osm: {
      relationIds: [21303918, 21303919],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#69908b',
  },
  DuesseldorfU83: {
    name: 'U83',
    osm: {
      relationIds: [5748736, 5748737],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#164998',
  },

  Duesseldorf701: {
    name: '701',
    osm: {
      relationIds: [5751408, 5751410],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#f58221',
  },
  Duesseldorf704: {
    name: '704',
    osm: {
      relationIds: [5756753, 5756755],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#bf2127',
  },
  Duesseldorf705: {
    name: '705',
    osm: {
      relationIds: [5757149, 5757150],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#bb1e8a',
  },
  Duesseldorf706: {
    name: '706',
    osm: {
      relationIds: [5758001, 5758002],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#ec1f26',
  },
  Duesseldorf707: {
    name: '707',
    osm: {
      relationIds: [5760906, 5760907],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#7b277d',
  },
  Duesseldorf708: {
    name: '708',
    osm: {
      relationIds: [5760920, 5760919],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#f599b1',
  },
  Duesseldorf709: {
    name: '709',
    osm: {
      relationIds: [1715648, 1715647, 9303155, 9303154],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#ea4d9a',
  },
}

// ----------------------------------------
// extra nodes/ways (not included in relations)
// ----------------------------------------

// ----------------------------------------
// alternate names
// ----------------------------------------
export const alternateNames: { [stationName: string]: string[] | undefined } = {
  'Meerbusch-Görgesheide': ['Görgesheide'],
  'Meerbusch-Büderich, Landsknecht': ['Büderich Landsknecht', 'Landsknecht'],
  'Düsseldorf-Lörick': ['Lörick'],
  'Benrather Straße U': ['Benrather Straße', 'Benrather Str'],
  'Graf-Adolf-Platz U': ['Graf-Adolf-Platz'],
  'Stadthalle/Museum': ['Neuss Stadthalle'],
  'D-Flughafen Terminal S U': ['Flughafen Terminal'],
  'Duisburg Hauptbahnhof U': ['Duisburg Hbf', 'Duisburg Hauptbahnhof'],
  'Duisburg-Meiderich Bf': ['Meiderich Bahnhof', 'Meiderich Bf'],
  'Handelszentrum/Moskauer Straße': ['Handelszentrum'],
  'Medienhafen, Kesselstraße': ['Kesselstraße', 'Kesselstr'],
  'Oberbilker Markt/Warschauer Straße': ['Oberbilker Markt'],
  'Oberbilker Markt U': ['Oberbilker Markt'],
  'Düsseldorf-Hubertushain': ['Hubertushain'],
  'Ratingen, Felderhof': ['Felderhof'],
  'Düsseldorf Lindemannstraße': ['Lindemannstraße', 'Lindemannstr'],
  'Düsseldorf Hansaplatz': ['Hansaplatz', 'Hansapl'],
  'Düsseldorf Grunerstraße': ['Grunerstraße', 'Grunerstr'],
  'Düsseldorf Engerstraße': ['Engerstraße', 'Engerstr'],
}
