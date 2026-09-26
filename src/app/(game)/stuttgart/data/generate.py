import csv
from pathlib import Path
from collections import Counter, defaultdict

GTFS_STADTBAHN = Path.home() / "Downloads" / "latest"
GTFS_SBAHN = Path.home() / "Downloads" / "latest-2"

STADTBAHN_LINES = {
    "U1", "U2", "U3", "U4", "U5", "U6", "U7", "U8", "U9",
    "U12", "U13", "U14", "U15", "U16", "U19",
    "10", "20",
}

SBAHN_LINES = {
    "S1", "S2", "S3", "S4", "S5", "S6", "S60",
}

def read_csv(base, filename):
    with (base / filename).open(
        encoding="utf-8-sig", newline=""
    ) as f:
        return list(csv.DictReader(f))


def analyse(base, agency_id, wanted):
    routes = read_csv(base, "routes.txt")
    trips = read_csv(base, "trips.txt")
    stops = read_csv(base, "stops.txt")

    stop_names = {
        s["stop_id"]: s["stop_name"]
        for s in stops
    }

    route_lines = {
        r["route_id"]: r["route_short_name"]
        for r in routes
        if r.get("agency_id") == agency_id
        and r.get("route_short_name") in wanted
    }

    trip_lines = {
        t["trip_id"]: route_lines[t["route_id"]]
        for t in trips
        if t.get("route_id") in route_lines
    }

    stop_sequences = defaultdict(list)

    with (base / "stop_times.txt").open(
        encoding="utf-8-sig", newline=""
    ) as f:
        for st in csv.DictReader(f):
            trip_id = st.get("trip_id")

            if trip_id not in trip_lines:
                continue

            stop_sequences[trip_id].append(
                (
                    int(st["stop_sequence"]),
                    stop_names.get(st["stop_id"], "?"),
                )
            )

    variants = defaultdict(Counter)

    for trip_id, sequence in stop_sequences.items():
        names = tuple(
            name for _, name in sorted(sequence)
        )
        variants[trip_lines[trip_id]][names] += 1

    return variants


stadtbahn = analyse(
    GTFS_STADTBAHN,
    "100",
    STADTBAHN_LINES,
)

sbahn = analyse(
    GTFS_SBAHN,
    "92",
    SBAHN_LINES,
)


def print_summary(title, variants, lines):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)

    def sort_key(line):
        prefix = "".join(c for c in line if not c.isdigit())
        number = int("".join(c for c in line if c.isdigit()))
        return prefix, number

    for line in sorted(lines, key=sort_key):
        choices = variants.get(line, Counter())

        if not choices:
            print(f"{line:>3}: NICHT GEFUNDEN")
            continue

        sequence, count = choices.most_common(1)[0]

        print(
            f"{line:>3}: "
            f"{len(sequence):>2} Halte | "
            f"{count:>3} Fahrten | "
            f"{sequence[0]} -> {sequence[-1]}"
        )


print_summary(
    "STADTBAHN / ZAHNRADBAHN / STANDSEILBAHN",
    stadtbahn,
    STADTBAHN_LINES,
)

print_summary(
    "S-BAHN",
    sbahn,
    SBAHN_LINES,
)

print()
print("S62: wird manuell rekonstruiert (7 Halte)")

# ---------------------------------------------------------------------
# KANONISCHE SOLL-LINIEN
# ---------------------------------------------------------------------

def find_variant(variants, line, start, end, length=None):
    """Findet eine GTFS-Variante anhand Endpunkten und optional Haltezahl."""
    candidates = []

    for seq, count in variants[line].items():
        if not seq:
            continue

        endpoints_match = (
            (seq[0] == start and seq[-1] == end)
            or
            (seq[0] == end and seq[-1] == start)
        )

        if endpoints_match and (length is None or len(seq) == length):
            candidates.append((seq, count))

    if not candidates:
        raise RuntimeError(
            f"Keine passende Variante für {line}: "
            f"{start} <-> {end}, Länge={length}"
        )

    seq, count = max(candidates, key=lambda x: x[1])

    # Einheitliche Orientierung start -> end
    if seq[0] != start:
        seq = tuple(reversed(seq))

    return list(seq)


