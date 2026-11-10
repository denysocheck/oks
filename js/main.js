// Configuration
window.__DREAM_DATE__ = '2026-11-17T16:00:00';
window.__DREAM_CREATED__ = '2026-08-01T12:00:00';
window.__DREAM_MUSIC__ = true;

// Language / Translation strings
var I18N = {
  countdown: {
    rule: 'slavic',
    days: ['день', 'дні', 'днів'],
    hours: ['година', 'години', 'годин'],
    minutes: ['хвилина', 'хвилини', 'хвилин'],
    seconds: ['секунда', 'секунди', 'секунд']
  },
  thanks: {
    title: 'Дякую за відповідь!',
    line1: 'Вашу відповідь успішно збережено.',
    line2: 'З нетерпінням чекаю нашої зустрічі на святкуванні ювілею! ❤️'
  },
  nameRequired: "Будь ласка, вкажіть ваше ім'я та прізвище",
  chooseOption: 'Будь ласка, оберіть відповідь',
  fillField: 'Будь ласка, заповніть це поле'
};

// Envelope opening & music trigger
function openEnvelope() {
  const env = document.getElementById('envelope');
  if (env) env.classList.add('anim');
  const tap = document.querySelector('.env-tap');
  if (tap) tap.style.display = 'none';

  const music = document.getElementById('bgMusic');
  if (window.__DREAM_MUSIC__ !== false && music) {
    music.volume = 0.45;
    music.play().then(function() {
      const btn = document.getElementById('musicBtn');
      if (btn) btn.classList.add('playing');
      const on = document.getElementById('musicOn');
      const off = document.getElementById('musicOff');
      if (on) on.style.display = 'block';
      if (off) off.style.display = 'none';
    }).catch(function(e) {
      console.log('Autoplay blocked or waiting for gesture:', e);
    });
  }

  setTimeout(() => {
    const screen = document.getElementById('envScreen');
    if (screen) screen.classList.add('opened');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.documentElement.style.position = '';
    document.body.style.position = '';
    document.documentElement.style.height = '';
    document.body.style.height = '';
    window.scrollTo(0, 0);
  }, 2600);
}

// Initial locking of scroll during envelope intro
if (!new URLSearchParams(window.location.search).has('preview')) {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.position = 'fixed';
  document.body.style.position = 'fixed';
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
} else {
  const screen = document.getElementById('envScreen');
  if (screen) screen.classList.add('opened');
}

// Sparkles and floating elements in envelope screen
(function() {
  const screen = document.getElementById('envScreen');
  if (!screen) return;
  const colors = ['#C8BCB0', '#B5A898', '#D8CEC4', '#E8E2DC', '#C8A87C'];
  const bowSvg = `<svg viewBox="0 0 24 24" fill="COLOR" opacity="OP"><path d="M12 13C8 13 5 10 5 7s3-5 5-3l2 3 2-3c2-2 5 0 5 3s-3 6-7 6z"/><path d="M4 16h16c1 0 1 1 0 2l-7 4c-1 0-1 0-2 0l-7-4c-1-1-1-2 0-2z"/></svg>`;
  const giftSvg = `<svg viewBox="0 0 24 24" fill="COLOR" opacity="OP"><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M12 10v12" stroke="STROKE" stroke-width="0.5" fill="none"/><path d="M12 10c-2-4-6-5-6-3s4 3 6 3" fill="STROKE"/><path d="M12 10c2-4 6-5 6-3s-4 3-6 3" fill="STROKE"/></svg>`;
  const heartSvg = `<svg viewBox="0 0 24 24" fill="COLOR" opacity="OP"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

  for (let i = 0; i < 45; i++) {
    const el = document.createElement('div');
    el.className = 'env-float';
    const c = colors[Math.floor(Math.random() * colors.length)];
    const op = (0.3 + Math.random() * 0.35).toFixed(2);
    const dur = 8 + Math.random() * 14;
    const del = -(Math.random() * dur);
    const types = [bowSvg, giftSvg, heartSvg];
    const typeIdx = Math.floor(Math.random() * types.length);
    let svg = types[typeIdx];
    const isHeart = typeIdx === 2;
    const big = isHeart && Math.random() < 0.5;
    const s = isHeart ? (big ? (20 + Math.random() * 35) : (10 + Math.random() * 20)) : (6 + Math.random() * 10);
    svg = svg.replace(/COLOR/g, c).replace(/OP/g, op).replace(/STROKE/g, colors[Math.floor(Math.random() * colors.length)]);
    el.innerHTML = svg;
    el.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 95}%;animation-duration:${dur}s;animation-delay:${del}s;`;
    screen.insertBefore(el, screen.querySelector('.envelope'));
  }

  for (let i = 0; i < 35; i++) {
    const el = document.createElement('div');
    el.className = 'env-float env-float-spin';
    const s = 8 + Math.random() * 12;
    const c = colors[Math.floor(Math.random() * colors.length)];
    const op = (0.25 + Math.random() * 0.3).toFixed(2);
    const dur = 10 + Math.random() * 16;
    const del = -(Math.random() * dur);
    const spinDur = 4 + Math.random() * 6;
    let svg = heartSvg.replace(/COLOR/g, c).replace(/OP/g, op);
    el.innerHTML = svg;
    el.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 95}%;animation:envFloatSpin ${dur}s linear infinite;animation-delay:${del}s;--spin-dur:${spinDur}s;`;
    screen.insertBefore(el, screen.querySelector('.envelope'));
  }
})();

// Music toggle
function toggleMusic() {
  const m = document.getElementById('bgMusic');
  const btn = document.getElementById('musicBtn');
  const on = document.getElementById('musicOn');
  const off = document.getElementById('musicOff');
  if (!m) return;
  if (m.paused) {
    m.volume = 0.45;
    m.play().then(function() {
      if (btn) btn.classList.add('playing');
      if (on) on.style.display = 'block';
      if (off) off.style.display = 'none';
    }).catch(function(e) {
      console.log(e);
    });
  } else {
    m.pause();
    if (btn) btn.classList.remove('playing');
    if (on) on.style.display = 'none';
    if (off) off.style.display = 'block';
  }
}

// Cursor heart trail for desktop
(function() {
  if (window.innerWidth < 769) return;
  let last = 0;
  const colors = ['#C8BCB0', '#B5A898', '#8A7E70', '#E8E2DC', '#C8A87C'];
  document.addEventListener('mousemove', function(e) {
    const now = Date.now();
    if (now - last < 80) return;
    last = now;
    const h = document.createElement('div');
    h.className = 'cursor-heart';
    const s = 8 + Math.random() * 10;
    const c = colors[Math.floor(Math.random() * colors.length)];
    h.innerHTML = `<svg viewBox="0 0 24 24" fill="${c}" width="${s}" height="${s}"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    h.style.left = (e.clientX - s / 2) + 'px';
    h.style.top = (e.clientY - s / 2) + 'px';
    document.body.appendChild(h);
    setTimeout(function() { h.remove(); }, 1000);
  });
})();

