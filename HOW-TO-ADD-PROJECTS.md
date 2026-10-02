# Adding projects

1. Open `source\images\portfolio`.
2. Put each new image in exactly one category folder:
   - `design`
   - `photography`
   - `art`
3. Start the preview with `npm run dev`. New images appear automatically after the browser refreshes.

The image file name becomes the project title. For example, `spring-poster.png` displays as `spring poster`.

For one project with multiple images in a single tile, create a folder inside its category, name it after the project, and put all its images inside:

```text
source\images\portfolio\design\spring-poster\
  front.png
  back.png
```

The site automatically lists all supported image types: PNG, JPG, JPEG, GIF, and WebP. Run `npm run build` before publishing the website so new images and the portfolio list are included.

## Publishing with Netlify

Netlify is configured to run `npm run build` and publish the generated `theme` folder. After adding images, commit and push the changes; Netlify will build the site and include the new portfolio entries automatically.
