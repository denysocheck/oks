// ==========================================================================
// MAIN.JS - INTERACTION, ENVELOPE, AUDIO, COUNTDOWN, CARD REVEAL
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
  // COUNTDOWN TIMER
  // --------------------------------------------------------------------------
  const targetDate = new Date("2026-11-17T16:00:00+02:00");
  const cdDays = document.getElementById("cdDays");
  const cdHours = document.getElementById("cdHours");
  const cdMinutes = document.getElementById("cdMinutes");
  const cdSeconds = document.getElementById("cdSeconds");

  function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      if (cdDays) cdDays.textContent = "0";
      if (cdHours) cdHours.textContent = "0";
      if (cdMinutes) cdMinutes.textContent = "0";
      if (cdSeconds) cdSeconds.textContent = "0";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (cdDays) cdDays.textContent = days;
    if (cdHours) cdHours.textContent = hours;
    if (cdMinutes) cdMinutes.textContent = minutes;
    if (cdSeconds) cdSeconds.textContent = seconds;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

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

  // --------------------------------------------------------------------------
  // STATION CARD REVEAL ON SCROLL
  // --------------------------------------------------------------------------
  const stationCards = document.querySelectorAll(".station-copy-card");

  function revealVisibleCards() {
    const triggerH = window.innerHeight * 0.88;
    stationCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < triggerH && rect.bottom > 40) {
        card.classList.add("visible");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    stationCards.forEach((card) => cardObserver.observe(card));
  }

  window.addEventListener("scroll", revealVisibleCards, { passive: true });
  window.addEventListener("resize", revealVisibleCards, { passive: true });
  revealVisibleCards();

  // --------------------------------------------------------------------------
  // RSVP INVITATION ACCEPTANCE
  // --------------------------------------------------------------------------
  const KVDB_BUCKET = "J4wPbjxCGpL4zyN8NtsRiQ";

  window.submitRsvp = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInput = document.getElementById("guestName");
    const rsvpBtn = document.getElementById("rsvpBtn");
    const rsvpSuccess = document.getElementById("rsvpSuccess");
    const inputRow = document.querySelector(".rsvp-input-row");
    const label = document.querySelector(".rsvp-label");

    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    if (rsvpBtn) {
      rsvpBtn.disabled = true;
      const textSpan = rsvpBtn.querySelector(".btn-text");
      const spinSpan = rsvpBtn.querySelector(".btn-spinner");
      if (textSpan) textSpan.style.display = "none";
      if (spinSpan) spinSpan.style.display = "inline";
    }

    const payload = {
      name: name,
      date: new Date().toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" }),
      timestamp: Date.now()
    };

    try {
      const key = "rsvp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      await fetch(`https://kvdb.io/${KVDB_BUCKET}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      localStorage.setItem("oks_my_rsvp", name);
    } catch (err) {
      console.warn("Could not save to remote KV, fallback to local:", err);
      localStorage.setItem("oks_my_rsvp", name);
    }

    // Success UI
    if (inputRow) inputRow.style.display = "none";
    if (label) label.style.display = "none";
    if (rsvpBtn) rsvpBtn.style.display = "none";
    if (rsvpSuccess) {
      rsvpSuccess.style.display = "block";
      const title = rsvpSuccess.querySelector(".rsvp-success-title");
      if (title) title.textContent = `${name}, чекаю на вас!`;
    }
  };

  // Check if user already accepted
  const savedName = localStorage.getItem("oks_my_rsvp");
  if (savedName) {
    const rsvpSuccess = document.getElementById("rsvpSuccess");
    const inputRow = document.querySelector(".rsvp-input-row");
    const label = document.querySelector(".rsvp-label");
    const rsvpBtn = document.getElementById("rsvpBtn");

    if (inputRow) inputRow.style.display = "none";
    if (label) label.style.display = "none";
    if (rsvpBtn) rsvpBtn.style.display = "none";
    if (rsvpSuccess) {
      rsvpSuccess.style.display = "block";
      const title = rsvpSuccess.querySelector(".rsvp-success-title");
      if (title) title.textContent = `${savedName}, чекаю на вас!`;
      const desc = rsvpSuccess.querySelector(".rsvp-success-desc");
      if (desc) desc.textContent = "Ви вже прийняли запрошення. До зустрічі 17 листопада! ❤️";
    }
  }

})();
