# Streusel Studio project history

Last updated: October 11, 2026

## Current site

- Brand: Streusel Studio
- Primary color: earthy green (`#365a3d`)
- Type: DotGothic16, with Gulim/Dotum fallbacks
- Visual style: lowercase text, asterisk dividers, compact spacing, readable dark charcoal body text
- Header navigation: About and Contact anchors; Design and Photography portfolio links
- Homepage:
  - Streusel Studio logo in the header
  - Asterisk divider under the site title
  - Design project index with a dedicated project-page system
  - Photography masonry gallery with a title-aware lightbox and next/previous controls
  - Automatically optimized WebP gallery images, reducing delivered portfolio media from 48.8 MB to 2.48 MB
  - About Streusel Studio section
- Footer:
  - Automatic copyright year
  - Email: streuselstudio@gmail.com
  - Social links: Instagram, GitHub, LinkedIn

## Adding portfolio projects

See `MAINTENANCE.md`. Design projects are discovered from folders in `source\images\portfolio\design`; photography titles continue to derive from image filenames.

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

To publish changes, commit and push the project. Netlify builds the project pages and gallery automatically.

## Key files

| Purpose | File |
|---|---|
| Design gallery layout | `source\partials\blocks\portfolio-home.htm` |
| Automatic gallery/project-page generator | `gulpfile.js` |
| Gallery rendering and lightbox | `source\js\script.js` |
| Contact page | `source\contact.html` |
| Shared footer | `source\partials\blocks\footer.htm` |
| Netlify settings | `netlify.toml` |