CANONICAL = {}

# Linien, deren regulärer Vollverlauf direkt im GTFS vorhanden ist
direct = [
    ("U1",  "Heslach Vogelrain",       "Fellbach Lutherkirche",       27),
    ("U2",  "Botnang",                 "Neugereut",                   28),
    ("U3",  "Vaihingen",               "Plieningen",                  11),
    ("U7",  "Mönchfeld",               "Nellingen Ostfildern",        36),
    ("U9",  "Vogelsang",               "Hedelfingen",                 22),
    ("U12", "Dürrlewang",              "Neckargröningen Remseck",     36),
    ("U14", "Vaihingen",               "Mühlhausen",                  33),
    ("U15", "Stammheim",               "Ruhbank (Fernsehturm)",       27),
    ("U16", "Giebel",                  "Fellbach Lutherkirche",       30),
    ("U19", "Neugereut",               "NeckarPark (Stadion)",        10),
    ("20",  "Südheimer Platz",         "Waldfriedhof",                 2),
]

for line, start, end, length in direct:
    CANONICAL[line] = find_variant(
        stadtbahn, line, start, end, length
    )


# Zahnradbahn 10:
# Richtungsabhängige GTFS-Muster werden bewusst zu einer Soll-Linie vereinigt.
CANONICAL["10"] = [
    "Marienplatz",
    "Liststraße",
    "Pfaffenweg",
    "Wielandshöhe",
    "Haigst",
    "Nägelestraße",
    "Zahnradbahnhof",
    "Degerloch",
]


# U13:
# Reguläre Linie während der aktuellen Baustelle im GTFS geteilt.
CANONICAL["U13"] = [
    "Feuerbach Pfostenwäldle",
    "Sportpark Feuerbach",
    "Föhrich",
    "Wilhelm-Geiger-Platz",
    "Feuerbach",
    "Maybachstraße",
    "Pragsattel",
    "Löwentor",
    "Rosensteinpark",
    "Glockenstraße",
    "Rosensteinbrücke",
    "Wilhelma",
    "Mercedesstraße",
    "Bad Cannstatt Wilhelmsplatz",
    "Uff-Kirchhof",
    "Ebitzweg",
    "Kienbachstraße",
    "Blick",
    "Eszet",
    "Schlotterbeckstraße",
    "Untertürkheim",
    "Wasenstraße",
    "Wangen Marktplatz",
    "Stadtwerke Stuttgart",
    "Hedelfingen",
]


print()
print("=" * 72)
print("KANONISCHE SOLL-LINIEN – ERSTER CHECK")
print("=" * 72)

for line in [
    "U1","U2","U3","U7","U9",
    "U12","U13","U14","U15","U16","U19","10","20"
]:
    seq = CANONICAL[line]
    print(
        f"{line:>3}: {len(seq):>2} Halte | "
        f"{seq[0]} -> {seq[-1]}"
    )

# ---------------------------------------------------------------------
# WEITERE KANONISCHE STADTBAHN-LINIEN
# ---------------------------------------------------------------------

# U4: regulärer Verlauf; aktuelle Baustellenumleitung nach Vogelsang ignorieren
CANONICAL["U4"] = find_variant(
    stadtbahn,
    "U4",
    "Hölderlinplatz",
    "Untertürkheim",
    22,
)

# U5: regulärer Vollverlauf
CANONICAL["U5"] = find_variant(
    stadtbahn,
    "U5",
    "Leinfelden",
    "Killesberg",
    22,
)

# U6: regulärer Vollverlauf Gerlingen – Flughafen/Messe
CANONICAL["U6"] = find_variant(
    stadtbahn,
    "U6",
    "Gerlingen",
    "Flughafen/Messe",
    43,
)

