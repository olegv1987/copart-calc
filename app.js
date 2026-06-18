// ============================================================
// app.js — UI logic for the Copart -> Cherkasy cost estimate
// Depends on globals from data.js: YARDS, CARGO_TYPES, FREIGHT, YARD_PORT
// ============================================================

(function () {
  "use strict";

  // ---- Cost configuration ----------------------------------------
  // Extra costs added on top of freight-to-Klaipeda (towing + ocean).
  const COSTS = {
    klaipedaUnloadingEur: 260,          // unloading / forwarder in Klaipeda (EUR)
    cherkasyByType: {                   // road logistics Klaipeda -> Cherkasy (USD)
      regular: 1000,
      large: 1000,
      oversize: 1400,                   // pickup / oversize
    },
    broker: 100,                        // customs broker fee (USD)
    service: 300,                       // owner's import-organization service (USD)
  };

  // Fallback EUR->USD rate used when the live API is unreachable.
  const FALLBACK_EUR_USD = 1.15;

  // ============================================================
  // COPART FEES — licensed-account schedule, Secured Payment.
  // Verified against a real non-clean invoice: $5,500 bid ->
  // buyer $675 + virtual $125 + gate $95 + env $15 + title $20 = $930.
  // Each tier = { upTo: <inclusive upper bound>, fee: <USD> }.
  // The final tier uses { upTo: Infinity, pct: <fraction of price> }.
  // ============================================================

  // Buyer fee — Non-Clean (salvage) Title.
  const BUYER_FEE_NONCLEAN = [
    { upTo: 49.99, fee: 1 },     { upTo: 99.99, fee: 1 },
    { upTo: 199.99, fee: 25 },   { upTo: 299.99, fee: 60 },
    { upTo: 349.99, fee: 85 },   { upTo: 399.99, fee: 100 },
    { upTo: 449.99, fee: 125 },  { upTo: 499.99, fee: 135 },
    { upTo: 549.99, fee: 145 },  { upTo: 599.99, fee: 155 },
    { upTo: 699.99, fee: 170 },  { upTo: 799.99, fee: 195 },
    { upTo: 899.99, fee: 215 },  { upTo: 999.99, fee: 230 },
    { upTo: 1199.99, fee: 250 }, { upTo: 1299.99, fee: 270 },
    { upTo: 1399.99, fee: 285 }, { upTo: 1499.99, fee: 300 },
    { upTo: 1599.99, fee: 315 }, { upTo: 1699.99, fee: 330 },
    { upTo: 1799.99, fee: 350 }, { upTo: 1999.99, fee: 370 },
    { upTo: 2399.99, fee: 390 }, { upTo: 2499.99, fee: 425 },
    { upTo: 2999.99, fee: 460 }, { upTo: 3499.99, fee: 505 },
    { upTo: 3999.99, fee: 555 }, { upTo: 4499.99, fee: 600 },
    { upTo: 4999.99, fee: 625 }, { upTo: 5499.99, fee: 650 },
    { upTo: 5999.99, fee: 675 }, { upTo: 6499.99, fee: 700 },
    { upTo: 6999.99, fee: 720 }, { upTo: 7499.99, fee: 755 },
    { upTo: 7999.99, fee: 775 }, { upTo: 8499.99, fee: 800 },
    { upTo: 8999.99, fee: 820 }, { upTo: 9999.99, fee: 820 },
    { upTo: 10499.99, fee: 850 },{ upTo: 10999.99, fee: 850 },
    { upTo: 11499.99, fee: 850 },{ upTo: 11999.99, fee: 860 },
    { upTo: 12499.99, fee: 875 },{ upTo: 14999.99, fee: 890 },
    { upTo: Infinity, pct: 0.06 },
  ];

  // Buyer fee — Clean Title.
  const BUYER_FEE_CLEAN = [
    { upTo: 49.99, fee: 1 },     { upTo: 99.99, fee: 1 },
    { upTo: 199.99, fee: 25 },   { upTo: 299.99, fee: 50 },
    { upTo: 349.99, fee: 75 },   { upTo: 399.99, fee: 75 },
    { upTo: 449.99, fee: 110 },  { upTo: 499.99, fee: 110 },
    { upTo: 549.99, fee: 125 },  { upTo: 599.99, fee: 130 },
    { upTo: 699.99, fee: 140 },  { upTo: 799.99, fee: 155 },
    { upTo: 899.99, fee: 170 },  { upTo: 999.99, fee: 185 },
    { upTo: 1199.99, fee: 200 }, { upTo: 1299.99, fee: 225 },
    { upTo: 1399.99, fee: 240 }, { upTo: 1499.99, fee: 250 },
    { upTo: 1599.99, fee: 260 }, { upTo: 1699.99, fee: 275 },
    { upTo: 1799.99, fee: 285 }, { upTo: 1999.99, fee: 300 },
    { upTo: 2399.99, fee: 325 }, { upTo: 2499.99, fee: 335 },
    { upTo: 2999.99, fee: 350 }, { upTo: 3499.99, fee: 400 },
    { upTo: 3999.99, fee: 455 }, { upTo: 4499.99, fee: 600 },
    { upTo: 4999.99, fee: 625 }, { upTo: 5499.99, fee: 625 },
    { upTo: 5999.99, fee: 625 }, { upTo: 6499.99, fee: 675 },
    { upTo: 6999.99, fee: 675 }, { upTo: 7499.99, fee: 675 },
    { upTo: 7999.99, fee: 690 }, { upTo: 8499.99, fee: 715 },
    { upTo: 8999.99, fee: 715 }, { upTo: 9999.99, fee: 715 },
    { upTo: 10499.99, fee: 720 },{ upTo: 10999.99, fee: 720 },
    { upTo: 11499.99, fee: 720 },{ upTo: 11999.99, fee: 720 },
    { upTo: 12499.99, fee: 720 },{ upTo: 14999.99, fee: 720 },
    { upTo: Infinity, pct: 0.0575 },
  ];

  // Virtual Bid Fee (Live Bid) — Non-Clean Title.
  const VIRTUAL_BID_NONCLEAN = [
    { upTo: 100, fee: 0 },    { upTo: 500, fee: 50 },
    { upTo: 1000, fee: 65 },  { upTo: 1500, fee: 85 },
    { upTo: 2000, fee: 95 },  { upTo: 4000, fee: 110 },
    { upTo: 6000, fee: 125 }, { upTo: 8000, fee: 145 },
    { upTo: Infinity, fee: 160 },
  ];

  // Virtual Bid Fee (Live Bid) — Clean Title.
  const VIRTUAL_BID_CLEAN = [
    { upTo: 99.99, fee: 0 },    { upTo: 499.99, fee: 49 },
    { upTo: 999.99, fee: 59 },  { upTo: 1499.99, fee: 79 },
    { upTo: 1999.99, fee: 89 }, { upTo: 3999.99, fee: 99 },
    { upTo: 5999.99, fee: 109 },{ upTo: 7999.99, fee: 139 },
    { upTo: Infinity, fee: 149 },
  ];

  // Fixed per-purchase Copart fees (USD).
  const COPART_FIXED = {
    environmental: 15,
    titleFee: 20,        // title pickup / handling
    gateClean: 79,       // gate fee for clean-title vehicles
    gateNonClean: 95,    // gate fee for salvage / non-clean vehicles
  };

  // ---- Timing configuration --------------------------------------
  // Ocean transit per departure port, in weeks [min, max].
  const OCEAN_WEEKS = {
    "NEWARK":           [5, 5],   // Atlantic east coast ("near New York")
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
  const DEFAULT_OCEAN_WEEKS = [8, 10];

  // Other fixed stages (weeks).
  const TO_PORT_WEEKS = { "TORONTO": 2 };   // auction purchase + road to US port
  const DEFAULT_TO_PORT_WEEKS = 1;
  const DISPATCH_WEEKS = 2;                  // loading into container + dispatch
  const UNLOADING_WEEKS = 1;                 // unloading at Klaipeda
  const LOGISTICS_WEEKS = 1;                 // road Klaipeda -> Cherkasy

  // Average weeks per month (52 / 12) for the months estimate.
  const WEEKS_PER_MONTH = 4.345;

  // ---- App state -------------------------------------------------
  const state = {
    yard: null,
    type: CARGO_TYPES[0].id,
    copartPrice: 0,
    cleanTitle: false,
    eurUsd: FALLBACK_EUR_USD,
    fxSource: "приблизний курс",
  };

  // ---- DOM references --------------------------------------------
  const input      = document.getElementById("yard-input");
  const list       = document.getElementById("yard-list");
  const segment    = document.getElementById("type-segment");
  const priceInput = document.getElementById("price-input");
  const cleanCheck = document.getElementById("clean-title");
  const manifest   = document.getElementById("manifest");
  const emptyState = document.getElementById("manifest-empty");
  const yearEl     = document.getElementById("year");

  // ---- Helpers ---------------------------------------------------
  function usd(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function eur(n) { return "\u20AC" + Math.round(n).toLocaleString("en-US"); }
  function usdOrDash(n, show) { return show ? usd(n) : "\u2014"; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function highlight(text, query) {
    const safe = escapeHtml(text);
    if (!query) return safe;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return safe;
    return escapeHtml(text.slice(0, idx)) +
      '<span class="match">' + escapeHtml(text.slice(idx, idx + query.length)) + "</span>" +
      escapeHtml(text.slice(idx + query.length));
  }

  // ---- Copart fee engine -----------------------------------------
  function tierFee(table, price) {
    for (const t of table) {
      if (price <= t.upTo) return typeof t.pct === "number" ? price * t.pct : t.fee;
    }
    return 0;
  }

  // Total Copart commission (all fees combined), for price > 0.
  function copartCommission(price, clean) {
    if (!(price > 0)) return 0;
    const buyer   = tierFee(clean ? BUYER_FEE_CLEAN : BUYER_FEE_NONCLEAN, price);
    const virtual = tierFee(clean ? VIRTUAL_BID_CLEAN : VIRTUAL_BID_NONCLEAN, price);
    const gate    = clean ? COPART_FIXED.gateClean : COPART_FIXED.gateNonClean;
    return buyer + virtual + gate + COPART_FIXED.environmental + COPART_FIXED.titleFee;
  }

  // ---- Exchange rate ---------------------------------------------
  function loadExchangeRate() {
    fetch("https://api.frankfurter.app/latest?from=EUR&to=USD", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const rate = data && data.rates && data.rates.USD;
        if (typeof rate === "number" && rate > 0) {
          state.eurUsd = rate;
          state.fxSource = "ЄЦБ, " + formatDate(data.date);
          render();
        }
      })
      .catch(() => { /* offline / blocked: keep fallback rate */ });
  }

  function formatDate(iso) {
    if (!iso || iso.length < 10) return iso || "";
    const [y, m, d] = iso.split("-");
    return d + "." + m + "." + y;
  }

  // ---- Ports & timing --------------------------------------------
  function portName(raw) {
    const small = { of: 1, the: 1, and: 1 };
    return raw.toLowerCase().split(" ").map((w, i) =>
      (i > 0 && small[w]) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    ).join(" ");
  }

  // Compact weeks label for a route leg: "~5 тиж" / "~7–8 тиж".
  function weeksShort(range) {
    const [a, b] = range;
    const n = a === b ? String(a) : a + "\u2013" + b;
    return "~" + n + " тиж";
  }

  function roundHalf(x) { return Math.round(x * 2) / 2; }

  function monthsLabel(minW, maxW) {
    const lo = roundHalf(minW / WEEKS_PER_MONTH);
    const hi = roundHalf(maxW / WEEKS_PER_MONTH);
    const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    const range = lo === hi ? "\u2248" + fmt(lo) : fmt(lo) + "\u2013" + fmt(hi);
    return range + " " + pluralMonths(hi);
  }
  function pluralMonths(n) {
    const whole = Math.floor(n), m10 = whole % 10, m100 = whole % 100;
    if (m10 === 1 && m100 !== 11) return "місяць";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "місяці";
    return "місяців";
  }

  // Build the timeline stages for a given departure port.
  function timeline(port) {
    const ocean = OCEAN_WEEKS[port] || DEFAULT_OCEAN_WEEKS;
    const toPort = TO_PORT_WEEKS[port] || DEFAULT_TO_PORT_WEEKS;
    const totalMin = toPort + DISPATCH_WEEKS + ocean[0] + UNLOADING_WEEKS + LOGISTICS_WEEKS;
    const totalMax = toPort + DISPATCH_WEEKS + ocean[1] + UNLOADING_WEEKS + LOGISTICS_WEEKS;
    return {
      toPort: [toPort, toPort],
      dispatch: [DISPATCH_WEEKS, DISPATCH_WEEKS],
      ocean: ocean,
      unloading: [UNLOADING_WEEKS, UNLOADING_WEEKS],
      logistics: [LOGISTICS_WEEKS, LOGISTICS_WEEKS],
      months: monthsLabel(totalMin, totalMax),
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
      btn.addEventListener("click", () => { state.type = t.id; syncTypeButtons(); render(); });
      segment.appendChild(btn);
    });
  }
  function syncTypeButtons() {
    segment.querySelectorAll("button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.type === state.type)));
  }

  // ---- Searchable combobox ---------------------------------------
  let activeIndex = -1;
  let filtered = [];

  function openList() { list.classList.add("open"); input.setAttribute("aria-expanded", "true"); }
  function closeList() { list.classList.remove("open"); input.setAttribute("aria-expanded", "false"); activeIndex = -1; }

  function filterYards(query) {
    const q = query.trim().toLowerCase();
    return q ? YARDS.filter((y) => y.toLowerCase().includes(q)) : YARDS.slice();
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
      li.addEventListener("mousedown", (e) => { e.preventDefault(); selectYard(yard); });
      list.appendChild(li);
    });
  }

  function selectYard(yard) { state.yard = yard; input.value = yard; closeList(); render(); }

  function highlightActive() {
    const options = list.querySelectorAll(".combo-option");
    options.forEach((o, i) => o.classList.toggle("active", i === activeIndex));
    if (activeIndex >= 0 && options[activeIndex]) options[activeIndex].scrollIntoView({ block: "nearest" });
  }

  // ---- Result rendering ------------------------------------------
  function render() {
    if (!state.yard || !FREIGHT[state.yard]) {
      manifest.innerHTML = "";
      manifest.appendChild(emptyState);
      removeFxNote();
      return;
    }

    const freight = FREIGHT[state.yard][state.type];
    const typeLabel = CARGO_TYPES.find((t) => t.id === state.type).label;
    const port = YARD_PORT[state.yard] || "";
    const portLabel = port ? portName(port) : "Порт США";
    const t = timeline(port);

    const hasPrice = state.copartPrice > 0;
    const carUsd = hasPrice ? state.copartPrice : 0;
    const commissionUsd = copartCommission(state.copartPrice, state.cleanTitle);

    const klaipedaEur = COSTS.klaipedaUnloadingEur;
    const klaipedaUsd = klaipedaEur * state.eurUsd;
    const cherkasyUsd = COSTS.cherkasyByType[state.type];
    const brokerUsd   = COSTS.broker;
    const serviceUsd  = COSTS.service;

    const grandTotal = carUsd + commissionUsd + freight.total +
      klaipedaUsd + cherkasyUsd + brokerUsd + serviceUsd;

    manifest.innerHTML = `
      <div class="route">
        <div class="node origin">
          <span class="marker"></span>
          <div class="place">${escapeHtml(state.yard)}<small>Площадка Copart</small></div>
          <div class="leg"><span class="mode">🚚</span> Доставка до порту <span class="dur">${weeksShort(t.toPort)}</span></div>
          <div class="leg"><span class="mode">📦</span> Завантаження та відправлення <span class="dur">${weeksShort(t.dispatch)}</span></div>
        </div>
        <div class="node port">
          <span class="marker"></span>
          <div class="place">${escapeHtml(portLabel)}<small>Порт відправлення</small></div>
          <div class="leg"><span class="mode">🚢</span> Морський фрахт <span class="dur">${weeksShort(t.ocean)}</span></div>
        </div>
        <div class="node sea">
          <span class="marker"></span>
          <div class="place">Клайпеда, Литва<small>Порт прибуття</small></div>
          <div class="leg"><span class="mode">⚓</span> Розвантаження <span class="dur">${weeksShort(t.unloading)}</span></div>
          <div class="leg"><span class="mode">🚛</span> Логістика до Черкас <span class="dur">${weeksShort(t.logistics)}</span></div>
        </div>
        <div class="node dest">
          <span class="marker"></span>
          <div class="place">Черкаси, Україна<small>Призначення</small></div>
        </div>
      </div>

      <div class="term">
        <span class="term-label">Орієнтовний термін у дорозі</span>
        <span class="term-val">${t.months}</span>
      </div>

      <div class="breakdown">
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Авто (ціна на Copart)</span>
          <span class="amount">${usdOrDash(carUsd, hasPrice)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Аукціонні збори Copart${state.cleanTitle ? " · clean" : ""}</span>
          <span class="amount">${usdOrDash(commissionUsd, hasPrice)}</span>
        </div>
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
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Супровід та організація імпорту</span>
          <span class="amount">${usd(serviceUsd)}</span>
        </div>
      </div>

      <div class="total-row">
        <span class="tag">Разом<small>${escapeHtml(typeLabel)}</small></span>
        <span class="amount">${usd(grandTotal)}</span>
      </div>
    `;

    renderFxNote();
  }

  function renderFxNote() {
    let note = document.getElementById("fx-note");
    if (!note) {
      note = document.createElement("p");
      note.id = "fx-note";
      note.className = "fx";
      manifest.insertAdjacentElement("afterend", note);
    }
    note.innerHTML = "Курс: €1 = $" + state.eurUsd.toFixed(4) +
      ' <span class="src">(' + escapeHtml(state.fxSource) + ")</span>";
  }
  function removeFxNote() {
    const note = document.getElementById("fx-note");
    if (note) note.remove();
  }

  // ---- Event wiring ----------------------------------------------
  input.addEventListener("focus", () => {
    renderOptions(input.value === state.yard ? "" : input.value);
    openList();
  });
  input.addEventListener("input", () => {
    state.yard = null;
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
      if (activeIndex >= 0 && filtered[activeIndex]) { e.preventDefault(); selectYard(filtered[activeIndex]); }
    } else if (e.key === "Escape") {
      closeList();
    }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".combo")) closeList(); });

  // Purchase price: digits only.
  priceInput.addEventListener("input", () => {
    const digits = priceInput.value.replace(/\D+/g, "");
    if (priceInput.value !== digits) priceInput.value = digits;
    state.copartPrice = digits ? parseInt(digits, 10) : 0;
    render();
  });

  // Clean-title checkbox.
  cleanCheck.addEventListener("change", () => {
    state.cleanTitle = cleanCheck.checked;
    render();
  });

  // ---- Init ------------------------------------------------------
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  buildTypeSegment();
  render();
  loadExchangeRate();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
