# Streusel Studio project history

Last updated: October 1, 2026

## Current site

- Brand: Streusel Studio
- Primary color: earthy green (`#365a3d`)
- Type: DotGothic16, with Gulim/Dotum fallbacks
- Visual style: lowercase text, asterisk dividers, compact spacing, readable dark charcoal body text
- Navigation: Home and Contact only
- Homepage:
  - Streusel Studio logo in the header
  - Asterisk divider under the site title
  - Project filters: All Projects, Design, Photography, Art
  - Masonry-style image gallery with no image cropping
  - About Streusel Studio section
- Footer:
  - Copyright © 2026 Streusel Studio
  - Email: streuselstudio@gmail.com
  - Social links: Instagram, GitHub, LinkedIn

## Adding portfolio projects

Put images in one of these folders:

```text
source\images\portfolio\design
source\images\portfolio\photography
source\images\portfolio\art
```

- A single image becomes one gallery project automatically.
- The filename becomes the project title. Example: `spring-poster.png` displays as `spring poster`.
- To combine several images into one gallery tile, create a project folder inside the category and put its images there:

```text
source\images\portfolio\design\spring-poster\
  front.png
  back.png
```

When the local preview is running, adding or removing images automatically refreshes the gallery.

## Local preview

From this folder, run:

```powershell
npm run dev
```

Then open http://localhost:3000.

## Netlify deployment

`netlify.toml` is configured for Netlify:

- Build command: `npm run build`
- Published folder: `theme`
- Node version: 20

To publish changes, add or remove images, then commit and push the project. Netlify will build the site and generate the updated portfolio automatically.

## Key files

| Purpose | File |
|---|---|
| Homepage gallery layout | `source\partials\blocks\portfolio-home.htm` |
| Automatic image manifest generator | `gulpfile.js` |
| Gallery rendering and filters | `source\js\script.js` |
| Portfolio styling | `source\scss\templates\_portfolio.scss` |
| Contact page | `source\contact.html` |
| Shared footer | `source\partials\blocks\footer.htm` |
| Netlify settings | `netlify.toml` |