// Hero opacity on scroll
(function() {
  const hero = document.getElementById('heroSection');
  if (!hero) return;
  window.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    const heroH = hero.offsetHeight;
    if (scrollY < heroH) {
      hero.style.opacity = 1 - (scrollY / heroH * 0.65);
    }
  }, { passive: true });
})();

// Plural forms for Ukrainian
function pluralForm(n, forms) {
  var x = Math.abs(n) % 100, l = x % 10;
  if (x > 10 && x < 20) return forms[2];
  if (l === 1) return forms[0];
  if (l >= 2 && l <= 4) return forms[1];
  return forms[2];
}

// Countdown timer
function tick() {
  const eventDate = new Date(window.__DREAM_DATE__ || '2026-11-17T16:00:00');
  const diff = eventDate - new Date();
  const dd = diff > 0 ? Math.floor(diff / 864e5) : 0;
  const hh = diff > 0 ? Math.floor(diff % 864e5 / 36e5) : 0;
  const mm = diff > 0 ? Math.floor(diff % 36e5 / 6e4) : 0;
  const ss = diff > 0 ? Math.floor(diff % 6e4 / 1e3) : 0;

  if (document.getElementById('cdD')) {
    document.getElementById('cdD').textContent = String(dd).padStart(2, '0');
    document.getElementById('cdH').textContent = String(hh).padStart(2, '0');
    document.getElementById('cdM').textContent = String(mm).padStart(2, '0');
    document.getElementById('cdS').textContent = String(ss).padStart(2, '0');

    document.getElementById('cdDl').textContent = pluralForm(dd, I18N.countdown.days);
    document.getElementById('cdHl').textContent = pluralForm(hh, I18N.countdown.hours);
    document.getElementById('cdMl').textContent = pluralForm(mm, I18N.countdown.minutes);
    document.getElementById('cdSl').textContent = pluralForm(ss, I18N.countdown.seconds);
  }
}
tick();
setInterval(tick, 1000);

// Hourglass animation sand logic
var EVENT_TIME = new Date(window.__DREAM_DATE__).getTime();
var _created = window.__DREAM_CREATED__ ? new Date(window.__DREAM_CREATED__) : new Date();
var SAND_START = (!isNaN(_created) && _created < EVENT_TIME) ? _created.getTime() : (EVENT_TIME - 365 * 864e5);

