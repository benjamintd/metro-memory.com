# Copenhagen

## Data

The station and route data is pulled from OpenStreetMap, based on the route master IDs:

```typescript
const masterRelations = {
  M1: "https://www.openstreetmap.org/relation/3931373",
  M2: "https://www.openstreetmap.org/relation/152340",
  M3: "https://www.openstreetmap.org/relation/10283923",
  M4: "https://www.openstreetmap.org/relation/10925800",
  A: "https://www.openstreetmap.org/relation/9971068",
  B: "https://www.openstreetmap.org/relation/51750",
  Bx: "https://www.openstreetmap.org/relation/367751",
  C: "https://www.openstreetmap.org/relation/191280",
  E: "https://www.openstreetmap.org/relation/394091",
  F: "https://www.openstreetmap.org/relation/381625",
  H: "https://www.openstreetmap.org/relation/191281",
  L: "https://www.openstreetmap.org/relation/19757376",
};
```

Some alternate names are added for a few stations.

Note that the processing script assumes that stations have unique names.

Map data (C) OpenStreetMap-Contributors

## Images

- Homepage image by [Rachel Evans](https://rachelevans.org/blog/a-tour-of-copenhagens-m3-cityringen/).
- Route icons (`public/images/kbh*`):
  - M1, M2, M3, M4 icons by [Metroselskabet](https://m.dk/)
  - A, B, Bx, C, E, F, H icons by Rachel Evans
  - L icon by Rachel Evans, based on [the original by Hovedstadens Letbane](https://commons.wikimedia.org/wiki/File:Hovedstadens_Letbane.svg)
