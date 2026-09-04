# Rin brand assets

Everything here is drawn from the same geometry as the in-app mark
(`src/logo.ts`): the radial habit tracker, eight days into the month, with a
slate tick on the day up next. Colours are the app's own palette from
`src/theme.ts`. SVGs are the source of truth; the PNGs are exports of them.

| File | What it is |
| --- | --- |
| `mark-dark.svg` / `mark-light.svg` | The mark alone, transparent background. Use on dark or light grounds respectively. |
| `logo-dark.svg` / `logo-light.svg` | Horizontal lockup: mark, MONTHLY PLANNING eyebrow, RIN. The README banner. |
| `logo-stacked-dark.svg` / `logo-stacked-light.svg` | Stacked lockup, mark above the wordmark, centred. |
| `banner-dark.svg` / `banner-light.svg` | 1280 × 640 full-bleed banner on the app's ground with the aurora wash. GitHub social preview, store headers. |

PNGs: marks at 1024 px, lockups at 2×, banners at 1280 × 640.

App icons live one level up in `assets/`: `icon.png` (dark, full bleed),
`icon-ios-light.png` / `icon-ios-dark.png` / `icon-ios-tinted.png` for iOS
appearances, the three `android-icon-*.png` adaptive layers, `favicon.png`,
and `splash-icon.png`.
