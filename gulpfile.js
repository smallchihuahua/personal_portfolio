"use strict";

const sass = require("gulp-sass")(require("sass"));
const gulp = require("gulp");
const gutil = require("gulp-util");
const jshint = require("gulp-jshint");
const sourcemaps = require("gulp-sourcemaps");
const fileinclude = require("gulp-file-include");
const autoprefixer = require("gulp-autoprefixer");
const bs = require("browser-sync").create();
const rimraf = require("rimraf");
const gm = require("gulp-gm");
const comments = require("gulp-header-comment");
const fs = require("fs");
const nodePath = require("path");
const sharp = require("sharp");

var path = {
  src: {
    // source paths
    html: ["source/index.html", "source/about.html", "source/contact.html", "source/photography.html"],
    htminc: "source/partials/**/*",
    incdir: "source/partials/",
    plugins: "source/plugins/**/*",
    js: "source/js/*.js",
    scss: "source/scss/**/*.scss",
    images: "source/images/**/*.+(png|PNG|jpg|JPG|jpeg|JPEG|gif|GIF|svg|SVG|webp|WEBP|ico|ICO)",
    blur: "source/images/**/*.+(jpg|JPG|jpeg|JPEG|webp|WEBP)",
    fonts: "source/fonts/**/*.+(eot|ttf|woff|woff2|otf)",
    static: "source/static/**/*",
  },
  build: {
    // build paths
    dir: "theme/",
  },
};

const portfolioCategories = [
  { directory: "design", filter: "design" },
  { directory: "photography", filter: "photography" },
];
const portfolioImageExtension = /\.(png|jpe?g|gif|webp)$/i;

function optimizedPortfolioPath(filePath) {
  const relativePath = nodePath.relative("source", filePath).split(nodePath.sep).join("/");

  return nodePath.extname(filePath).toLowerCase() === ".gif"
    ? relativePath
    : relativePath.replace(/\.[^.]+$/, ".webp");
}

function portfolioImagePaths(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(function (entry) {
    const entryPath = nodePath.join(directory, entry.name);

    if (entry.isDirectory()) {
      return portfolioImagePaths(entryPath);
    }

    return entry.isFile() && portfolioImageExtension.test(entry.name) ? [entryPath] : [];
  });
}

