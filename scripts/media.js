"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { spawn } = require("child_process");
const root = "source/images/portfolio/motion";
const cache = ".cache/motion";
const widths = [320, 640, 960];

function escape(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function thumbnails(source, output) {
  const metadata = await sharp(source).metadata();
  const width = metadata.autoOrient ? metadata.autoOrient.width : metadata.width;
  for (const size of widths.filter(size => size < width)) {
    for (const format of ["webp", "jpg"]) {
      const target = output.replace(/\.webp$/, "-" + size + "." + format);
      const image = sharp(source).rotate().resize({ width: size, withoutEnlargement: true });
      if (format === "webp") await image.webp({ quality: 78 }).toFile(target);
      else await image.flatten({ background: "#fff" }).jpeg({ quality: 80, mozjpeg: true }).toFile(target);
    }
  }
}

async function imageData(source, output) {
  const metadata = await sharp(source).metadata();
  const dimensions = metadata.autoOrient || metadata;
  const variants = widths.filter(size => size < dimensions.width);
  if (path.extname(source).toLowerCase() === ".gif") return { width: dimensions.width, height: dimensions.height, thumbnail: output };
  return {
    width: dimensions.width, height: dimensions.height,
    thumbnail: variants.length ? output.replace(/\.webp$/, "-" + variants[0] + ".jpg") : output,
    srcset: variants.map(size => output.replace(/\.webp$/, "-" + size + ".webp") + " " + size + "w").join(", "),
    fallbackSrcset: variants.map(size => output.replace(/\.webp$/, "-" + size + ".jpg") + " " + size + "w").join(", ")
  };
}

function resolveMotionThumbnail(directory, filename) {
  const supported = /\.(png|jpe?g|webp)$/i;
  const files = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && supported.test(entry.name))
    .map(entry => entry.name).sort();
  const selected = files.includes(filename) ? filename : files.find(name => /^thumbnail\.(png|jpe?g|webp)$/i.test(name));
  if (!selected) return null;
  const source = path.join(directory, selected);
  return { source, url: path.relative("source", source).split(path.sep).join("/") };
}

function motionProjects() {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => {
    const directory = path.join(root, entry.name);
    const configPath = path.join(directory, "project.json");
    if (!fs.existsSync(configPath)) return null;
    const project = JSON.parse(fs.readFileSync(configPath, "utf8"));
    project.thumbnailImage = resolveMotionThumbnail(directory, project.thumbnail);
    project.category = "motion";
    project.description = fs.readFileSync(path.join(directory, "description.txt"), "utf8").trim();
    project.videos = project.videos.map(video => {
      const source = path.join(directory, video.file);
      if (!fs.existsSync(source)) throw new Error("Missing motion video: " + source);
      const name = path.basename(video.file, path.extname(video.file));
      return { ...video, source, name, poster: "images/portfolio/motion/" + entry.name + "/" + name + "-poster.jpg",
        playback: "images/portfolio/motion/" + entry.name + "/" + name + ".mp4" };
    });
    return project;
  }).filter(Boolean);
}

function run(binary, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(binary, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    process.stderr.on("data", chunk => { error = (error + chunk).slice(-4000); });
    process.on("error", reject);
    process.on("close", code => code === 0 ? resolve() : reject(new Error(error)));
  });
}

async function buildMotion() {
  const binary = process.env.FFMPEG_PATH || (fs.existsSync("C:/Program Files/ShareX/ffmpeg.exe") ? "C:/Program Files/ShareX/ffmpeg.exe" : "ffmpeg");
  for (const project of motionProjects()) {
    for (const video of project.videos) {
      const directory = path.join(cache, project.slug);
      fs.mkdirSync(directory, { recursive: true });
      const mp4 = path.join(directory, video.name + ".mp4");
      const poster = path.join(directory, video.name + "-poster.jpg");
      const stat = fs.statSync(video.source);
      const stamp = JSON.stringify({ size: stat.size, modified: stat.mtimeMs, version: 1 });
      const stampFile = mp4 + ".json";
      if (!fs.existsSync(stampFile) || fs.readFileSync(stampFile, "utf8") !== stamp || !fs.existsSync(mp4) || !fs.existsSync(poster)) {
        console.log("Encoding " + video.file);
        await run(binary, ["-y", "-progress", path.join(directory, video.name + "-progress.txt"), "-i", video.source, "-map", "0:v:0", "-map", "0:a?", "-vf", "scale=w='min(1280,iw)':h=-2", "-c:v", "libx264", "-threads", "2", "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", mp4]);
        await run(binary, ["-y", "-ss", "1", "-i", mp4, "-frames:v", "1", "-vf", "scale=640:-2", poster]);
        fs.writeFileSync(stampFile, stamp);
      }
      for (const [source, destination] of [[mp4, video.playback], [poster, video.poster]]) {
        const target = path.join("theme", destination);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }
    }
  }
}

function renderVideos(project) {
  return project.videos.map((video, index) => '<figure class="motion-video"><figcaption>' + escape(video.title) + '</figcaption>' +
    '<div class="video-player" data-video-player tabindex="0" role="group" aria-label="' + escape(video.title) + '">' +
    '<video controls playsinline preload="metadata" width="' + video.width + '" height="' + video.height + '" poster="/' + video.poster + '">' +
    '<source src="/' + video.playback + '" type="video/mp4">Your browser cannot play this video.</video>' +
    '<div class="video-controls" hidden>' +
    '<button type="button" data-play aria-label="Play">play</button>' +
    '<label class="video-seek"> <span class="sr-only">Seek video</span><input data-seek type="range" min="0" max="100" step="0.1" value="0"></label>' +
    '<span data-time aria-live="off">0:00 / 0:00</span>' +
    '<button type="button" data-mute aria-label="Mute">mute</button>' +
    '<label class="video-volume"><span class="sr-only">Volume</span><input data-volume type="range" min="0" max="1" step="0.05" value="1"></label>' +
    '<label><span class="sr-only">Playback speed</span><select data-speed aria-label="Playback speed"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label>' +
    '<button type="button" data-fullscreen aria-label="Enter fullscreen">fullscreen</button></div>' +
    '<p class="video-error" role="status" hidden></p></div></figure>').join("\n") +
    '<div class="motion-credits">' + project.credits.map(credit => '<p>' + escape(credit) + '</p>').join("") + '</div>';
}

module.exports = { thumbnails, imageData, motionProjects, buildMotion, renderVideos, resolveMotionThumbnail };
