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
  DresdenTram1: {
    name: '1',
    osm: {
      relationIds: [5185991],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#E4002C',
  },
  DresdenTram2: {
    name: '2',
    osm: {
      relationIds: [5186008],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#EB5B2D',
  },
  DresdenTram3: {
    name: '3',
    osm: {
      relationIds: [1469415],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#E5005A',
  },
  DresdenTram4: {
    name: '4',
    osm: {
      relationIds: [5186035],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#C9061A',
  },
  DresdenTram6: {
    name: '6',
    osm: {
      relationIds: [5186067],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#FFDD00',
  },
  DresdenTram7: {
    name: '7',
    osm: {
      relationIds: [2675693],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#9E0234',
  },
    DresdenTram8: {
    name: '8',
    osm: {
      relationIds: [5186073],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#229133',
  },
  DresdenTram9: {
    name: '9',
    osm: {
      relationIds: [5186435],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#93C355',
  },
  DresdenTram10: {
    name: '10',
    osm: {
      relationIds: [5186677],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#F9B000',
  },
  DresdenTram11: {
    name: '11',
    osm: {
      relationIds: [5186681],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#C2DDAF',
  },
  DresdenTram12: {
    name: '12',
    osm: {
      relationIds: [2690192],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#006B42',
  },

  DresdenTram13: {
    name: '13',
    osm: {
      relationIds: [5186751],
      extraStationNodeIds: [],
      extraRouteWayIds: [],
    },
    color: '#FDC300',
  },
}

// ----------------------------------------
// extra nodes/ways (not included in relations)
// ----------------------------------------


// ----------------------------------------
// alternate names
// ----------------------------------------
export const alternateNames: { [stationName: string]: string[] | undefined } = {
  'Bahnhof Mitte': [
    'Bahnhof Mitte / Jahnstraße',
    'Bahnhof Mitte / Könneritzstraße',
  ],
  'Neustädter Markt (Goldener Reiter)': [
    'Neustädter Markt',
    'Neustädter Markt (Goldener Reiter)',
  ],
      'Albertplatz (Erich-Kästner-Museum)': [
    'Albertplatz',
  ],
      'Am Hellerrand (Deutsche Werkstätten)': [
    'Am Hellerrand',
  ],
      'Angelikastraße (Gedenkstätte Bautzner Straße)': [
    'Angelikastraße',
    '',
  ],
      'Antonstraße / Leipziger Straße': [
    'Anton-/Leipziger Straße',
  ],
      'Augsburger Straße (Universitätsklinikum)': [
    'Augsburger Straße',
    '',
  ],
      'Bautzner Straße / Rothenburger Straße': [
    'Bautzner-/Rothenburger Straße',
    '',
  ],
      'Blasewitz, Schillerplatz': [
    'Blasewitz',
    'Schillerplatz',
  ],
      'Blasewitzer Straße / Fetscherstraße': [
    'Blasewitzer/Fetscherstraße',
   
  ],
      'Bühlau, Ullersdorfer Platz': [
    'Bühlau',
    'Ullersdorfer Platz',
  ],
      'Carolaplatz (Regierungsviertel)': [
    'Carolaplatz',
  ],
      'Coswig, Auerstraße': [
    'Auerstraße',
  ],
      'Coswig, Radebeuler Straße': [
    'Radebeuler Straße',
  ],
      'Coswig, Rathaus': [
    'Rathaus',
  ],
      'Coswig, Salzstraße': [
    'Salzstraße',
  ],
      'Coswig, Steinbacher Weg': [
    'Steinbacher Weg',
  ],
      'Coswig, Zentrum / Börse': [
    'Zentrum/Börse',
  ],
      'Cotta, Gottfried-Keller-Straße': [
    'Cotta',
    'Gottfried-Keller-Straße',
  ],
      'Dürerstraße (Evangelische Hochschule)': [
    'Dürerstraße',
    'Evangelische Hochschule',
  ],
  
      'Georg-Arnhold-Bad (Deutsches Hygiene-Museum)': [
    'Georg-Arnhold-Bad',
  
  ],
      'Gompitz, Gompitzer Höhe': [
    'Gompitz',
    'Gompitzer Höhe',
  ],
      'Gorbitz, Betriebshof': [
    'Gorbitz',
 
  ],
      'Görlitzer Straße (Nordbad)': [
    'Görlitzer Straße',
    'Nordbad',
  ],
  
      'Heeresbäckerei (Stadtarchiv)': [
    'Heeresbäckerei',
],
    'Hellerau, Kiefernweg': [
    'Hellerau',
    'Kiefernweg',
  ],
      'Infineon Süd (Abzweig nach Hellerau)': [
    'Infineon Süd',
    'Abzweig nach Hellerau',
  ],
  'Jacob-Winter-Platz (Prohlis-Zentrum)': [
    'Jacob-Winter-Platz',
  ],
      'Kaditz, Riegelplatz': [
    'Riegelplatz',
    'Kaditz',
  ], 
  'Kleinzschachwitz, Freystraße': [
    'Freystraße',
    'Kleinzschachwitz',
  ],
      'Kongresszentrum (Haus der Presse)': [
    'Kongresszentrum',
    'Haus der Presse',
  ],
      'Krankenhaus Friedrichstadt (Sportpark Ostra)': [
    'Krankenhaus Friedrichstadt',
    'Sportpark Ostra',
  ],
      'Laubegast, Kronstädter Platz': [
    'Laubegast',
    'Kronstädter Platz',
  ],
      'Löbtau, Tharandter Straße': [
    'Löbtau',
    'Tharandter Straße',
  ],
      'Merianplatz (Elbamare)': [
    'Merianplatz',
    
  ],
      'Münchner Platz (Gedenkstätte)': [
    'Münchner Platz',
  ],
      'Palaisplatz (Japanisches Palais)': [
    'Palaisplatz',
  
  ],
      'Pennrich, Gleisschleife': [
    'Pennrich',
    
  ],
      'Pirnaischer Platz (Stadtmuseum)': [
    'Pirnaischer Platz',
 
  ],
      'Plauen, Nöthnitzer Straße': [
    'Plauen',
    'Nöthnitzer Straße',
  ],
      'Pohlandplatz (Technische Sammlungen)': [
    'Pohlandplatz',
   
  ],
      'Prohlis, Gleisschleife': [
    'Prohlis',
   
  ],
      'Radebeul, Borstraße': [
    'Borstraße',
    
  ],
        'Radebeul, Dr.-Külz-Straße': [
    'Dr.-Külz-Straße',
    
  ],
          'Radebeul, Eisenbahnbrücke': [
    'Eisenbahnbrücke',
    
  ],
          'Radebeul, Forststraße': [
    'Forststraße',
    
  ],
          'Radebeul, Gerhart-Hauptmann-Straße': [
    'Gerhart-Hauptmann-Straße',
    
  ],
          'Radebeul, Gradsteg': [
    'Gradsteg',
    
  ],
          'Radebeul, Hauptstraße': [
    'Hauptstraße',

  ],
          'Radebeul, Johannisbergstraße': [
    'Johannisbergstraße',
    
  ],
          'Radebeul, Landesbühnen Sachsen': [
    'Landesbühnen Sachsen',
    
  ],
          'Radebeul, Moritzburger Straße': [
    'Moritzburger Straße',
    
  ],
          'Radebeul, Schildenstraße': [
    'Schildenstraße',
    
  ],
          'Radebeul, Schloss Wackerbarth': [
    'Schloss Wackerbarth',
    
  ],
          'Radebeul, Wasastraße': [
    'Wasastraße',
    
  ],
          'Radebeul, Zillerstraße (Elblandklinikum)': [
    'Zillerstraße',
    
  ],
          'Radebeul, Zinzendorfstraße': [
    'Zinzendorfstraße',
    
  ],
  
      'Reichenbachstraße (Studentenwerk)': [
    'Reichenbachstraße',
    
  ],
      'S-Bahnhof Freiberger Straße (World Trade Center)': [
    'S-Bahnhof Freiberger Straße',
    '',
  ],
      'Schweriner Straße (Hochschule für Musik)': [
    'Schweriner Straße',
   
  ],
      'Stauffenbergallee (Militärhistorisches Museum)': [
    'Stauffenbergallee',
    
  ],
      'Straßburger Platz (Gläserne Manufaktur)': [
    'Fučikplatz',
    'Straßburger Platz',
  ],
    'Tannenstraße (Goethe-Institut)': [
    'Tannenstraße',
    '',
  ],
      'Weinböhla (Rathausstraße)': [
    'Weinböhla',
    'Rathausstraße',
  ],
      'Weinböhla, Gellertstraße': [
    'Gellertstraße',
    
  ],
      'Weinböhla, Köhlerstraße': [
    'Köhlerstraße',
    
  ],
      'Weixdorf, Rathenaustraße': [
    'Weixdorf',
    'Rathenaustraße',
  ],
      'Zschertnitz, Münzmeisterstraße': [
    'Zschertnitz',
    'Münzmeisterstraße',
  ],
  
  
  
  
  
  
  
  
  
  
  
  
  
}