# U8:
# Vollständige reguläre Linie; kürzere Verstärker-/Teilfahrten ignorieren
CANONICAL["U8"] = find_variant(
    stadtbahn,
    "U8",
    "Vaihingen",
    "Nellingen Ostfildern",
    26,
)

print()
print("=" * 72)
print("KANONISCHE STADTBAHN – VOLLSTÄNDIGER CHECK")
print("=" * 72)

for line in [
    "U1","U2","U3","U4","U5","U6","U7","U8","U9",
    "U12","U13","U14","U15","U16","U19","10","20"
]:
    seq = CANONICAL[line]
    print(
        f"{line:>3}: {len(seq):>2} Halte | "
        f"{seq[0]} -> {seq[-1]}"
    )

# ---------------------------------------------------------------------
# KANONISCHE S-BAHN
# ---------------------------------------------------------------------

STAMM_SUED = [
    "Stuttgart-Vaihingen",
    "Stuttgart Österfeld",
    "Stuttgart Universität",
    "Stuttgart Schwabstraße",
    "Stuttgart Feuersee",
    "Stuttgart Stadtmitte",
    "Stuttgart Hbf",
]

STAMM_NORD = [
    "Stuttgart Hbf",
    "Stuttgart Nordbahnhof",
    "Stuttgart-Feuerbach",
    "Stuttgart-Zuffenhausen",
]


def join_parts(*parts):
    """Verbindet Streckenabschnitte ohne doppelte Übergangsstationen."""
    result = []
    for part in parts:
        for station in part:
            if not result or station != result[-1]:
                result.append(station)
    return result


# S1: Herrenberg – Kirchheim (Teck)
s1_south = find_variant(
    sbahn, "S1", "Herrenberg", "Stuttgart-Vaihingen", 9
)

s1_east = find_variant(
    sbahn, "S1", "Stuttgart Hbf", "Kirchheim(Teck)", 15
)

CANONICAL["S1"] = join_parts(
    s1_south,
    STAMM_SUED,
    s1_east,
)


# S2: Filderstadt – Schorndorf
s2_south = find_variant(
    sbahn, "S2", "Filderstadt", "Stuttgart-Vaihingen", 7
)

s2_east = find_variant(
    sbahn, "S2", "Stuttgart Hbf", "Schorndorf", 15
)

CANONICAL["S2"] = join_parts(
    s2_south,
    STAMM_SUED,
    s2_east,
)


# S3: Flughafen/Messe – Backnang
# Der Südast fehlt im aktuellen Baustellen-GTFS und wird nach unserer
# geprüften Soll-Liste rekonstruiert.
s3_south = [
    "Stuttgart Flughafen/Messe",
    "Echterdingen",
    "Leinfelden",
    "Oberaichen",
    "Stuttgart-Rohr",
    "Stuttgart-Vaihingen",
]

s3_north = find_variant(
    sbahn, "S3", "Stuttgart Hbf", "Backnang", 12
)

CANONICAL["S3"] = join_parts(
    s3_south,
    STAMM_SUED,
    s3_north,
)


# S4: Schwabstraße – Backnang
s4_north = find_variant(
    sbahn, "S4", "Stuttgart Hbf", "Backnang", 14
)

CANONICAL["S4"] = join_parts(
    STAMM_SUED[3:],
    s4_north,
)


# S5: Schwabstraße – Bietigheim-Bissingen
s5_north = find_variant(
    sbahn, "S5", "Stuttgart Hbf", "Bietigheim-Bissingen", 9
)

CANONICAL["S5"] = join_parts(
    STAMM_SUED[3:],
    s5_north,
)


# S6: Schwabstraße – Weil der Stadt
s6_north = find_variant(
    sbahn, "S6", "Stuttgart Hbf", "Weil der Stadt", 14
)

CANONICAL["S6"] = join_parts(
    STAMM_SUED[3:],
    s6_north,
)