function sandDTop(p, o) {
  p = Math.min(1, p + o);
  var xl = 30 + 20 * p * p, ys = 16 + 92 * p - 30 * p * p, yc = 62 + 16 * p;
  return 'M' + xl.toFixed(1) + ' ' + ys.toFixed(1) + ' Q' + xl.toFixed(1) + ' ' + yc.toFixed(1) + ' 50 78 Q' + (100 - xl).toFixed(1) + ' ' + yc.toFixed(1) + ' ' + (100 - xl).toFixed(1) + ' ' + ys.toFixed(1) + ' Z';
}
function sandDBot(p, o) {
  p = Math.min(1, p + o);
  var xl = 38 - 10 * p, ap = 146 - 14 * p, ct = 152 - 12 * p;
  return 'M' + xl.toFixed(1) + ' 168 Q' + xl.toFixed(1) + ' ' + ct.toFixed(1) + ' 50 ' + ap.toFixed(1) + ' Q' + (100 - xl).toFixed(1) + ' ' + ct.toFixed(1) + ' ' + (100 - xl).toFixed(1) + ' 168 Z';
}
function setSand(el, a, b) {
  el.setAttribute('d', a);
  var an = el.querySelector('animate');
  if (an) an.setAttribute('values', a + ';' + b + ';' + a);
}
function sandTick() {
  var p = (Date.now() - SAND_START) / (EVENT_TIME - SAND_START);
  p = Math.max(0, Math.min(1, p));
  var top = document.getElementById('sandTop'), bot = document.getElementById('sandBot'), flow = document.querySelector('.hg__flow');
  if (!top || !bot) return;
  setSand(top, sandDTop(p, 0), sandDTop(p, 0.015));
  setSand(bot, sandDBot(p, 0), sandDBot(p, 0.015));
  if (flow) flow.style.display = p >= 1 ? 'none' : '';
}
sandTick();
setInterval(sandTick, 60000);

// FAQ Accordion
function toggleFaq(btn) {
  var it = btn.closest('.faq__item');
  var a = it.querySelector('.faq__a');
  var open = it.classList.toggle('open');
  a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
}
window.toggleFaq = toggleFaq;

// RSVP Attendance radio change handler
document.addEventListener('change', function(e) {
  if (e.target && e.target.name === 'att') {
    var extra = document.getElementById('rsvpExtra');
    if (!extra) return;
    if (e.target.value === 'yes') {
      extra.classList.add('open');
    } else {
      extra.classList.remove('open');
    }
  }
});

// Form submission & validation
function clearErrors() {
  document.querySelectorAll('.fg-error').forEach(function(el) { el.classList.remove('fg-error'); });
  document.querySelectorAll('.fg-error-msg').forEach(function(el) { el.remove(); });
  document.querySelectorAll('.rad-error').forEach(function(el) { el.classList.remove('rad-error'); });
}

function showError(el, msg) {
  const fg = el.closest('.fg');
  if (!fg) return;
  fg.classList.add('fg-error');
  const rad = fg.querySelector('.rsvp-rad');
  if (rad) rad.classList.add('rad-error');
  const m = document.createElement('div');
  m.className = 'fg-error-msg';
  m.textContent = msg;
  fg.appendChild(m);
}

function sendForm(e) {
  e.preventDefault();
  clearErrors();

  const nameEl = document.getElementById('gName');
  const n = nameEl ? nameEl.value.trim() : '';
  if (!n) {
    showError(nameEl, I18N.nameRequired);
    nameEl.focus();
    return false;
  }

  const attChecked = document.querySelector('input[name="att"]:checked');
  if (!attChecked) {
    showError(document.querySelector('input[name="att"]'), I18N.chooseOption);
    return false;
  }

  const attending = attChecked.value === 'yes';
  const guestCount = attending ? (document.getElementById('gCount') ? document.getElementById('gCount').value : 1) : 1;
  const wishes = document.getElementById('gWishes') ? document.getElementById('gWishes').value.trim() : '';

  // Local storage save as fallback / demonstration
  try {
    const responses = JSON.parse(localStorage.getItem('anniversary_rsvp') || '[]');
    responses.push({
      name: n,
      attending: attending,
      guestCount: guestCount,
      wishes: wishes,
      date: new Date().toISOString()
    });
    localStorage.setItem('anniversary_rsvp', JSON.stringify(responses));
  } catch(err) {
    console.log(err);
  }

  // Display gratitude message
  document.getElementById('rsvpW').style.display = 'none';
  const th = document.getElementById('rsvpThx');
  th.style.display = 'block';
  document.getElementById('thxH').textContent = I18N.thanks.title;
  document.getElementById('thx1').textContent = I18N.thanks.line1;
  document.getElementById('thx2').textContent = I18N.thanks.line2;
  th.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return false;
}
window.sendForm = sendForm;

// Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.scrollToTop = scrollToTop;
