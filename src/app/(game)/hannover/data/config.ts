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
    Hannover1: {
        name: '1',
        osm: {
            relationIds: [11001, 2995651, 4099218, 4099217],
            extraStationNodeIds: [1171983199],
            extraRouteWayIds: [618800114, 378559018, 101503243, 712342565],
        },
        color: '#e4003a',
    },
    Hannover2: {
        name: '2',
        osm: {
            relationIds: [11002, 2998554, 10626405, 10626404, 10626427],
            extraStationNodeIds: [3112937168, 599513554],
            extraRouteWayIds: [],
        },
        color: '#e4003a',
    },
    Hannover3: {
        name: '3',
        osm: {
            relationIds: [11006, 3016070],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#0069b4',
    },
    Hannover4: {
        name: '4',
        osm: {
            relationIds: [2951395, 2951396],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#f9b000',
    },
    Hannover5: {
        name: '5',
        osm: {
            relationIds: [2991700, 2583341],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#f9b000',
    },
    Hannover6: {
        name: '6',
        osm: {
            relationIds: [2991602, 10999],
            extraStationNodeIds: [13326625422, 83224938],
            extraRouteWayIds: [368308114, 625068961, 156569926],
        },
        color: '#f9b000',
    },
    Hannover7: {
        name: '7',
        osm: {
            relationIds: [11005, 3038574],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#0069b4',
    },
    Hannover8: {
        name: '8',
        osm: {
            relationIds: [11000, 2998721, 8556968, 8556967],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#e4003a',
    },
    Hannover9: {
        name: '9',
        osm: {
            relationIds: [11009, 3038599],
            extraStationNodeIds: [13231540295, 13231540294],
            extraRouteWayIds: [],
        },
        color: '#0069b4',
    },
    Hannover10: {
        name: '10',
        osm: {
            relationIds: [3004805, 11012],
            extraStationNodeIds: [13348231096, 13348231095, 2488426316],
            extraRouteWayIds: [111749855, 711051589],
        },
        color: '#76b82a',
    },
    Hannover11: {
        name: '11',
        osm: {
            relationIds: [11010, 2991648, 8781479],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#f9b000',
    },
    Hannover12: {
        name: '12',
        osm: {
            relationIds: [3004824, 3004830],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#76b82a',
    },
    Hannover13: {
        name: '13',
        osm: {
            relationIds: [16856342, 16856367],
            extraStationNodeIds: [146792298],
            extraRouteWayIds: [616579844, 156739163],
        },
        color: '#0069b4',
    },
    Hannover17: {
        name: '17',
        osm: {
            relationIds: [11004, 2998732],
            extraStationNodeIds: [],
            extraRouteWayIds: [],
        },
        color: '#76b82a',
    },
}

// ----------------------------------------
// extra nodes/ways (not included in relations)
// ----------------------------------------

// ----------------------------------------
// alternate names
// ----------------------------------------
export const alternateNames: { [stationName: string]: string[] | undefined } = {
    'Schneiderberg / Wilhelm-Busch-Museum': ['Schneiderberg/W.-Busch-Museum', 'Schneiderberg'],
    'Bünteweg/Tierärztliche Hochschule': ['Bünteweg'],
    'Messe/Ost (EXPO-Plaza)': ['Messe/Ost'],
    'Markthalle/Landtag (U)': ['Markthalle/Landtag', 'Markthalle'],
    'Sedanstraße/Lister Meile': ['Sedanstraße', 'Sedanstr'],
    'Buchholz/Betriebshof': ['Buchholz/Bhf'],
    'Betriebshof Fuhsestraße': ['Fuhsestr/Bhf', 'Fuhsestr/Betriebshof', 'Fuhsestraße/Bhf', 'Fuhsestraße/Betriebshof'],
    'Glocksee/Betriebshof': ['Glocksee/Bhf'],
    'Döhren/Bhf': ['Döhren/Betriebshof'],
}
