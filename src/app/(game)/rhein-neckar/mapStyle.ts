import { Style } from 'mapbox-gl'

// Plain base map without any labels (street, place or stop names would give away the answers).
// Uses the public Mapbox Streets tiles, so it works with any access token.
const mapStyle: Style = {
  version: 8,
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sources: {
    streets: { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f4f3f0' },
    },
    {
      id: 'landuse',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landuse',
      filter: [
        'match',
        ['get', 'class'],
        ['park', 'wood', 'grass'],
        true,
        false,
      ],
      paint: { 'fill-color': '#e3eadb' },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'streets',
      'source-layer': 'water',
      paint: { 'fill-color': '#cddde8' },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'streets',
      'source-layer': 'building',
      minzoom: 14,
      paint: { 'fill-color': '#e8e6e1' },
    },
    {
      id: 'road',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: [
        'match',
        ['get', 'class'],
        ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'street'],
        true,
        false,
      ],
      paint: {
        'line-color': '#ffffff',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['match', ['get', 'class'], ['motorway', 'trunk'], 1.5, 0.3],
          16,
          ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], 10, 5],
        ],
      },
    },
  ],
}

export default mapStyle
