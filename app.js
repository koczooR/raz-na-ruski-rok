/* ──────────────────────────────────────────────────────────────
   Licznik tygodni — logika strony.

   Konfiguracja: obiekt CONFIG poniżej.
   Podgląd bez commita: ?date=2026-06-05&name=Klaudia
   ────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var CONFIG = {
    // imię osoby, której dotyczy licznik
    name: 'Klaudia',

    // data ostatniego pełnego tygodnia w biurze (YYYY-MM-DD) i godzina,
    // od której zaczynamy liczyć — u nas koniec piątku
    lastOfficeDate: '2026-06-05',
    lastOfficeTime: '17:00',

    // opis zakresu pokazywany pod zdjęciem i w akapicie
    rangeLabel: '1–5 czerwca 2026',

    // {name} zostanie podmienione na imię
    headline: '…odkąd {name} była z nami w biurze cały tydzień',

    confettiColors: ['#d8683f', '#f0bf4c', '#4f9d8c', '#e8a0b0', '#2f3b4e'],
    confettiCount: 170
  };

  var WEEK_MS = 604800000; // 7 * 24 * 60 * 60 * 1000

  // ── konfiguracja z adresu URL ───────────────────────────────

  function readOverrides(config) {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return config;
    }

    var date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        Number.isFinite(Date.parse(date + 'T00:00:00'))) {
      config.lastOfficeDate = date;
      config.rangeLabel = formatDate(new Date(date + 'T00:00:00'));
    }

    var name = params.get('name');
    if (name) {
      config.name = name.trim().slice(0, 40);
    }

    return config;
  }

  // ── liczenie ────────────────────────────────────────────────

  function startTimestamp(config) {
    var iso = config.lastOfficeDate + 'T' + config.lastOfficeTime + ':00';
    var ts = Date.parse(iso);
    if (!Number.isFinite(ts)) ts = Date.parse('2026-06-05T17:00:00');
    return ts;
  }

  function weeksSince(startMs, nowMs) {
    return Math.floor(Math.max(0, nowMs - startMs) / WEEK_MS);
  }

  // odmiana: 1 tydzień / 2–4 tygodnie / 5+ tygodni (z wyjątkiem 12–14)
  function plWeeks(n) {
    var ones = n % 10;
    var tens = n % 100;
    if (n === 1) return 'tydzień';
    if (ones >= 2 && ones <= 4 && !(tens >= 12 && tens <= 14)) return 'tygodnie';
    return 'tygodni';
  }

  var dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  function formatDate(date) {
    return dateFormatter.format(date);
  }

  function isoDate(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }

  // ── renderowanie ────────────────────────────────────────────

  var el = {};

  function cacheElements() {
    ['weeks', 'weeks-word', 'counter-status', 'headline', 'caption',
     'lede-range', 'today', 'photo', 'photo-fallback', 'polaroid',
     'counter-card', 'confetti'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function renderStatic(config) {
    var headline = config.headline.replace('{name}', config.name);

    el.headline.textContent = headline;
    el.caption.textContent = config.name + ' · ' + config.rangeLabel;
    el['lede-range'].textContent = config.rangeLabel;
    el['photo-fallback'].textContent = config.name.charAt(0).toUpperCase();
    el.photo.alt = config.name;
    document.title = 'Licznik tygodni — ' + config.name;
  }

  function renderCount(config) {
    var now = new Date();
    var weeks = weeksSince(startTimestamp(config), now.getTime());
    var word = plWeeks(weeks);

    el.weeks.textContent = String(weeks);
    el['weeks-word'].textContent = word;
    el['counter-status'].textContent = weeks + ' ' + word;
    el['counter-card'].setAttribute('aria-label',
      weeks + ' ' + word + ' — kliknij, żeby znowu poleciało konfetti');

    el.today.textContent = formatDate(now);
    el.today.setAttribute('datetime', isoDate(now));
  }

  // ── konfetti ────────────────────────────────────────────────

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var confettiRunning = false;

  function fireConfetti(config) {
    if (reduceMotion || confettiRunning || typeof window.confettiBurst !== 'function') return;
    confettiRunning = true;
    window.confettiBurst(el.confetti, {
      colors: config.confettiColors,
      count: config.confettiCount,
      onDone: function () { confettiRunning = false; }
    });
  }

  // ── start ───────────────────────────────────────────────────

  function init() {
    var config = readOverrides(CONFIG);

    cacheElements();
    renderStatic(config);
    renderCount(config);

    // Zdjęcie: najpierw .jpg, potem .png (asset z designu jest PNG-iem),
    // a gdy nie ma żadnego — zaprojektowany zastępnik zamiast złamanej ikonki.
    var triedPng = false;
    function onPhotoError() {
      if (!triedPng) {
        triedPng = true;
        el.photo.src = 'assets/klaudia.png';
        return;
      }
      el.polaroid.classList.add('is-missing');
    }
    el.photo.addEventListener('error', onPhotoError);
    if (el.photo.complete && el.photo.naturalWidth === 0) onPhotoError();

    // licznik odświeża się co minutę, a po powrocie do karty od razu —
    // po wybudzeniu laptopa nie zostaje nieaktualna liczba
    setInterval(function () { renderCount(config); }, 60000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) renderCount(config);
    });

    fireConfetti(config);
    el['counter-card'].addEventListener('click', function () { fireConfetti(config); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
