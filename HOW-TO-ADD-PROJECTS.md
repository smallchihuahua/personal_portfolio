# Adding projects

## Design projects

Each folder directly inside `source\images\portfolio\design` is one Design project. The folder name becomes its title and URL, and numbered image filenames set the cover and page order. No project data file is required.

See `MAINTENANCE.md` for the day-to-day workflow.

## Photography

Put original photographs in `source\images\portfolio\photography`. Their filenames remain the single title source: `papel-picado-guadalajara.jpg` displays as `papel picado guadalajara` in both the hover overlay and lightbox. Do not create a second photography-title list.

Run `npm run build` before publishing. Original source images are retained; the build creates WebP copies capped at 1600px for delivery.

## Publishing with Netlify

Netlify runs `npm run build` and publishes the generated `theme` folder. Commit and push your image changes; Netlify generates the gallery manifest and project pages during the build.
