"""Generate circular SVG line logos for the Hong Kong MTR game.

Usage
-----
    python3 "src/app/(game)/hongkong/scripts/generate_logos.py"

This embeds each Wikipedia line logo PNG (from `./hk-mtr-source-logos/`)
inside a circular SVG that fills the line color from `../config.ts`. Output is
written to `public/images/` at the repo root.

The 9 line PNGs were downloaded from Wikimedia Commons (CC0 1.0, uploaded by
WHGZ1122 on 2025-03-16):
  - TsuenWan.png      https://commons.wikimedia.org/wiki/File:%E8%8D%83%E7%81%A3%E7%B6%AB_Hong_Kong_MTR_Tsuen_Wan_Line.png
  - KwunTong.png      https://commons.wikimedia.org/wiki/File:%E8%A7%80%E5%A1%98%E7%B6%AB_Hong_Kong_MTR_Kwun_Tong_Line.png
  - Island.png        https://commons.wikimedia.org/wiki/File:%E6%B8%AF%E5%B3%B6%E7%B6%AB_Hong_Kong_MTR_Island_Line.png
  - TungChung.png     https://commons.wikimedia.org/wiki/File:%E6%9D%B1%E6%B6%8C%E7%B6%AB_Hong_Kong_MTR_Tung_Chung_Line.png
  - TseungKwanO.png   https://commons.wikimedia.org/wiki/File:%E5%B0%87%E8%BB%8D%E6%BE%B3%E7%B6%AB_Hong_Kong_MTR_Tseung_Kwan_O_Line.png
  - EastRail.png      https://commons.wikimedia.org/wiki/File:%E6%9D%B1%E9%90%B5%E7%B6%AB_Hong_Kong_MTR_East_Rail_Line.png
  - TuenMa.png        https://commons.wikimedia.org/wiki/File:%E5%B1%AF%E9%A6%AC%E7%B6%AB_Hong_Kong_MTR_Tuen_Ma_Line.png
  - SouthIsland.png   https://commons.wikimedia.org/wiki/File:%E5%8D%97%E6%B8%AF%E5%B3%B6%E7%B6%AB_Hong_Kong_MTR_South_Island_Line.png
  - Disneyland.png    https://commons.wikimedia.org/wiki/File:%E8%BF%AA%E5%A3%AB%E5%B0%BC%E7%B6%AB_Hong_Kong_MTR_Disneyland_Resort_Line.png

The color codes here must stay in sync with the `color` field for each line in
`../config.ts`. They are set to match each PNG's background so the circle and
the embedded PNG blend seamlessly.

The Airport Express logo (`public/images/MTRAirportExpress.svg`) is maintained
by hand because it has a unique illustrated design rather than the standard
Wikipedia text panel.
"""

import base64
import os

LINES = [
    ("MTRTsuenWanLine", "TsuenWan.png", "#FF0000"),
    ("MTRKwunTongLine", "KwunTong.png", "#1A9431"),
    ("MTRIslandLine", "Island.png", "#0860A8"),
    ("MTRTungChungLine", "TungChung.png", "#FE7F1D"),
    ("MTRTseungKwanOLine", "TseungKwanO.png", "#6B208B"),
    ("MTREastRailLine", "EastRail.png", "#53B7E8"),
    ("MTRTuenMaLine", "TuenMa.png", "#9A3B26"),
    ("MTRSouthIslandLine", "SouthIsland.png", "#B5BD00"),
    ("MTRDisneylandResortLine", "Disneyland.png", "#F550A6"),
]

PNG_ASPECT = 2363 / 1063  # source PNG dimensions

# Chinese characters are centered at roughly (0.500, 0.428) of the source PNG.
# We size the embedded image so it just fits the circle width and the rounded
# corners of the PNG (which fall outside the circle) get clipped.
IMG_W = 200
IMG_H = IMG_W / PNG_ASPECT
IMG_X = 100 - 0.500 * IMG_W
IMG_Y = 100 - 0.428 * IMG_H

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", "..", "..", ".."))
SRC_DIR = os.path.join(SCRIPT_DIR, "hk-mtr-source-logos")
OUT_DIR = os.path.join(REPO_ROOT, "public", "images")


def main() -> None:
    for key, fname, color in LINES:
        png_path = os.path.join(SRC_DIR, fname)
        with open(png_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()

        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <clipPath id="c"><circle cx="100" cy="100" r="100"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="200" height="200" fill="{color}"/>
    <image x="{IMG_X:.2f}" y="{IMG_Y:.2f}" width="{IMG_W:.2f}" height="{IMG_H:.2f}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,{b64}"/>
  </g>
</svg>
'''
        out_path = os.path.join(OUT_DIR, f"{key}.svg")
        with open(out_path, "w") as f:
            f.write(svg)
        print(f"Wrote {out_path} ({len(svg) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
