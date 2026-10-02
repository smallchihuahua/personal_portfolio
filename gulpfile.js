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
    html: "source/*.html",
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
  { directory: "photography", filter: "photo" },
  { directory: "art", filter: "art" },
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

// HTML
gulp.task("html", function () {
  return gulp
    .src(path.src.html)
    .pipe(
      fileinclude({
        basepath: path.src.incdir,
        context: {
          version: "premium",
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
  const projects = [];

  function titleFromName(name) {
    return name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  portfolioCategories.forEach(function (category) {
    const categoryPath = nodePath.join(portfolioRoot, category.directory);

    if (!fs.existsSync(categoryPath)) {
      return;
    }

    fs.readdirSync(categoryPath, { withFileTypes: true }).forEach(function (entry) {
      const entryPath = nodePath.join(categoryPath, entry.name);

      if (entry.isFile() && portfolioImageExtension.test(entry.name)) {
        projects.push({
          category: category.filter,
          title: titleFromName(entry.name),
          images: [optimizedPortfolioPath(entryPath)],
        });
      }

      if (entry.isDirectory()) {
        const images = portfolioImagePaths(entryPath).map(optimizedPortfolioPath);

        if (images.length) {
          projects.push({
            category: category.filter,
            title: titleFromName(entry.name),
            images: images,
          });
        }
      }
    });
  });

  fs.mkdirSync(path.build.dir, { recursive: true });
  fs.writeFileSync(
    nodePath.join(path.build.dir, "portfolio.json"),
    JSON.stringify({ projects: projects }, null, 2) + "\n"
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
  gulp.watch(path.src.html, gulp.series("html"));
  gulp.watch(path.src.htminc, gulp.series("html"));
  gulp.watch(path.src.scss, gulp.series("scss"));
  gulp.watch(path.src.js, gulp.series("js"));
  gulp.watch(path.src.images, gulp.series("images", "portfolio-images", "portfolio-data"));
  gulp.watch(path.src.fonts, gulp.series("fonts"));
  gulp.watch(path.src.plugins, gulp.series("plugins"));
});

// dev Task
gulp.task(
  "default",
  gulp.series(
    "clean",
    "html",
    "js",
    "scss",
    "images",
    "portfolio-images",
    "portfolio-data",
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
    "js",
    "scss",
    "images",
    "portfolio-images",
    "portfolio-data",
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
    "js",
    "scss",
    "scss-files",
    "images",
    "portfolio-images",
    "portfolio-data",
    "images-blur",
    "fonts",
    "plugins",
    "static"
  )
);

// Deploy Task
gulp.task(
  "deploy",
  gulp.series("html", "js", "scss", "images", "portfolio-images", "portfolio-data", "fonts", "plugins", "static")
);
