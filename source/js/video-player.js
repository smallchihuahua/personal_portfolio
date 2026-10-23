/* Minimal enhancement: native controls remain available if initialization fails. */
(function () {
    "use strict";

    function formatTime(value) {
        if (!Number.isFinite(value)) { return "0:00"; }
        var hours = Math.floor(value / 3600);
        var minutes = Math.floor(value / 60) % 60;
        var seconds = String(Math.floor(value % 60)).padStart(2, "0");
        return (hours ? hours + ":" + String(minutes).padStart(2, "0") : minutes) + ":" + seconds;
    }

    document.querySelectorAll("[data-video-player]").forEach(function (player) {
        var video = player.querySelector("video");
        var controls = player.querySelector(".video-controls");
        var play = player.querySelector("[data-play]");
        var seek = player.querySelector("[data-seek]");
        var mute = player.querySelector("[data-mute]");
        var volume = player.querySelector("[data-volume]");
        var speed = player.querySelector("[data-speed]");
        var fullscreen = player.querySelector("[data-fullscreen]");
        var time = player.querySelector("[data-time]");
        var error = player.querySelector(".video-error");

        function showError(message) {
            error.textContent = message;
            error.hidden = false;
        }

        function togglePlay() {
            if (video.paused) {
                var attempt = video.play();
                if (attempt) { attempt.catch(function () {
                    showError("Playback could not start. Please try again or open the video directly.");
                }); }
            } else { video.pause(); }
        }

        function updatePlayback() {
            play.textContent = video.paused ? "play" : "pause";
            play.setAttribute("aria-label", video.paused ? "Play" : "Pause");
            seek.disabled = !Number.isFinite(video.duration) || video.duration <= 0;
            seek.value = seek.disabled ? 0 : video.currentTime / video.duration * 100;
            seek.setAttribute("aria-valuetext", formatTime(video.currentTime) + " of " + formatTime(video.duration));
            time.textContent = formatTime(video.currentTime) + " / " + formatTime(video.duration);
        }

        function updateVolume() {
            mute.textContent = video.muted || video.volume === 0 ? "unmute" : "mute";
            mute.setAttribute("aria-label", video.muted || video.volume === 0 ? "Unmute" : "Mute");
            mute.setAttribute("aria-pressed", String(video.muted));
            volume.value = video.muted ? 0 : video.volume;
        }

        function toggleFullscreen() {
            var attempt;
            if (document.fullscreenElement) { attempt = document.exitFullscreen(); }
            else if (player.requestFullscreen) { attempt = player.requestFullscreen(); }
            else if (video.webkitEnterFullscreen) { video.webkitEnterFullscreen(); }
            if (attempt) { attempt.catch(function () { showError("Fullscreen is unavailable in this browser."); }); }
        }

        play.addEventListener("click", togglePlay);
        video.addEventListener("click", function () { player.focus({ preventScroll: true }); togglePlay(); });
        video.addEventListener("play", function () {
            error.hidden = true;
            document.querySelectorAll("[data-video-player] video").forEach(function (other) {
                if (other !== video) { other.pause(); }
            });
            updatePlayback();
        });
        ["pause", "ended", "timeupdate", "loadedmetadata", "durationchange"].forEach(function (event) {
            video.addEventListener(event, updatePlayback);
        });
        seek.addEventListener("input", function () {
            if (Number.isFinite(video.duration)) { video.currentTime = Number(seek.value) / 100 * video.duration; }
        });
        mute.addEventListener("click", function () {
            if (video.volume === 0) { video.volume = 1; video.muted = false; }
            else {
            video.muted = !video.muted;
            }
        });
        volume.addEventListener("input", function () { video.volume = Number(volume.value); video.muted = false; });
        video.addEventListener("volumechange", updateVolume);
        speed.addEventListener("change", function () { video.playbackRate = Number(speed.value); });
        fullscreen.addEventListener("click", toggleFullscreen);
        fullscreen.hidden = !document.fullscreenEnabled && !video.webkitEnterFullscreen;
        document.addEventListener("fullscreenchange", function () {
            fullscreen.textContent = document.fullscreenElement === player ? "exit fullscreen" : "fullscreen";
            fullscreen.setAttribute("aria-label", document.fullscreenElement === player ? "Exit fullscreen" : "Enter fullscreen");
        });
        player.addEventListener("keydown", function (event) {
            if (event.target !== player || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) { return; }
            if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); togglePlay(); }
            if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFullscreen(); }
        });
        function playbackError() {
            showError("This video could not be loaded. You can try opening it directly.");
            var link = document.createElement("a");
            link.href = video.querySelector("source").src;
            link.textContent = " Open video";
            error.appendChild(link);
            video.controls = true;
        }
        video.addEventListener("error", playbackError);
        video.querySelector("source").addEventListener("error", playbackError);
        updatePlayback();
        updateVolume();
        controls.hidden = false;
        video.controls = false;
    });
}());
