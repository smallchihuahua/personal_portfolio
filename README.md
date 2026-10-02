# Van's Personal Portfolio

Personal portfolio website for Streusel Studio, featuring visual design, photography, and art.

## Local development

```powershell
npm install
npm run dev
```

Open http://localhost:3000 to preview the site.

## Adding portfolio projects

Add images to one of these folders:

- `source\images\portfolio\design`
- `source\images\portfolio\photography`
- `source\images\portfolio\art`

New images automatically appear in the correct gallery filter. For a multi-image project, create a named folder inside a category and put the project images inside it.

See [HOW-TO-ADD-PROJECTS.md](HOW-TO-ADD-PROJECTS.md) for the complete workflow.

## Deployment

Netlify runs `npm run build` and publishes the generated `theme` folder. Push updates to GitHub, then connect the repository in Netlify to deploy.

## Third-party notices

Required third-party license notices are in [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).