# S60:
# Nach unserem VVS-Abgleich Böblingen – Renningen und anschließend
# parallel zur S6 bis Schwabstraße.
s60_branch = find_variant(
    sbahn, "S60", "Böblingen", "Renningen", 7
)

s6_renningen_to_hbf = find_variant(
    sbahn, "S6", "Renningen", "Stuttgart Hbf", 12
)

CANONICAL["S60"] = join_parts(
    s60_branch,
    s6_renningen_to_hbf,
    list(reversed(STAMM_SUED[3:])),
)


# S62: im aktuellen Baustellen-GTFS nicht enthalten.
# Verbindliche Soll-Liste nach unserem VVS-Abgleich.
CANONICAL["S62"] = [
    "Weil der Stadt",
    "Leonberg",
    "Ditzingen",
    "Weilimdorf",
    "Korntal",
    "Stuttgart-Zuffenhausen",
    "Stuttgart-Feuerbach",
]


print()
print("=" * 72)
print("KANONISCHE S-BAHN – VOLLSTÄNDIGER CHECK")
print("=" * 72)

for line in ["S1","S2","S3","S4","S5","S6","S60","S62"]:
    seq = CANONICAL[line]
    print(
        f"{line:>3}: {len(seq):>2} Halte | "
        f"{seq[0]} -> {seq[-1]}"
    )

# ---------------------------------------------------------------------
# STATIONSKOORDINATEN AUS BEIDEN GTFS-FEEDS
# ---------------------------------------------------------------------

def load_stops(base):
    rows = read_csv(base, "stops.txt")

    by_name = defaultdict(list)

    for r in rows:
        name = r.get("stop_name", "").strip()
        if not name:
            continue

        try:
            lat = float(r.get("stop_lat") or 0)
            lon = float(r.get("stop_lon") or 0)
        except ValueError:
            continue

        if not lat or not lon:
            continue

        by_name[name].append({
            "stop_id": r.get("stop_id", ""),
            "name": name,
            "lat": lat,
            "lon": lon,
            "parent_station": r.get("parent_station", ""),
            "location_type": r.get("location_type", ""),
        })

    return by_name


stadtbahn_stops = load_stops(GTFS_STADTBAHN)
sbahn_stops = load_stops(GTFS_SBAHN)


def all_stop_candidates(name):
    return (
        stadtbahn_stops.get(name, [])
        + sbahn_stops.get(name, [])
    )


missing_stations = []

for line, stations in CANONICAL.items():
    for station in stations:
        if not all_stop_candidates(station):
            missing_stations.append((line, station))


print()
print("=" * 72)
print("STATIONSKOORDINATEN – FEHLENDE NAMEN")
print("=" * 72)

if not missing_stations:
    print("Alle Stationsnamen wurden in mindestens einem GTFS-Feed gefunden.")
else:
    seen = set()
    for line, station in missing_stations:
        key = (line, station)
        if key not in seen:
            seen.add(key)
            print(f"{line:>3}: {station}")

# ---------------------------------------------------------------------
# MANUELLE KOORDINATEN FÜR DIE 2026 GESPERRTE S-BAHN-STAMMSTRECKE
# ---------------------------------------------------------------------

MANUAL_STOPS = {
    "Stuttgart Österfeld": {
        "lat": 48.737500,
        "lon": 9.116667,
    },
    "Stuttgart Universität": {
        "lat": 48.745330,
        "lon": 9.105790,
    },
    "Stuttgart Schwabstraße": {
        "lat": 48.770234,
        "lon": 9.156533,
    },
    "Stuttgart Feuersee": {
        "lat": 48.772600,
        "lon": 9.165800,
    },
    "Stuttgart Stadtmitte": {
        "lat": 48.775859,
        "lon": 9.172350,
    },
}


def has_coordinates(name):
    return bool(
        all_stop_candidates(name)
        or name in MANUAL_STOPS
    )


missing_after_manual = []

