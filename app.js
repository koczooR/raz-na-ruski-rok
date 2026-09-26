/* ──────────────────────────────────────────────────────────────
   Licznik tygodni — logika strony.

   Konfiguracja: obiekt CONFIG poniżej.
   Podgląd bez commita: ?date=2026-06-05&name=Klaudia
   ────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  var CONFIG = {
    // imię osoby, której dotyczy licznik
    name: "Klaudia",

    // data ostatniego pełnego tygodnia w biurze (YYYY-MM-DD) i godzina,
    // od której zaczynamy liczyć — u nas koniec piątku
    lastOfficeDate: "2026-06-05",
    lastOfficeTime: "15:00",

    // opis zakresu pokazywany pod zdjęciem i w akapicie
    rangeLabel: "1–5 czerwca 2026",

    // {name} zostanie podmienione na imię
    headline: "…odkąd {name} była z nami w biurze cały tydzień",

    confettiColors: ["#d8683f", "#f0bf4c", "#4f9d8c", "#e8a0b0", "#2f3b4e"],
    confettiCount: 170,
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

    var date = params.get("date");
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + "T00:00:00"))) {
      config.lastOfficeDate = date;
      config.rangeLabel = formatDate(new Date(date + "T00:00:00"));
    }

    var name = params.get("name");
    if (name) {
      config.name = name.trim().slice(0, 40);
    }

    return config;
  }

  // ── liczenie ────────────────────────────────────────────────

  function startTimestamp(config) {
    var iso = config.lastOfficeDate + "T" + config.lastOfficeTime + ":00";
    var ts = Date.parse(iso);
    // awaryjnie: sama data bez godziny, gdyby lastOfficeTime był zepsuty
    if (!Number.isFinite(ts)) ts = Date.parse(config.lastOfficeDate + "T00:00:00");
    if (!Number.isFinite(ts)) ts = Date.parse("2026-06-05T00:00:00");
    return ts;
  }

  function weeksSince(startMs, nowMs) {
    return Math.floor(Math.max(0, nowMs - startMs) / WEEK_MS);
  }

  // odmiana: 1 tydzień / 2–4 tygodnie / 5+ tygodni (z wyjątkiem 12–14)
  function plWeeks(n) {
    var ones = n % 10;
    var tens = n % 100;
    if (n === 1) return "tydzień";
    if (ones >= 2 && ones <= 4 && !(tens >= 12 && tens <= 14)) return "tygodnie";
    return "tygodni";
  }

  var dateFormatter = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function formatDate(date) {
    return dateFormatter.format(date);
  }

  function isoDate(date) {
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return date.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  // ── renderowanie ────────────────────────────────────────────

  var el = {};

  function cacheElements() {
    ["weeks", "weeks-word", "counter-status", "headline", "caption", "lede-range", "today", "photo", "photo-fallback", "polaroid", "counter-card", "confetti", "toast", "tea"].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function renderStatic(config) {
    var headline = config.headline.replace("{name}", config.name);

    el.headline.textContent = headline;
    el.caption.textContent = config.name + " · " + config.rangeLabel;
    el["lede-range"].textContent = config.rangeLabel;
    el["photo-fallback"].textContent = config.name.charAt(0).toUpperCase();
    el.photo.alt = config.name;
    document.title = "Licznik tygodni — " + config.name;
  }

  function renderCount(config) {
    var now = new Date();
    var weeks = weeksSince(startTimestamp(config), now.getTime());
    var word = plWeeks(weeks);

    el.weeks.textContent = String(weeks);
    el["weeks-word"].textContent = word;
    el["counter-status"].textContent = weeks + " " + word;
    el["counter-card"].setAttribute("aria-label", weeks + " " + word);

    el.today.textContent = formatDate(now);
    el.today.setAttribute("datetime", isoDate(now));
  }

  // ── konfetti ────────────────────────────────────────────────

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stopConfetti = null;

  // Każdy nowy wystrzał przerywa poprzedni. Bez tego seria kliknięć
  // nakładałaby na siebie kolejne pętle animacji.
  function fire(opts) {
    if (reduceMotion || typeof window.confettiBurst !== "function") return;
    if (stopConfetti) stopConfetti();
    stopConfetti = window.confettiBurst(el.confetti, opts);
  }

  // ── toast ───────────────────────────────────────────────────

  var toastTimer = null;

  function say(text, ms) {
    clearTimeout(toastTimer);
    el.toast.textContent = text;
    el.toast.hidden = false;
    // restart animacji wejścia, gdy komunikat zmienia się bez znikania
    el.toast.style.animation = "none";
    void el.toast.offsetWidth;
    el.toast.style.animation = "";
    toastTimer = setTimeout(function () {
      el.toast.hidden = true;
      el.toast.textContent = "";
    }, ms || 3600);
  }

  // ── easter eggi ─────────────────────────────────────────────

  // Podpisy pod zdjęciem, cyklicznie przy kliknięciu. Pierwszy powstaje
  // z CONFIG (imię + zakres), reszta to wymówki.
  var CAPTIONS = [
    "„Dziś się trochę źle czuję”",
    "„Jutro na pewno będę”",
    "„To tylko jeden dzień zdalnie”",
    "„Już mi lepiej, ale nie ryzykuję”",
    "Zdjęcie archiwalne. Nie dotykać.",
  ];

  var TEA_CONFETTI = { colors: ["#a86b3c", "#c89a5b", "#6f8f4e", "#e6d3a8"], shape: "circle", count: 90 };
  var OFFICE_CONFETTI = { colors: ["#d8683f", "#f0bf4c", "#4f9d8c", "#e8a0b0"], count: 260 };
  var REWARD_CONFETTI = { colors: ["#d8683f", "#f0bf4c", "#4f9d8c"], count: 120 };

  var KEY_BUFFER_LEN = 12;
  var SICK_MS = 6000;

  function initEasterEggs(config) {
    var captions = [config.name + " · " + config.rangeLabel].concat(CAPTIONS);
    var photoN = 0;
    var counterN = 0;
    var dateN = 0;
    var typed = "";
    var sickTimer = null;

    // zdjęcie: kolejny podpis i inny przechył za każdym kliknięciem
    function nextCaption() {
      photoN += 1;
      el.caption.textContent = captions[photoN % captions.length];
      el.polaroid.style.setProperty("--rot", (photoN % captions.length === 0 ? -2 : photoN % 2 ? 3 : -4) + "deg");
    }

    el.polaroid.addEventListener("click", nextCaption);
    el.polaroid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextCaption();
      }
    });

    // licznik: nagroda za upór
    el["counter-card"].addEventListener("click", function () {
      counterN += 1;
      if (counterN === 3) say("Kliknięcie nie zeruje licznika. Próbowaliśmy.");
      if (counterN === 7) {
        fire(REWARD_CONFETTI);
        say("Dobra, masz confetti. Ale licznik dalej liczy.");
      }
      if (counterN === 12) {
        say("Jedyny sposób na reset: pięć dni w biurze z rzędu.");
        counterN = 0;
      }
    });

    // „herbata” w akapicie
    el.tea.addEventListener("click", function () {
      fire(TEA_CONFETTI);
      say("Herbata zaparzona. Czeka przy biurku. Jeszcze ciepła.");
    });

    // data w stopce — bez kursora, do znalezienia przypadkiem
    el.today.addEventListener("click", function () {
      dateN += 1;
      if (dateN >= 3) {
        say("Dziś? Pewnie jeden dzień zdalnie.");
        dateN = 0;
      }
    });

    // hasła wpisywane z klawiatury
    window.addEventListener("keydown", function (e) {
      if (!e.key || e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-KEY_BUFFER_LEN);

      if (typed.endsWith("biuro")) {
        fire(OFFICE_CONFETTI);
        say("Wpisanie „biuro” to nie to samo co przyjście do biura. Ale doceniamy.");
      } else if (typed.endsWith("chora")) {
        el.polaroid.classList.add("is-sick");
        say("Tryb L4 włączony. Zdrowiej! Licznik i tak liczy.");
        clearTimeout(sickTimer);
        sickTimer = setTimeout(function () {
          el.polaroid.classList.remove("is-sick");
        }, SICK_MS);
      }
    });
  }

  // ── start ───────────────────────────────────────────────────

  function init() {
    var config = readOverrides(CONFIG);

    cacheElements();
    renderStatic(config);
    renderCount(config);

    // Zdjęcie to assets/klaudia.png. Gdyby pliku zabrakło, pokazujemy
    // zaprojektowany zastępnik zamiast złamanej ikonki.
    function onPhotoError() {
      el.polaroid.classList.add("is-missing");
    }
    el.photo.addEventListener("error", onPhotoError);
    if (el.photo.complete && el.photo.naturalWidth === 0) onPhotoError();

    // licznik odświeża się co minutę, a po powrocie do karty od razu —
    // po wybudzeniu laptopa nie zostaje nieaktualna liczba
    setInterval(function () {
      renderCount(config);
    }, 60000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) renderCount(config);
    });

    fire({ colors: config.confettiColors, count: config.confettiCount });
    initEasterEggs(config);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
