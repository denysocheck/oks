// ==========================================================================
// MAIN.JS - INTERACTION, ENVELOPE OPENING, RSVP & AUDIO
// ==========================================================================

(function () {
  "use strict";

  // Event Date: 17 November 2026, 16:00
  const EVENT_DATE = new Date("2026-11-17T16:00:00").getTime();

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
  // 3D ENVELOPE OPENING MECHANIC
  // --------------------------------------------------------------------------
  const envelopeStage = document.getElementById("envelope-stage");
  const envelopeBox = document.querySelector(".envelope-box");

  let isEnvelopeOpened = false;

  function openEnvelope() {
    if (isEnvelopeOpened) return;
    isEnvelopeOpened = true;

    // Trigger audio
    startMusic();

    // Trigger 3D CSS fold-out & zoom animation
    if (envelopeBox) envelopeBox.classList.add("anim-open");

    setTimeout(() => {
      if (envelopeStage) envelopeStage.classList.add("opened");
      document.body.classList.add("world-active");
      window.scrollTo(0, 0);

      // Trigger GSAP ScrollTrigger refresh once 3D world is exposed
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    }, 1800);
  }

  if (envelopeStage) {
    envelopeStage.addEventListener("click", openEnvelope);
  }

  // Also support scroll or touch drag to open on first view
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!isEnvelopeOpened && Math.abs(e.touches[0].clientY - touchStartY) > 40) {
      openEnvelope();
    }
  }, { passive: true });

  window.addEventListener("wheel", (e) => {
    if (!isEnvelopeOpened && Math.abs(e.deltaY) > 20) {
      openEnvelope();
    }
  }, { passive: true });

  // --------------------------------------------------------------------------
  // COUNTDOWN TIMER
  // --------------------------------------------------------------------------
  const cdDays = document.getElementById("cdDays");
  const cdHours = document.getElementById("cdHours");
  const cdMinutes = document.getElementById("cdMinutes");
  const cdSeconds = document.getElementById("cdSeconds");

  function updateCountdown() {
    const now = Date.now();
    const diff = Math.max(0, EVENT_DATE - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    if (cdDays) cdDays.textContent = String(d).padStart(2, "0");
    if (cdHours) cdHours.textContent = String(h).padStart(2, "0");
    if (cdMinutes) cdMinutes.textContent = String(m).padStart(2, "0");
    if (cdSeconds) cdSeconds.textContent = String(s).padStart(2, "0");
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // --------------------------------------------------------------------------
  // MENU TABS INTERACTION
  // --------------------------------------------------------------------------
  const menuData = {
    cold: [
      { name: "Асорті карпатських сирів з інжиром та медом", tag: "Крафтові сири" },
      { name: "Тартар з яловичини з трюфельним соусом", tag: "Фірмове" },
      { name: "Рулетики з баклажанів з горіховим кремом", tag: "Закуска" }
    ],
    hot: [
      { name: "Каре телятини з овочами гриль", tag: "М'ясні страви" },
      { name: "Філе форелі під шафрановим соусом", tag: "Рибне плато" },
      { name: "Австрійський шніцель з картопляним салатом", tag: "Традиційне" }
    ],
    drinks: [
      { name: "Вишукане ігристе Prosecco", tag: "Welcome Drink" },
      { name: "Австрійські вина Grüner Veltliner", tag: "Винна карта" },
      { name: "Домашній ягідний морс та лимонад", tag: "Безалкогольне" }
    ]
  };

  const menuListContainer = document.getElementById("menuList");
  const menuTabButtons = document.querySelectorAll(".menu-tab-btn");

  function renderMenu(category) {
    if (!menuListContainer || !menuData[category]) return;
    const items = menuData[category];
    menuListContainer.innerHTML = items.map(item => `
      <div class="menu-item">
        <span class="menu-item-name">${item.name}</span>
        <span class="menu-item-tag">${item.tag}</span>
      </div>
    `).join("");
  }

  menuTabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      menuTabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMenu(btn.dataset.category);
    });
  });

  renderMenu("cold");

  // --------------------------------------------------------------------------
  // RSVP FORM SUBMISSION
  // --------------------------------------------------------------------------
  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpSuccess = document.getElementById("rsvpSuccess");

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("guestName").value.trim();
      const attendance = document.querySelector('input[name="attending"]:checked');
      const count = document.getElementById("guestCount").value;
      const wishes = document.getElementById("guestWishes").value.trim();

      if (!name) {
        alert("Будь ласка, введіть ваше ім'я та прізвище.");
        return;
      }
      if (!attendance) {
        alert("Будь ласка, оберіть, чи зможете бути присутніми.");
        return;
      }

      // Save to localStorage as proof of submission
      try {
        const stored = JSON.parse(localStorage.getItem("jubilee_rsvp") || "[]");
        stored.push({
          name,
          attending: attendance.value === "yes",
          count: attendance.value === "yes" ? count : 0,
          wishes,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem("jubilee_rsvp", JSON.stringify(stored));
      } catch (err) {
        console.warn(err);
      }

      // Switch to thank you state
      rsvpForm.style.display = "none";
      if (rsvpSuccess) {
        rsvpSuccess.classList.add("active");
      }
    });
  }

  // --------------------------------------------------------------------------
  // GSAP SCROLL ANIMATIONS FOR STATION CARDS
  // --------------------------------------------------------------------------
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll(".station-card").forEach(card => {
      gsap.fromTo(card,
        {
          y: 60,
          opacity: 0,
          scale: 0.94
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    });
  }

})();