for line, stations in CANONICAL.items():
    for station in stations:
        if not has_coordinates(station):
            missing_after_manual.append((line, station))


print()
print("=" * 72)
print("KOORDINATENCHECK NACH MANUELLEN ERGÄNZUNGEN")
print("=" * 72)

if not missing_after_manual:
    print("Alle Stationen haben jetzt eine Koordinatenquelle.")
else:
    seen = set()
    for line, station in missing_after_manual:
        if station not in seen:
            seen.add(station)
            print(f"{line:>3}: {station}")

# ---------------------------------------------------------------------
# STUTTGARTER KOORDINATEN AUSWÄHLEN
# ---------------------------------------------------------------------

def choose_stuttgart_stop(name):
    if name in MANUAL_STOPS:
        return {
            "name": name,
            **MANUAL_STOPS[name],
            "source": "manual",
        }

    candidates = all_stop_candidates(name)

    # Stuttgart und Region:
    # großzügig genug für Herrenberg, Backnang, Schorndorf,
    # Kirchheim, Flughafen, Weil der Stadt usw.
    regional = [
        c for c in candidates
        if 48.45 <= c["lat"] <= 49.05
        and 8.75 <= c["lon"] <= 9.75
    ]

    if not regional:
        return None

    # Bei mehreren gleichnamigen Treffern bevorzugen wir
    # location_type=1 (Station/Parent).
    regional.sort(
        key=lambda c: (
            c.get("location_type") != "1",
            bool(c.get("parent_station")),
        )
    )

    return regional[0]


resolved = {}
unresolved = []

for line, stations in CANONICAL.items():
    for station in stations:
        if station in resolved:
            continue

        result = choose_stuttgart_stop(station)

        if result is None:
            unresolved.append(station)
        else:
            resolved[station] = result


print()
print("=" * 72)
print("STUTTGART-KOORDINATEN – PLAUSIBILITÄTSCHECK")
print("=" * 72)

if unresolved:
    print("NICHT AUFGELÖST:")
    for station in sorted(set(unresolved)):
        print(" -", station)
else:
    print(f"Alle {len(resolved)} eindeutigen Stationsnamen aufgelöst.")

    lats = [s["lat"] for s in resolved.values()]
    lons = [s["lon"] for s in resolved.values()]

    print(
        f"Breitengrad: {min(lats):.6f} bis {max(lats):.6f}"
    )
    print(
        f"Längengrad:  {min(lons):.6f} bis {max(lons):.6f}"
    )

print()
print("Kontrollpunkte:")

for name in [
    "Herrenberg",
    "Stuttgart Hbf",
    "Stuttgart-Bad Cannstatt",
    "Stuttgart Schwabstraße",
    "Stuttgart Flughafen/Messe",
    "Backnang",
    "Schorndorf",
    "Kirchheim(Teck)",
    "Weil der Stadt",
    "Stuttgart-Zuffenhausen",
    "Stuttgart-Feuerbach",
]:
    result = resolved.get(name)

    if result:
        print(
            f"{name:28} "
            f"{result['lat']:.6f}, {result['lon']:.6f}"
        )
    else:
        print(f"{name:28} NICHT GEFUNDEN")

# ---------------------------------------------------------------------
# SOURCE.JSON ERZEUGEN
# ---------------------------------------------------------------------

def get_stop_data(name):
    stop = choose_stuttgart_stop(name)

    if stop is None:
        raise RuntimeError(
            f"Keine Koordinaten für Station gefunden: {name}"
        )

    return {
        "name": name,
        "lat": stop["lat"],
        "lon": stop["lon"],
    }


# Stabile numerische Stations-IDs:
# Ein physischer Stationsname bekommt über alle Linien hinweg dieselbe ID.
all_station_names = sorted({
    station
    for stations in CANONICAL.values()
    for station in stations
})

station_id = {
    name: i + 1
    for i, name in enumerate(all_station_names)
}

