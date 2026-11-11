// ==========================================================================
// MAIN.JS - INTERACTION, ENVELOPE OPENING, & AUDIO
// ==========================================================================

(function () {
  "use strict";

  // --------------------------------------------------------------------------
  // AUDIO CONTROLLER
  // --------------------------------------------------------------------------
  const bgMusic = document.getElementById("bgMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicIconOn = document.getElementById("musicIconOn");
  const musicIconOff = document.getElementById("musicIconOff");

  function startMusic() {
    if (!bgMusic) return;
    bgMusic.volume = 0.45;
    bgMusic.play().then(() => {
      if (musicToggle) musicToggle.classList.add("playing");
      if (musicIconOn) musicIconOn.style.display = "block";
      if (musicIconOff) musicIconOff.style.display = "none";
    }).catch((err) => {
      console.log("Audio waiting for user gesture:", err);
    });
  }

  function toggleMusic() {
    if (!bgMusic) return;
    if (bgMusic.paused) {
      startMusic();
    } else {
      bgMusic.pause();
      if (musicToggle) musicToggle.classList.remove("playing");
      if (musicIconOn) musicIconOn.style.display = "none";
      if (musicIconOff) musicIconOff.style.display = "block";
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", toggleMusic);
  }

  // --------------------------------------------------------------------------
  // 3D ENVELOPE OPENING & DESCENT ONTO TRACK
  // --------------------------------------------------------------------------
  const envelopeStage = document.getElementById("envelope-stage");
  const envelopeBox = document.querySelector(".envelope-box");

  let isEnvelopeOpened = false;

  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    // Trigger music
    startMusic();

    // Trigger 3D CSS open animation on envelope
    if (envelopeBox) envelopeBox.classList.add("anim-open");

    // Inform 3D world that envelope opened (switches camera to follow marble)
    if (window.notifyEnvelopeOpened) {
      window.notifyEnvelopeOpened();
    }

    setTimeout(() => {
      if (envelopeStage) envelopeStage.classList.add("opened");
      document.body.classList.add("world-active");
      window.scrollTo(0, 0);
    }, 1400);
  }

  if (envelopeStage) {
    envelopeStage.addEventListener("click", openEnvelope);
  }

  // Also support touch drag / scroll wheel on first view to start
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isEnvelopeOpened && Math.abs(e.touches[0].clientY - touchStartY) > 25) {
      openEnvelope();
    }
  }, { passive: true });

  window.addEventListener("wheel", (e) => {
    if (!isEnvelopeOpened && Math.abs(e.deltaY) > 10) {
      openEnvelope();
    }
  }, { passive: true });

})();
