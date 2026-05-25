# Metro Memory

Did you ever wish your favourite metro map was now blank and you had to type all the stations from memory? Wish no more! This is what Metro Memory is for!

## Stack 

Metro Memory is a web application built using Next.js, TypeScript, and TailwindCSS.

## Project Structure

- **src/**: Contains all the source files.
  - **app/**: Next.js application logic.
  - **components/**: Reusable React components.
  - **hooks/**: Custom React hooks.
  - **images/**: Map image assets.
  - **lib/**: Utility functions and helper libraries.
  - **scripts/**: Build and deployment scripts.
  - **styles/**: Tailwind and custom CSS styles.
  - **types/**: TypeScript type declarations.


Inside `src/app/(game)` you will find the city-specific logic and data. 


## Installation

1. **Clone the repository:**
   ```sh
   git clone <repository_url>
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```

## Development

```sh
npm run dev
```

## Adding a new city

You can duplicate an existing city to see how the the data is structured. 
Hamburg is a good city to duplicate - for historical reasons, not all cities are structured the same, so this one is a good starting point. 


### Data 

A city needs the following: 
- `data/features.json` -> a GeoJSON FeatureCollection of Points, e.g. 
```
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [10.024136, 53.546112]
  },
  "properties": {
    "id": 161,
    "name": "Hammerbrook (City Süd)",
    "alternate_names": ["Hammerbrook"],
    "line": "HamburgSBahnS3",
    "order": 627
  },
  "id": 161
},
```
They reference the line ids. Alternate names are optional but helpful for fuzzy type matching. 

- `data/lines.json` -> a map of lineId to line data. 
- `data/routes.json` -> a GeoJSON FeatureCollection of LineStrings, referencing the lineIds. 

The files are typically generate from a source file, with a `preprocess.ts` script. 
This script is sometimes also responsible for giving ids to stations. 

*Warning: station ids must be stable so that existing players don't lose their locally-saved state. If you want to udpate some city's data, please ensure the existing ones are kept.*

### Configuration

Edit `config.ts` - The constant names should be self-explanatory. 

### Adding to the game

Add your city to `lib/citiesConfig.ts` and the relevant images.

## Route offset processing

Multiple lines might have overlapping route data. The offset processing tool lets you visually separate them by assigning pixel offsets to each route segment, then bake the result into `routes.json` for the game to use.

This is a **dev-only tool** — it has no effect in production.

### Enabling it

In a city's `config.ts`, set `OFFSET_PROCESSING_MODE = true` and include it in the config object. In a city's `page.tsx` call `loadCityRoutes()`. See Hamburg as an example.

When enabled, the dev server will:
1. Copy `routes.json` to `routes-unprocessed.json` on first run (the stable original, never overwritten)
2. Load from `routes-unprocessed.json` on every subsequent start
3. Load previously saved settings from `routes-settings.json` if it exists

### Using the UI

Run the dev server and open the city page. A panel appears in the bottom-left corner of the map.

**Step size** — a global multiplier that scales all unit offsets to pixels. Increase it to spread lines further apart.

**Per-line sections** — each line is collapsible. Expand it to see its route segments. Segments detected as overlapping with another line are shown in bold.

For each segment:
- The **coloured circle** on the left is a visibility toggle. Click it to cycle between normal → highlighted (magenta) → hidden. Use this to identify which segment is which on the map.
- The **offset value** is shown in the centre. Grey values are interpolated from neighbouring explicit values; black/bold values are explicitly set.
- **− / +** adjust the offset, always snapping to multiples of 0.5. Clicking on an interpolated value makes it explicit.
- **×** clears an explicit override and returns the segment to interpolation.

### Saving

Click **Save processed routes** to:
- Write the baked route geometry (with `overlapOffsetPx` stamped on each feature) to `routes.json` for use in normal gameplay
- Write the current settings (explicit offsets + step size) to `routes-settings.json`

On your next dev server start, **Load saved settings** will appear if the saved state differs from the current UI state.

**Reset all changes** clears all explicit offsets and resets the step size, returning everything to the interpolated baseline.

### Segment naming

Segments are named automatically:
- **Overlap segments** (shared corridor): `{ownAbbrev}_{otherAbbrev}_{counter}` — e.g. `Di_N_0` for a District/Northern overlap
- **Solo segments** (unique to a line): `{lineAbbrev}{counter}` — e.g. `N3`

Abbreviations come from the `abbreviation` field on each line in `config.ts` - (you may want to add these for longer line names), falling back to the line `name`, then to auto-generated initials from the key.

## Production Build

To build the project for production:

```sh
npm run build
```

Then, to start the production server:

```sh
npm run start
```

## License

This project is licensed as per the terms described in [LICENSE.md](LICENSE.md).

## Contributing

Please make all contributions through a Pull Request. You might need a Mapbox token to get started developing. Some of the styles used are marked as public, so you should be able to use those for development. 