def alternate_names(name):
    aliases = set()

    # Stuttgart-Präfix:
    # "Stuttgart Schwabstraße" -> "Schwabstraße"
    # "Stuttgart-Bad Cannstatt" -> "Bad Cannstatt"
    if name.startswith("Stuttgart "):
        aliases.add(name[len("Stuttgart "):])

    if name.startswith("Stuttgart-"):
        short = name[len("Stuttgart-"):]
        aliases.add(short)
        aliases.add("Stuttgart " + short)

    # Fehlendes Leerzeichen vor Klammern ergänzen:
    # Kirchheim(Teck) -> Kirchheim (Teck)
    import re
    spaced = re.sub(r"(?<=\S)\(", " (", name)
    if spaced != name:
        aliases.add(spaced)

    # Klammerinhalt auch ohne Klammern akzeptieren:
    # Kirchheim(Teck) -> Kirchheim Teck
    no_brackets = re.sub(r"[()]", "", spaced)
    no_brackets = re.sub(r"\s+", " ", no_brackets).strip()
    if no_brackets != name:
        aliases.add(no_brackets)

    # Basisname vor Klammer:
    # Neuwirtshaus(Porscheplatz) -> Neuwirtshaus
    if "(" in name:
        base = name.split("(", 1)[0].strip()

        # Bei diesen Stationen wäre der Basisname mehrdeutig.
        ambiguous_base_names = {
            "Berliner Platz (Hohe Straße)",
            "Berliner Platz (Liederhalle)",
            "Kirchheim(Teck)-Ötlingen",

            # Nicht mit der Stadtbahn-Haltestelle "Freiberg" verwechseln:
            # Freiberg(Neckar) ist ein anderer Bahnhof.
            "Freiberg(Neckar)",
            "NeckarPark (Stadion)",
        }

        if base and name not in ambiguous_base_names:
            aliases.add(base)


    # Gezielte, gebräuchliche Stuttgart-Aliase
    manual = {
        "Stuttgart Hbf": [
            "Hbf",
            "Hauptbahnhof",
            "Stuttgart Hauptbahnhof",
        ],
        "Hauptbf (Arnulf-Klett-Platz)": [
            "Hauptbahnhof",
            "Hbf",
            "Hauptbf",
            "Arnulf-Klett-Platz",
            "Hauptbahnhof (Arnulf-Klett-Platz)",
        ],
        "Stuttgart-Bad Cannstatt": [
            "Bad Cannstatt",
            "Stuttgart Bad Cannstatt",
        ],
        "Stuttgart Flughafen/Messe": [
            "Flughafen/Messe",
            "Flughafen",
            "Messe",
            "Flughafen Messe",
            "Stuttgart Flughafen",
            "Stuttgart Messe",
        ],
        "Flughafen/Messe": [
            "Flughafen",
            "Messe",
            "Flughafen Messe",
        ],
        "Stuttgart Schwabstraße": [
            "Schwabstraße",
        ],
        "Stuttgart Stadtmitte": [
            "Stadtmitte",
        ],
        "Stuttgart Universität": [
            "Universität",
            "Uni",
        ],
        "Stuttgart Österfeld": [
            "Österfeld",
        ],
        "Stuttgart Feuersee": [
            "Feuersee",
        ],
        "Neuwirtshaus(Porscheplatz)": [
            "Neuwirtshaus",
            "Porscheplatz",
            "Neuwirtshaus (Porscheplatz)",
        ],
        "Ruhbank (Fernsehturm)": [
            "Ruhbank",
            "Fernsehturm",
        ],
        "NeckarPark (Stadion)": [
            "Stadion",
            "NeckarPark Stadion",
        ],
        "Kirchheim(Teck)": [
            "Kirchheim (Teck)",
            "Kirchheim Teck",
            "Kirchheim",
        ],
    }

    aliases.update(manual.get(name, []))

    # Gebräuchliche Einzelbezeichnungen bei kombinierten Straßennamen.
    # "Schwabstraße" wird bewusst NICHT verwendet, weil dieser Name
    # bereits zur S-Bahn-Station Stuttgart Schwabstraße gehört.
    slash_aliases = {
        "Arndt-/Spittastraße": [
            "Arndtstraße",
            "Spittastraße",
        ],
        "Rosenberg-/Seidenstraße": [
            "Rosenbergstraße",
            "Seidenstraße",
        ],
        "Schloss-/Johannesstraße": [
            "Schlossstraße",
            "Johannesstraße",
        ],
        "Schwab-/Bebelstraße": [
            "Bebelstraße",
        ],
        "Wangener-/Landhausstraße": [
            "Wangener Straße",
            "Landhausstraße",
        ],
    }

    aliases.update(slash_aliases.get(name, []))

    # Originalname nicht nochmals als Alias speichern
    aliases.discard(name)

    return sorted(aliases, key=str.casefold)


