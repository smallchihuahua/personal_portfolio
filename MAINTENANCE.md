# Maintaining Streusel Studio

You only need to add, rename, move, or delete image files, then commit and push. Netlify builds the website automatically.

## Add to Same Faces

1. Put the new image in `source\images\portfolio\design\same-faces\`.
2. Name it with the next number: `same-faces-3.png`, then `same-faces-4.png`, and so on.
3. Commit and push.

The new image appears on the Same Faces page automatically.

## Add to Heading West

1. Put the new image in `source\images\portfolio\design\heading-west\`.
2. Name it `heading-west-1.png`, `heading-west-2.png`, and so on.
3. Commit and push.

## Add to Wizard Club

1. Put the new image in `source\images\portfolio\design\wizard-club\`.
2. Name it `wizard-club-1.png`, `wizard-club-2.png`, and so on.
3. Commit and push.

## Create a new Design project

1. Create a folder inside `source\images\portfolio\design\`.
2. Use a lowercase, hyphenated folder name, such as `yellow-lights`.
3. Add numbered image files inside it:

   ```text
   source\images\portfolio\design\yellow-lights\yellow-lights-1.jpg
   source\images\portfolio\design\yellow-lights\yellow-lights-2.jpg
   source\images\portfolio\design\yellow-lights\yellow-lights-3.jpg
   ```

4. Commit and push.

The website creates **Yellow Lights**, its cover, and `/work/yellow-lights/` automatically.

## Add an optional project description

Create a plain-text file named `description.txt` inside a project folder, for example:

```text
source\images\portfolio\design\same-faces\description.txt
```

Write any amount of introductory text. Leave a blank line between paragraphs. The description appears before the project images. Delete `description.txt` when the project does not need one.

## Group images together

Files with the same number are shown together in a responsive group. Add a letter from `a` through `z` after the number:

```text
same-faces-2a.png
same-faces-2b.png
same-faces-2c.png
```

These appear together at position 2. Larger groups wrap naturally on wide screens and reduce columns or stack on smaller screens. The first item in a group is `a`; use `1a` as the cover when position 1 is grouped.

## Choose the cover

The first numbered image is always the cover. For example, `same-faces-1.png` is the Same Faces cover. If the first position is grouped, use `same-faces-1a.png` as the cover.

## Reorder project images

Rename files with the numbers you want. The website sorts numbers correctly: `1`, `2a`, `2b`, `3`, ... `10`, `11`.

## Remove an image

Delete that image from its project folder, then commit and push.

## Remove a Design project

Delete the whole project folder, then commit and push. Its Design cover and project page disappear automatically.

## Add a photograph

Put one image directly in `source\images\portfolio\photography\`, then commit and push. Its filename becomes the Photography hover and lightbox title.

## Remove a photograph

Delete the image from `source\images\portfolio\photography\`, then commit and push.

## Commit, push, and deploy

In your terminal, from this repository:

```powershell
git add source\images\portfolio
git commit -m "Update portfolio"
git push
```

Netlify detects the push and runs the build. You do not need to edit a project-data file.
