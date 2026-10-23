"use strict";
const fs = require("fs");
const { connect, waitFor } = require("./browser-check");

(async () => {
  const client = await connect();
  const results = [];
  const projects = JSON.parse(fs.readFileSync("theme/portfolio.json", "utf8"));
  const routes = ["/", "/photography.html", "/motion.html", "/about", "/about.html", "/contact", "/contact.html", ...projects.design.map(project => project.url), ...projects.motion.map(project => project.url)];
  const viewports = [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
  const zooms = [0.5, 0.75, 1, 1.25, 1.5, 2];
  await client.send("Page.enable");
  await client.send("Network.enable");
  await client.send("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*"] });
  try {
    for (const viewport of viewports) {
      for (const zoom of zooms) {
        // Browser zoom changes the CSS viewport and device-pixel ratio together.
        await client.send("Emulation.setDeviceMetricsOverride", { width: Math.round(viewport.width / zoom), height: Math.round(viewport.height / zoom), deviceScaleFactor: zoom, mobile: false });
        for (const route of routes) {
          console.log("Checking", viewport.width, viewport.height, zoom, route);
          await client.send("Page.navigate", { url: "http://localhost:3000" + route });
          await waitFor(client, "location.pathname.replace(/\\/$/, '') === " + JSON.stringify(route.replace(/\/$/, "")) + " && document.readyState === 'complete' && !!document.querySelector('footer')");
          if (["/", "/photography.html", "/motion.html"].includes(route)) await waitFor(client, "document.querySelectorAll('[data-portfolio-gallery] img').length > 0");
          await client.evaluate("document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))");
          const result = await client.evaluate(`(() => {
            const footer = document.querySelector('footer').getBoundingClientRect();
            const main = document.querySelector('main').getBoundingClientRect();
            const logo = document.querySelector('.footer-brand img').getBoundingClientRect();
            const content = document.querySelector('.footer-content').getBoundingClientRect();
            const images = [...document.querySelectorAll('main img')];
            return { height: innerHeight, documentHeight: document.documentElement.scrollHeight,
              footerBottom: footer.bottom + scrollY, footerTop: footer.top + scrollY, mainBottom: main.bottom + scrollY,
              overflow: document.documentElement.scrollWidth > innerWidth,
              clippedContent: [...document.querySelectorAll('.site-brand-title, .site-brand-separator, .portfolio-section-link, .footer a, .video-controls button, .video-controls select')].filter(element => {
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
              }).map(element => element.textContent.trim()),
              gapBelow: document.documentElement.scrollHeight - (footer.bottom + scrollY),
              logoInside: logo.top >= content.top - 1 && logo.bottom <= content.bottom + 1,
              dimensions: images.every(img => img.width > 0 && img.height > 0),
              columns: getComputedStyle(document.querySelector('[data-portfolio-gallery]') || document.querySelector('main')).gridTemplateColumns };
          })()`);
          const passed = !result.overflow && result.clippedContent.length === 0 && Math.abs(result.gapBelow) <= 2 && result.footerTop >= result.mainBottom - 2 && result.footerBottom >= result.height - 2 && result.logoInside && result.dimensions;
          results.push({ viewport, zoom, route, passed, ...result });
        }
      }
    }
    fs.writeFileSync(".tmp-layout-results.json", JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ checks: results.length, passed: results.filter(result => result.passed).length, failures: results.filter(result => !result.passed) }, null, 2));
    if (results.some(result => !result.passed)) process.exitCode = 1;
  } finally { client.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