source_stops = {
    str(station_id[name]): {
        **get_stop_data(name),
        "alternate_names": alternate_names(name),
    }
    for name in all_station_names
}


# Reihenfolge der Linien im Spiel
LINE_ORDER = [
    "U1", "U2", "U3", "U4", "U5", "U6", "U7", "U8", "U9",
    "U12", "U13", "U14", "U15", "U16", "U19",
    "10", "20",
    "S1", "S2", "S3", "S4", "S5", "S6", "S60", "S62",
]


def live_line_code(line):
    if line.startswith("U"):
        return f"StuttgartStadtbahn{line}"

    if line.startswith("S"):
        return f"StuttgartSBahn{line}"

    if line == "10":
        return "StuttgartZahnradbahn10"

    if line == "20":
        return "StuttgartStandseilbahn20"

    raise ValueError(f"Unbekannte Linie: {line}")


LINE_COLORS = {
    "U1":  "#CD9C72",
    "U2":  "#F58220",
    "U3":  "#946341",
    "U4":  "#7967AE",
    "U5":  "#00BAF1",
    "U6":  "#ED008C",
    "U7":  "#0BB38D",
    "U8":  "#C0B678",
    "U9":  "#FFD403",
    "U12": "#85BBE5",
    "U13": "#F69EB2",
    "U14": "#6ABD51",
    "U15": "#000099",
    "U16": "#C3BF2F",
    "U19": "#FAB902",
    "10":  "#FBBA00",
    "20":  "#804000",
    "S1":  "#58AE40",
    "S2":  "#DC022C",
    "S3":  "#F47A14",
    "S4":  "#0165B2",
    "S5":  "#04AAE4",
    "S6":  "#844C02",
    "S60": "#8D900E",
    "S62": "#58AE40",
}

source_routes = []

for order, line in enumerate(LINE_ORDER):
    stations = CANONICAL[line]

    stop_points = [
        {
            "id": str(station_id[name]),
            "path_index": i,
        }
        for i, name in enumerate(stations)
    ]

    path_coords = [
        [
            get_stop_data(name)["lat"],
            get_stop_data(name)["lon"],
        ]
        for name in stations
    ]

    source_routes.append({
        "name": line,
        "live_line_code": live_line_code(line),
        "color": LINE_COLORS[line],
        "text_color": "#FFFFFF",
        "order": order,
        "patterns": [
            {
                "path": path_coords,
                "stop_points": stop_points,
            }
        ],
    })


source = {
    "routes": source_routes,
    "stops": source_stops,
}


import json

output = Path(
    "src/app/(game)/stuttgart/data/source.json"
)

output.write_text(
    json.dumps(
        source,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)


print()
print("=" * 72)
print("SOURCE.JSON ERZEUGT")
print("=" * 72)
print(f"Linien:             {len(source_routes)}")
print(f"Stationsnamen:      {len(source_stops)}")
print(f"Linien-Stationen:   {sum(len(CANONICAL[x]) for x in LINE_ORDER)}")
print(f"Datei:              {output}")
