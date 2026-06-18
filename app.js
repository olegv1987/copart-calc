// ============================================================
// app.js — UI logic for the Copart → Cherkasy cost estimate
// Depends on globals from data.js: YARDS, CARGO_TYPES, FREIGHT
// ============================================================

(function () {
  "use strict";

  // ---- Cost configuration ----------------------------------------
  // Extra costs added on top of freight-to-Klaipeda (towing + ocean).
  const COSTS = {
    klaipedaUnloadingEur: 260,          // unloading / forwarder in Klaipeda, billed in EUR
    cherkasyByType: {                   // road logistics Klaipeda -> Cherkasy, by vehicle type
      regular: 1000,
      large: 1000,
      oversize: 1400,                   // pickup / oversize
    },
    broker: 100,                        // customs broker fee
  };

  // Fallback EUR->USD rate used when the live API is unreachable
  // (e.g. offline). Approximate ECB rate as of 2026-06-18.
  const FALLBACK_EUR_USD = 1.15;

  // ---- Timing configuration --------------------------------------
  // Ocean transit by departure port, in weeks. [min, max].
  const OCEAN_WEEKS = {
    "NEWARK":           [5, 5],   // near Atlantic ports ("like New York")
    "NORFOLK":          [5, 5],
    "SAVANNAH":         [5, 5],
    "MIAMI":            [5, 5],
    "HOUSTON":          [6, 6],
    "CHICAGO":          [6, 6],
    "LOS ANGELES":      [7, 8],
    "SEATTLE":          [8, 10],
    "TORONTO":          [8, 10],  // Canada
    "PORT OF HONOLULU": [12, 12], // Hawaii, Honolulu
  };
  const DEFAULT_OCEAN_WEEKS = [6, 8];

  // Weeks to buy at auction and deliver the car to the US port.
  // Canada (Toronto) feeds a distant port, so its inland leg is longer.
  const TO_PORT_WEEKS = { "TORONTO": 2 };
  const DEFAULT_TO_PORT_WEEKS = 1;

  // Dispatch / vessel loading at the port (weeks), constant.
  const DISPATCH_WEEKS = 2;

  // Average weeks per month (52 / 12) for the months estimate.
  const WEEKS_PER_MONTH = 4.345;

  // Frankfurter: ECB reference rates, HTTPS, CORS-enabled, no API key.
  const FX_URL = "https://api.frankfurter.app/latest?from=EUR&to=USD";

  // ---- App state -------------------------------------------------
  const state = {
    yard: null,                         // selected yard name, or null
    type: CARGO_TYPES[0].id,            // default to first cargo type
    eurUsd: FALLBACK_EUR_USD,           // current EUR->USD rate
    fxSource: "приблизний курс",        // label describing the rate source
  };

  // ---- DOM references --------------------------------------------
  const input      = document.getElementById("yard-input");
  const list       = document.getElementById("yard-list");
  const segment    = document.getElementById("type-segment");
  const manifest   = document.getElementById("manifest");
  const emptyState = document.getElementById("manifest-empty");
  const yearEl     = document.getElementById("year");

  // ---- Helpers ---------------------------------------------------

  // Format a number as USD, e.g. 1450 -> "$1,450".
  function usd(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  // Format a number as EUR, e.g. 260 -> "€260".
  function eur(n) {
    return "€" + Math.round(n).toLocaleString("en-US");
  }

  // Escape user text before inserting into innerHTML.
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Wrap the matched query substring in <span class="match"> for display.
  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return safe;
    const before = escapeHtml(text.slice(0, idx));
    const hit    = escapeHtml(text.slice(idx, idx + query.length));
    const after  = escapeHtml(text.slice(idx + query.length));
    return before + '<span class="match">' + hit + "</span>" + after;
  }

  // ---- Exchange rate ---------------------------------------------
  // Fetch the live EUR->USD rate; on failure keep the fallback.
  function loadExchangeRate() {
    fetch(FX_URL, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const rate = data && data.rates && data.rates.USD;
        if (typeof rate === "number" && rate > 0) {
          state.eurUsd = rate;
          // data.date is the ECB reference date (YYYY-MM-DD)
          state.fxSource = "ЄЦБ, " + formatDate(data.date);
          render();
        }
      })
      .catch(() => { /* offline / blocked: keep fallback rate */ });
  }

  // Convert "YYYY-MM-DD" to "DD.MM.YYYY".
  function formatDate(iso) {
    if (!iso || iso.length < 10) return iso || "";
    const [y, m, d] = iso.split("-");
    return d + "." + m + "." + y;
  }

  // ---- Ports & timing --------------------------------------------

  // Title-case a port name, keeping small words lowercase.
  // "PORT OF HONOLULU" -> "Port of Honolulu", "LOS ANGELES" -> "Los Angeles".
  function portName(raw) {
    const small = { of: 1, the: 1, and: 1 };
    return raw.toLowerCase().split(" ").map((w, i) => {
      if (i > 0 && small[w]) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(" ");
  }

  // Format a [min, max] week range: "5 тижнів" or "8–10 тижнів".
  function weeks(range) {
    const [a, b] = range;
    const n = a === b ? String(a) : a + "\u2013" + b;
    return n + " " + pluralWeeks(b);
  }
  function pluralWeeks(n) {
    // Ukrainian plural: тиждень / тижні / тижнів
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "тиждень";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "тижні";
    return "тижнів";
  }

  // Round to the nearest half (0.5).
  function roundHalf(x) { return Math.round(x * 2) / 2; }

  // Format months: "≈2 місяці" or "2.5–3 місяці".
  function monthsLabel(minW, maxW) {
    const lo = roundHalf(minW / WEEKS_PER_MONTH);
    const hi = roundHalf(maxW / WEEKS_PER_MONTH);
    const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    const range = lo === hi ? "\u2248" + fmt(lo) : fmt(lo) + "\u2013" + fmt(hi);
    return range + " " + pluralMonths(hi);
  }
  function pluralMonths(n) {
    const whole = Math.floor(n);
    const m10 = whole % 10, m100 = whole % 100;
    if (m10 === 1 && m100 !== 11) return "місяць";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "місяці";
    return "місяців";
  }

  // Compute the full timeline for a given departure port.
  function timeline(port) {
    const ocean = OCEAN_WEEKS[port] || DEFAULT_OCEAN_WEEKS;
    const toPort = TO_PORT_WEEKS[port] || DEFAULT_TO_PORT_WEEKS;
    const minW = toPort + DISPATCH_WEEKS + ocean[0];
    const maxW = toPort + DISPATCH_WEEKS + ocean[1];
    return {
      toPort: [toPort, toPort],
      dispatch: [DISPATCH_WEEKS, DISPATCH_WEEKS],
      ocean: ocean,
      totalMonths: monthsLabel(minW, maxW),
    };
  }

  // ---- Cargo-type segmented control ------------------------------
  function buildTypeSegment() {
    CARGO_TYPES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t.label;
      btn.dataset.type = t.id;
      btn.setAttribute("aria-pressed", String(t.id === state.type));
      btn.addEventListener("click", () => {
        state.type = t.id;
        syncTypeButtons();
        render();
      });
      segment.appendChild(btn);
    });
  }

  function syncTypeButtons() {
    segment.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.type === state.type));
    });
  }

  // ---- Searchable combobox ---------------------------------------
  let activeIndex = -1;   // keyboard-highlighted option index
  let filtered = [];      // current filtered yard list

  function openList() {
    list.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  }
  function closeList() {
    list.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  // Case-insensitive substring filter over yard names.
  function filterYards(query) {
    const q = query.trim().toLowerCase();
    if (!q) return YARDS.slice();
    return YARDS.filter((y) => y.toLowerCase().includes(q));
  }

  function renderOptions(query) {
    filtered = filterYards(query);
    list.innerHTML = "";

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "combo-empty";
      empty.textContent = "Площадку не знайдено.";
      list.appendChild(empty);
      return;
    }

    filtered.forEach((yard, i) => {
      const li = document.createElement("li");
      li.className = "combo-option";
      li.setAttribute("role", "option");
      li.dataset.index = String(i);
      li.innerHTML = highlight(yard, query);
      li.addEventListener("mousedown", (e) => {
        // mousedown (not click) so it fires before input blur closes the list
        e.preventDefault();
        selectYard(yard);
      });
      list.appendChild(li);
    });
  }

  function selectYard(yard) {
    state.yard = yard;
    input.value = yard;
    closeList();
    render();
  }

  function highlightActive() {
    const options = list.querySelectorAll(".combo-option");
    options.forEach((o, i) => o.classList.toggle("active", i === activeIndex));
    if (activeIndex >= 0 && options[activeIndex]) {
      options[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  // ---- Result rendering ------------------------------------------
  function render() {
    if (!state.yard || !FREIGHT[state.yard]) {
      manifest.innerHTML = "";
      manifest.appendChild(emptyState);
      return;
    }

    const freight = FREIGHT[state.yard][state.type];
    const typeLabel = CARGO_TYPES.find((t) => t.id === state.type).label;
    const port = YARD_PORT[state.yard] || "";
    const portLabel = port ? portName(port) : "Порт США";
    const t = timeline(port);

    // Cost components (all converted to USD for the grand total).
    const klaipedaEur = COSTS.klaipedaUnloadingEur;
    const klaipedaUsd = klaipedaEur * state.eurUsd;
    const cherkasyUsd = COSTS.cherkasyByType[state.type];
    const brokerUsd   = COSTS.broker;

    const grandTotal =
      freight.total + klaipedaUsd + cherkasyUsd + brokerUsd;

    manifest.innerHTML = `
      <div class="route">
        <div class="node origin">
          <span class="marker"></span>
          <div class="place">${escapeHtml(state.yard)}<small>Площадка Copart</small></div>
          <div class="leg"><span class="mode">🚚</span> Доставка до порту</div>
        </div>
        <div class="node port">
          <span class="marker"></span>
          <div class="place">${escapeHtml(portLabel)}<small>Порт відправлення</small></div>
          <div class="leg"><span class="mode">🚢</span> Морський фрахт</div>
        </div>
        <div class="node sea">
          <span class="marker"></span>
          <div class="place">Клайпеда, Литва<small>Розвантаження</small></div>
          <div class="leg"><span class="mode">🚛</span> Логістика до Черкас</div>
        </div>
        <div class="node dest">
          <span class="marker"></span>
          <div class="place">Черкаси, Україна<small>Призначення</small></div>
        </div>
      </div>

      <div class="breakdown">
        <div class="b-row road">
          <span class="tag"><span class="swatch"></span>Доставка до порту (${escapeHtml(portLabel)})</span>
          <span class="amount">${usd(freight.towing)}</span>
        </div>
        <div class="b-row sea">
          <span class="tag"><span class="swatch"></span>Морський фрахт до Клайпеди</span>
          <span class="amount">${usd(freight.ocean)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Розвантаження / експедитор (Клайпеда)</span>
          <span class="amount">${eur(klaipedaEur)}<span class="eur">&asymp; ${usd(klaipedaUsd)}</span></span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Логістика до Черкас</span>
          <span class="amount">${usd(cherkasyUsd)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Брокерські послуги</span>
          <span class="amount">${usd(brokerUsd)}</span>
        </div>
      </div>

      <div class="total-row">
        <span class="tag">Разом<small>${escapeHtml(typeLabel)}</small></span>
        <span class="amount">${usd(grandTotal)}</span>
      </div>

      <div class="timeline">
        <div class="tl-head">Орієнтовні терміни</div>
        <div class="tl-row">
          <span class="tag">Купівля та доставка в порт</span>
          <span class="dur">${weeks(t.toPort)}</span>
        </div>
        <div class="tl-row">
          <span class="tag">Відправлення (завантаження)</span>
          <span class="dur">${weeks(t.dispatch)}</span>
        </div>
        <div class="tl-row">
          <span class="tag">Морський фрахт (${escapeHtml(portLabel)})</span>
          <span class="dur">${weeks(t.ocean)}</span>
        </div>
        <div class="tl-total">
          <span class="tag">Загальний термін</span>
          <span class="dur">${t.totalMonths}</span>
        </div>
      </div>
    `;

    // Append the exchange-rate note after the manifest card.
    renderFxNote();
  }

  // Show which EUR->USD rate was used and where it came from.
  function renderFxNote() {
    let note = document.getElementById("fx-note");
    if (!note) {
      note = document.createElement("p");
      note.id = "fx-note";
      note.className = "fx";
      manifest.insertAdjacentElement("afterend", note);
    }
    note.innerHTML =
      "Курс: €1 = $" + state.eurUsd.toFixed(4) +
      ' <span class="src">(' + escapeHtml(state.fxSource) + ")</span>";
  }

  // ---- Event wiring ----------------------------------------------
  input.addEventListener("focus", () => {
    renderOptions(input.value === state.yard ? "" : input.value);
    openList();
  });

  input.addEventListener("input", () => {
    state.yard = null;   // typing invalidates the previous selection
    activeIndex = -1;
    renderOptions(input.value);
    openList();
    render();
  });

  input.addEventListener("keydown", (e) => {
    const options = list.querySelectorAll(".combo-option");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!list.classList.contains("open")) { renderOptions(input.value); openList(); }
      activeIndex = Math.min(activeIndex + 1, options.length - 1);
      highlightActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlightActive();
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        selectYard(filtered[activeIndex]);
      }
    } else if (e.key === "Escape") {
      closeList();
    }
  });

  // Close the list when focus/click leaves the combobox.
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".combo")) closeList();
  });

  // ---- Init ------------------------------------------------------
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  buildTypeSegment();
  render();
  loadExchangeRate();

  // Register the service worker for offline use (ignored on file://).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline-first is best-effort */ });
    });
  }
})();
