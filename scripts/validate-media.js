"use strict";
const fs = require("fs");
const { connect, waitFor } = require("./browser-check");

(async () => {
  const client = await connect();
  const checks = [];
  function assert(name, result) { checks.push({ name, passed: Boolean(result) }); if (!result) throw new Error(name); }
  try {
    await client.send("Page.enable");
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.setBlockedURLs", { urls: ["*fonts.googleapis.com*", "*fonts.gstatic.com*"] });
    await client.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await client.send("Page.navigate", { url: "http://localhost:3000/photography.html" });
    await waitFor(client, "document.querySelectorAll('[data-portfolio-gallery] img').length > 0");
    await waitFor(client, "[...document.querySelectorAll('[data-portfolio-gallery] img')].filter(img => img.loading === 'eager').every(img => img.complete && img.naturalWidth > 0)");
    const photography = await client.evaluate(`(() => ({
      images: [...document.querySelectorAll('[data-portfolio-gallery] img')].map(img => ({src: img.currentSrc, loading: img.loading, width: img.naturalWidth, displayWidth: img.getBoundingClientRect().width, height: img.naturalHeight})),
      requests: performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'img').map(entry => ({url: entry.name, bytes: entry.transferSize}))
    }))()`);
    assert("Gallery thumbnails use variants", photography.images.every(img => /-\d+\.webp$/.test(img.src)));
    assert("Below-fold images use lazy loading", photography.images.some(img => img.loading === "lazy"));
    assert("Originals are not requested by the gallery", photography.requests.every(request => !request.url.includes("/originals/")));
    await client.evaluate("document.querySelector('.popup-gallery').click()", true);
    await waitFor(client, "!!document.querySelector('.mfp-img')?.naturalWidth");
    assert("Lightbox opens original photo", await client.evaluate("document.querySelector('.mfp-img').src.includes('/originals/')"));
    await client.send("Page.navigate", { url: "http://localhost:3000/work/ring-of-chain/" });
    await waitFor(client, "document.querySelectorAll('video').length === 2 && [...document.querySelectorAll('video')].every(video => video.readyState >= 1)", 30000);
    assert("Two metadata-only videos, no autoplay", await client.evaluate("[...document.querySelectorAll('video')].every(v => v.paused && !v.autoplay && v.preload === 'metadata' && v.videoWidth === 1280)"));
    assert("Both video durations available", await client.evaluate("[...document.querySelectorAll('video')].every(v => v.duration > 170)"));
    await client.evaluate("document.querySelector('video').click()", true);
    await waitFor(client, "document.querySelector('video').currentTime > 0.2");
    assert("Video click starts playback", await client.evaluate("!document.querySelector('video').paused"));
    await client.evaluate("document.querySelector('[data-play]').click()", true);
    assert("Play/pause button pauses", await client.evaluate("document.querySelector('video').paused"));
    await client.evaluate("var p=document.querySelector('[data-video-player]'); p.focus();");
    await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "k", code: "KeyK", windowsVirtualKeyCode: 75 });
    await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", windowsVirtualKeyCode: 75 });
    await waitFor(client, "!document.querySelector('video').paused");
    assert("K toggles focused player", true);
    await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    assert("Space toggles focused player", await client.evaluate("document.querySelector('video').paused"));
    await client.evaluate("var s=document.querySelector('[data-seek]'); s.value=50; s.dispatchEvent(new Event('input',{bubbles:true}));");
    await waitFor(client, "!document.querySelector('video').seeking");
    assert("Timeline seeks", await client.evaluate("Math.abs(document.querySelector('video').currentTime / document.querySelector('video').duration - 0.5) < 0.01"));
    await client.evaluate("var v=document.querySelector('[data-volume]'); v.value=0.4; v.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-mute]').click();");
    assert("Volume and mute", await client.evaluate("document.querySelector('video').muted && document.querySelector('video').volume === 0.4"));
    await client.evaluate("document.querySelector('[data-mute]').click()");
    assert("Unmute", await client.evaluate("!document.querySelector('video').muted"));
    for (const speed of [0.5, 1, 1.5, 2]) {
      await client.evaluate("var s=document.querySelector('[data-speed]'); s.value='" + speed + "'; s.dispatchEvent(new Event('change',{bubbles:true}));");
      assert("Playback speed " + speed, await client.evaluate("document.querySelector('video').playbackRate === " + speed));
    }
    await client.evaluate("document.querySelector('[data-fullscreen]').click()", true);
    await waitFor(client, "!!document.fullscreenElement");
    assert("Fullscreen includes controls", await client.evaluate("document.fullscreenElement.matches('[data-video-player]') && !!document.fullscreenElement.querySelector('.video-controls')"));
    await client.evaluate("document.querySelector('[data-fullscreen]').click()", true);
    await waitFor(client, "!document.fullscreenElement");
    assert("Fullscreen exits", true);
    await client.evaluate("document.querySelectorAll('[data-play]')[0].click()", true);
    await client.evaluate("document.querySelectorAll('[data-play]')[1].click()", true);
    await waitFor(client, "document.querySelectorAll('video')[1].currentTime > 0.2");
    assert("Second video plays and pauses first", await client.evaluate("document.querySelectorAll('video')[0].paused && !document.querySelectorAll('video')[1].paused"));
    await client.evaluate("document.querySelectorAll('video')[1].pause()");
    assert("Controls have accessible labels", await client.evaluate("[...document.querySelectorAll('.video-controls button, .video-controls select')].every(element => element.getAttribute('aria-label')) && [...document.querySelectorAll('.video-controls input')].every(element => element.closest('label'))"));
    await client.evaluate("document.querySelector('[data-video-player]').focus()");
    await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "f", code: "KeyF", windowsVirtualKeyCode: 70 });
    await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "f", code: "KeyF", windowsVirtualKeyCode: 70 });
    await waitFor(client, "!!document.fullscreenElement");
    assert("F enters fullscreen", true);
    await client.evaluate("document.exitFullscreen()", true);
    await client.evaluate("var video=document.querySelector('video'); video.querySelector('source').src='/missing-test-video.mp4'; video.load()");
    await waitFor(client, "!document.querySelector('.video-error').hidden");
    assert("Playback errors show recovery text", await client.evaluate("document.querySelector('.video-error').textContent.includes('could not be loaded') && document.querySelector('video').controls"));
    await client.send("Page.navigate", { url: "http://localhost:3000/contact" });
    await waitFor(client, "document.readyState === 'complete' && !!document.querySelector('#contact-form')");
    assert("Contact form integration unchanged", await client.evaluate("(() => { const form=document.querySelector('#contact-form'); return form.method==='post' && form.getAttribute('action')==='/contact.html' && form.getAttribute('data-netlify')==='true' && form.querySelector('[name=bot-field]') && ['name','subject','email','message'].every(name => form.querySelector('[name='+name+']').required); })()"));
    await client.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: false });
    await client.evaluate("document.querySelector('.navbar-toggler').click()", true);
    await waitFor(client, "document.querySelector('.navbar-toggler').getAttribute('aria-expanded') === 'true'");
    assert("Mobile navigation opens", true);
    await client.send("Emulation.setScriptExecutionDisabled", { value: true });
    await client.send("Page.navigate", { url: "http://localhost:3000/work/ring-of-chain/" });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await client.send("Emulation.setScriptExecutionDisabled", { value: false });
    assert("Native video controls survive without JavaScript", await client.evaluate("[...document.querySelectorAll('video')].length === 2 && [...document.querySelectorAll('video')].every(video => video.controls)"));
    fs.writeFileSync(".tmp-media-results.json", JSON.stringify({ checks, photography }, null, 2));
    console.log(JSON.stringify({ checks, photography }, null, 2));
  } finally { client.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