function titleFromName(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayTitleFromName(name) {
  return titleFromName(name).replace(/\b\w/g, function (character) {
    return character.toUpperCase();
  });
}

function slugFromName(name) {
  return titleFromName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function imagePosition(filePath) {
  const filename = nodePath.basename(filePath, nodePath.extname(filePath));
  const match = filename.match(/-(\d+)([a-z])?$/i);

  if (!match) {
    return null;
  }

  return {
    number: Number(match[1]),
    suffix: (match[2] || "").toLowerCase(),
  };
}

function compareImagePaths(firstPath, secondPath) {
  const firstPosition = imagePosition(firstPath);
  const secondPosition = imagePosition(secondPath);

  if (firstPosition && secondPosition) {
    if (firstPosition.number !== secondPosition.number) {
      return firstPosition.number - secondPosition.number;
    }

    return firstPosition.suffix.localeCompare(secondPosition.suffix);
  }

  return nodePath.basename(firstPath).localeCompare(nodePath.basename(secondPath), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function groupedProjectImages(imagePaths) {
  const groups = [];
  const groupsByPosition = new Map();

  imagePaths.sort(compareImagePaths).forEach(function (imagePath) {
    const position = imagePosition(imagePath);
    const groupKey = position ? String(position.number) : imagePath;
    let group = groupsByPosition.get(groupKey);

    if (!group) {
      group = [];
      groupsByPosition.set(groupKey, group);
      groups.push(group);
    }

    group.push({
      source: nodePath.relative("source", imagePath).split(nodePath.sep).join("/"),
    });
  });

  return groups.map(function (group) {
    return group.length > 1 ? { layout: "group", images: group } : group[0];
  });
}

function projectCoverSource(project) {
  const firstItem = project.images[0];

  return firstItem.images ? firstItem.images[0].source : firstItem.source;
}

function projectDescription(projectDirectory) {
  const descriptionPath = nodePath.join(projectDirectory, "description.txt");

  if (!fs.existsSync(descriptionPath)) {
    return "";
  }

  return fs.readFileSync(descriptionPath, "utf8").replace(/^\uFEFF/, "").trim();
}

function designProjectsFromFolders() {
  const designDirectory = nodePath.join("source", "images", "portfolio", "design");

  if (!fs.existsSync(designDirectory)) {
    return [];
  }

  return fs
    .readdirSync(designDirectory, { withFileTypes: true })
    .filter(function (entry) {
      return entry.isDirectory();
    })
    .sort(function (first, second) {
      return compareImagePaths(first.name, second.name);
    })
    .map(function (entry) {
      const projectDirectory = nodePath.join(designDirectory, entry.name);
      const imagePaths = portfolioImagePaths(projectDirectory).sort(compareImagePaths);

      if (!imagePaths.length) {
        return null;
      }

      return {
        title: displayTitleFromName(entry.name),
        slug: slugFromName(entry.name),
        images: groupedProjectImages(imagePaths),
        description: projectDescription(projectDirectory),
      };
    })
    .filter(Boolean);
}

function optimizedSourcePath(sourcePath) {
  return optimizedPortfolioPath(nodePath.join("source", sourcePath));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function descriptionMarkup(description) {
  if (!description) {
    return "";
  }

  return description
    .split(/\r?\n\s*\r?\n/)
    .map(function (paragraph) {
      return "<p>" + escapeHtml(paragraph.trim()).replace(/\r?\n/g, "<br>") + "</p>";
    })
    .join("");
}

function renderProjectImages(project) {
  return project.images
    .map(function (item) {
      const images = item.images || [item];
      const layout = item.layout || "normal";
      const imageMarkup = images
        .map(function (image) {
          return (
            '<img src="/' +
            optimizedSourcePath(image.source) +
            '" alt="' +
            escapeHtml(image.alt || "") +
            '" loading="lazy" decoding="async">'
          );
        })
        .join("");

      return '<figure class="project-image project-image--' + escapeHtml(layout) + '">' + imageMarkup + "</figure>";
    })
    .join("\n");
}

function projectPageHtml(project) {
  const header = fs
    .readFileSync("source/partials/header.htm", "utf8")
    .replace("<title>@@title</title>", "<title>" + escapeHtml(project.title) + " — Streusel Studio</title>")
    .replace(/href="(plugins|css)\//g, 'href="/$1/');
  const navigation = fs.readFileSync("source/partials/blocks/nav-home.htm", "utf8");
  const footer = fs
    .readFileSync("source/partials/blocks/footer.htm", "utf8")
    .replace('src="images/', 'src="/images/');
  const scripts = fs
    .readFileSync("source/partials/footer.htm", "utf8")
    .replace(/src="(plugins|js)\//g, 'src="/$1/');
  const description = descriptionMarkup(project.description);
  const descriptionClass = description ? " project-header--with-description" : "";

  return (
    header +
    navigation +
    '<main class="project-page section" data-site-view="design">' +
    '<div class="container">' +
    '<a class="project-back-link" href="/">← design</a>' +
    '<header class="project-header' +
    descriptionClass +
    '">' +
    "<h1>" +
    escapeHtml(project.title) +
    "</h1>" +
    (description ? '<div class="project-description">' + description + "</div>" : "") +
    "</header>" +
    '<div class="project-media">' +
    renderProjectImages(project) +
    "</div>" +
    '<a class="project-back-link project-back-link--bottom" href="/">← back to design</a>' +
    "</div>" +
    "</main>" +
    footer +
    scripts
  );
}

function rootRelativePageHtml(pagePath) {
  return fs
    .readFileSync(pagePath, "utf8")
    .replace(/(href|src)="(plugins|css|images|js)\//g, '$1="/$2/');
}

// HTML
gulp.task("html", function () {
  return gulp
    .src(path.src.html)
    .pipe(
      fileinclude({
        basepath: path.src.incdir,
        context: {
          version: "premium",
          title: "Streusel Studio",
        },
      })
    )
    .pipe(
      comments(`
    WEBSITE: #!
    TWITTER: #!
    FACEBOOK: #!
    GITHUB: #!
    `)
    )
    .pipe(gulp.dest(path.build.dir))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// SCSS
gulp.task("scss", function () {
  return gulp
    .src(path.src.scss)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
      }).on("error", sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(sourcemaps.write("/"))
    .pipe(
      comments(`
    WEBSITE: #!
    TWITTER: #!
    FACEBOOK: #!
    GITHUB: #!
    `)
    )
    .pipe(gulp.dest(path.build.dir + "css/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

gulp.task("scss-files", function () {
  return gulp.src(path.src.scss).pipe(gulp.dest(path.build.dir + "scss/"));
});

// Javascript
gulp.task("js", function () {
  return gulp
    .src(path.src.js)
    .pipe(jshint("./.jshintrc"))
    .pipe(jshint.reporter("jshint-stylish"))
    .on("error", gutil.log)
    .pipe(
      comments(`
    WEBSITE: #!
    TWITTER: #!
    FACEBOOK: #!
    GITHUB: #!
    `)
    )
    .pipe(gulp.dest(path.build.dir + "js/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Image blur
gulp.task("images-blur", function () {
  return gulp
    .src(path.src.blur)
    .pipe(
      gm(function (gmfile) {
        return gmfile.blur(10, 10);
      })
    )
    .pipe(gulp.dest(path.build.dir + "images/"));
});

// image build
gulp.task("images", function () {
  return gulp
    .src([
      path.src.images,
      "!source/images/portfolio/design/**/*",
      "!source/images/portfolio/photography/**/*",
      "!source/images/portfolio/art/**/*",
    ])
    .pipe(gulp.dest(path.build.dir + "images/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Optimized portfolio images
gulp.task("portfolio-images", async function () {
  const portfolioRoot = "source/images/portfolio";

  for (const category of portfolioCategories) {
    const categoryPath = nodePath.join(portfolioRoot, category.directory);

    if (!fs.existsSync(categoryPath)) {
      continue;
    }

    for (const sourcePath of portfolioImagePaths(categoryPath)) {
      const outputPath = nodePath.join(path.build.dir, optimizedPortfolioPath(sourcePath));
      await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });

      if (nodePath.extname(sourcePath).toLowerCase() === ".gif") {
        await fs.promises.copyFile(sourcePath, outputPath);
        continue;
      }

      await sharp(sourcePath)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 5 })
        .toFile(outputPath);
    }
  }

  bs.reload();
});

// Portfolio manifest
gulp.task("portfolio-data", function (cb) {
  const portfolioRoot = "source/images/portfolio";
  const photographyDirectory = nodePath.join(portfolioRoot, "photography");
  const photography = fs.existsSync(photographyDirectory)
    ? portfolioImagePaths(photographyDirectory).map(function (imagePath) {
        return {
          title: titleFromName(nodePath.basename(imagePath)),
          image: optimizedPortfolioPath(imagePath),
        };
      })
    : [];
  const design = designProjectsFromFolders().map(function (project) {
    return {
      title: project.title,
      slug: project.slug,
      cover: optimizedSourcePath(projectCoverSource(project)),
      coverAlt: project.title,
      disciplines: ["Design"],
      url: "/work/" + project.slug + "/",
    };
  });

  fs.mkdirSync(path.build.dir, { recursive: true });
  fs.writeFileSync(
    nodePath.join(path.build.dir, "portfolio.json"),
    JSON.stringify({ design: design, photography: photography }, null, 2) + "\n"
  );
  cb();
});

gulp.task("project-pages", function (cb) {
  designProjectsFromFolders().forEach(function (project) {
    const pageDirectory = nodePath.join(path.build.dir, "work", project.slug);

    fs.mkdirSync(pageDirectory, { recursive: true });
    fs.writeFileSync(nodePath.join(pageDirectory, "index.html"), projectPageHtml(project));
  });
  cb();
});

gulp.task("contact-page", function (cb) {
  const contactDirectory = nodePath.join(path.build.dir, "contact");

  fs.mkdirSync(contactDirectory, { recursive: true });
  fs.writeFileSync(
    nodePath.join(contactDirectory, "index.html"),
    rootRelativePageHtml(nodePath.join(path.build.dir, "contact.html"))
  );
  cb();
});

gulp.task("about-page", function (cb) {
  const aboutDirectory = nodePath.join(path.build.dir, "about");

  fs.mkdirSync(aboutDirectory, { recursive: true });
  fs.writeFileSync(
    nodePath.join(aboutDirectory, "index.html"),
    rootRelativePageHtml(nodePath.join(path.build.dir, "about.html"))
  );
  cb();
});

// fonts
gulp.task("fonts", function () {
  return gulp
    .src(path.src.fonts)
    .pipe(gulp.dest(path.build.dir + "fonts/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Plugins
gulp.task("plugins", function () {
  return gulp
    .src(path.src.plugins)
    .pipe(gulp.dest(path.build.dir + "plugins/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// static files
gulp.task("static", function () {
  return gulp.src(path.src.static).pipe(gulp.dest(path.build.dir));
});

// Clean Theme Folder
gulp.task("clean", function (cb) {
  rimraf("./theme", cb);
});

// Watch Task
gulp.task("watch", function () {
  gulp.watch(path.src.html, gulp.series("html", "about-page", "contact-page", "project-pages"));
  gulp.watch(path.src.htminc, gulp.series("html", "about-page", "contact-page", "project-pages"));
  gulp.watch(path.src.scss, gulp.series("scss"));
  gulp.watch(path.src.js, gulp.series("js"));
  gulp.watch(path.src.images, gulp.series("images", "portfolio-images", "portfolio-data", "project-pages"));
  gulp.watch(path.src.fonts, gulp.series("fonts"));
  gulp.watch(path.src.plugins, gulp.series("plugins"));
});

// dev Task
gulp.task(
  "default",
  gulp.series(
    "clean",
    "html",
    "about-page",
    "contact-page",
    "js",
    "scss",
    "images",
    "portfolio-images",
    "portfolio-data",
    "project-pages",
    "fonts",
    "plugins",
    "static",
    gulp.parallel("watch", function () {
      bs.init({
        server: {
          baseDir: path.build.dir,
        },
      });
    })
  )
);

// Build Task
gulp.task(
  "build",
  gulp.series(
    "clean",
    "html",
    "about-page",
    "contact-page",
    "js",
    "scss",
    "images",
    "portfolio-images",
    "portfolio-data",
    "project-pages",
    "fonts",
    "plugins",
    "static"
  )
);

// Clean Docs Folder
gulp.task("clean-docs", function (cb) {
  rimraf("./docs", cb);
});

// Copy built theme to docs/ for GitHub Pages
gulp.task(
  "copy-to-docs",
  gulp.series("clean-docs", function () {
    return gulp.src(path.build.dir + "**/*").pipe(gulp.dest("docs/"));
  })
);

// Build specifically for GitHub Pages: build then copy to docs/
gulp.task("build:docs", gulp.series("build", "copy-to-docs"));

// Build Download Files Task
gulp.task(
  "download",
  gulp.series(
    "clean",
    "html",
    "about-page",
    "contact-page",
    "js",
    "scss",
    "scss-files",
    "images",
    "portfolio-images",
    "portfolio-data",
    "project-pages",
    "images-blur",
    "fonts",
    "plugins",
    "static"
  )
);

// Deploy Task
gulp.task(
  "deploy",
  gulp.series(
    "html",
    "about-page",
    "contact-page",
    "js",
    "scss",
    "images",
    "portfolio-images",
    "portfolio-data",
    "project-pages",
    "fonts",
    "plugins",
    "static"
  )
);
