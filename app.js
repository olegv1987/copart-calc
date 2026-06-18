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
  // COPART FEES — EDIT THIS BLOCK TO MATCH YOUR ACCOUNT'S TABLES
  // ------------------------------------------------------------
  // SOURCE: public US non-licensed "Secured Payment" schedule (2026).
  // A licensed/dealer account uses LOWER tables (e.g. $5,000 bid ->
  // $675 buyer fee, live bid $125 instead of $775 / $109 below).
  // To match a licensed invoice, replace BUYER_FEE_* and VIRTUAL_BID_LIVE
  // with the exact tables from the member-fees page.
  // Each tier = { upTo: <inclusive upper bound>, fee: <USD> }.
  // The final tier uses { upTo: Infinity, pct: <fraction of price> }.
  // ============================================================

  // Buyer fee — Non-Clean (salvage) Title, Secured Payment.
  const BUYER_FEE_NONCLEAN = [
    { upTo: 49.99, fee: 25 },     { upTo: 99.99, fee: 45 },
    { upTo: 199.99, fee: 80 },    { upTo: 299.99, fee: 130 },
    { upTo: 349.99, fee: 132.5 }, { upTo: 399.99, fee: 135 },
    { upTo: 449.99, fee: 170 },   { upTo: 499.99, fee: 180 },
    { upTo: 549.99, fee: 200 },   { upTo: 599.99, fee: 205 },
    { upTo: 699.99, fee: 235 },   { upTo: 799.99, fee: 260 },
    { upTo: 899.99, fee: 280 },   { upTo: 999.99, fee: 305 },
    { upTo: 1199.99, fee: 355 },  { upTo: 1299.99, fee: 380 },
    { upTo: 1399.99, fee: 400 },  { upTo: 1499.99, fee: 410 },
    { upTo: 1599.99, fee: 420 },  { upTo: 1699.99, fee: 440 },
    { upTo: 1799.99, fee: 450 },  { upTo: 1999.99, fee: 465 },
    { upTo: 2399.99, fee: 500 },  { upTo: 2499.99, fee: 525 },
    { upTo: 2999.99, fee: 550 },  { upTo: 3499.99, fee: 650 },
    { upTo: 3999.99, fee: 700 },  { upTo: 4499.99, fee: 725 },
    { upTo: 4999.99, fee: 750 },  { upTo: 5999.99, fee: 775 },
    { upTo: 6999.99, fee: 800 },  { upTo: 7999.99, fee: 825 },
    { upTo: 9999.99, fee: 850 },  { upTo: 14999.99, fee: 900 },
    { upTo: Infinity, pct: 0.075 },
  ];

  // Buyer fee — Clean Title, Secured Payment.
  // PLACEHOLDER: same as non-clean until the official clean-title table
  // is supplied; clean-title fees are normally a bit lower.
  const BUYER_FEE_CLEAN = BUYER_FEE_NONCLEAN;

  // Virtual Bid Fee — Live Bid (online), by final bid.
  const VIRTUAL_BID_LIVE = [
    { upTo: 99.99, fee: 0 },     { upTo: 499.99, fee: 49 },
    { upTo: 999.99, fee: 59 },   { upTo: 1499.99, fee: 79 },
    { upTo: 1999.99, fee: 89 },  { upTo: 3999.99, fee: 99 },
    { upTo: 5999.99, fee: 109 }, { upTo: 7999.99, fee: 139 },
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
  // Tuned so the total term matches the agreed targets:
  //   Houston/Chicago 2.5 mo, Los Angeles 3 mo, Seattle 3-3.5 mo,
  //   Honolulu 3.5-4 mo. Atlantic ports and Toronto are estimates.
  const OCEAN_WEEKS = {
    "NEWARK":           [6, 8],   // Atlantic east coast (estimate)
    "NORFOLK":          [6, 8],
    "SAVANNAH":         [6, 8],
    "MIAMI":            [6, 8],
    "HOUSTON":          [8, 8],   // Texas -> 2.5 months total
    "CHICAGO":          [8, 8],   // -> 2.5 months total
    "LOS ANGELES":      [10, 10], // California -> 3 months total
    "SEATTLE":          [10, 12], // -> 3-3.5 months total
    "TORONTO":          [9, 11],  // Canada (estimate)
    "PORT OF HONOLULU": [12, 14], // Hawaii -> 3.5-4 months total
  };
  const DEFAULT_OCEAN_WEEKS = [8, 10];

  // Weeks to buy at auction and deliver the car to the US port.
  const TO_PORT_WEEKS = { "TORONTO": 2 };   // Canada inland leg is longer
  const DEFAULT_TO_PORT_WEEKS = 1;

  // Dispatch / vessel loading at the port (weeks), folded into the sea leg.
  const DISPATCH_WEEKS = 2;

  // Average weeks per month (52 / 12) for the months estimate.
  const WEEKS_PER_MONTH = 4.345;

  // ---- App state -------------------------------------------------
  const state = {
    yard: null,
    type: CARGO_TYPES[0].id,
    copartPrice: 0,                     // entered purchase price (USD)
    cleanTitle: false,                  // clean-title checkbox
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
  // Find the matching tier and return its fee for the given price.
  function tierFee(table, price) {
    for (const t of table) {
      if (price <= t.upTo) {
        return typeof t.pct === "number" ? price * t.pct : t.fee;
      }
    }
    return 0;
  }

  // Total Copart commission (all fees combined), for price > 0.
  function copartCommission(price, clean) {
    if (!(price > 0)) return 0;
    const buyer   = tierFee(clean ? BUYER_FEE_CLEAN : BUYER_FEE_NONCLEAN, price);
    const virtual = tierFee(VIRTUAL_BID_LIVE, price);
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
          state.fxSource = "\u0404\u0426\u0411, " + formatDate(data.date);
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

  // Compact weeks label for a route leg: "~10 тиж" / "~12–14 тиж".
  function weeksShort(range) {
    const [a, b] = range;
    const n = a === b ? String(a) : a + "\u2013" + b;
    return "~" + n + " \u0442\u0438\u0436";
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
    if (m10 === 1 && m100 !== 11) return "\u043C\u0456\u0441\u044F\u0446\u044C";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "\u043C\u0456\u0441\u044F\u0446\u0456";
    return "\u043C\u0456\u0441\u044F\u0446\u0456\u0432";
  }

  // Build the timeline for a given departure port.
  function timeline(port) {
    const ocean = OCEAN_WEEKS[port] || DEFAULT_OCEAN_WEEKS;
    const toPort = TO_PORT_WEEKS[port] || DEFAULT_TO_PORT_WEEKS;
    const sea = [DISPATCH_WEEKS + ocean[0], DISPATCH_WEEKS + ocean[1]];
    const totalMin = toPort + sea[0], totalMax = toPort + sea[1];
    return {
      toPort: [toPort, toPort],
      sea: sea,
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
      empty.textContent = "\u041F\u043B\u043E\u0449\u0430\u0434\u043A\u0443 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E.";
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
    const portLabel = port ? portName(port) : "\u041F\u043E\u0440\u0442 \u0421\u0428\u0410";
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
          <div class="place">${escapeHtml(state.yard)}<small>\u041F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 Copart</small></div>
          <div class="leg"><span class="mode">\uD83D\uDE9A</span> \u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u0434\u043E \u043F\u043E\u0440\u0442\u0443 <span class="dur">${weeksShort(t.toPort)}</span></div>
        </div>
        <div class="node port">
          <span class="marker"></span>
          <div class="place">${escapeHtml(portLabel)}<small>\u041F\u043E\u0440\u0442 \u0432\u0456\u0434\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044F</small></div>
          <div class="leg"><span class="mode">\uD83D\uDEA2</span> \u041C\u043E\u0440\u0441\u044C\u043A\u0438\u0439 \u0444\u0440\u0430\u0445\u0442 <span class="dur">${weeksShort(t.sea)}</span></div>
        </div>
        <div class="node sea">
          <span class="marker"></span>
          <div class="place">\u041A\u043B\u0430\u0439\u043F\u0435\u0434\u0430, \u041B\u0438\u0442\u0432\u0430<small>\u0420\u043E\u0437\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F</small></div>
          <div class="leg"><span class="mode">\uD83D\uDE9B</span> \u041B\u043E\u0433\u0456\u0441\u0442\u0438\u043A\u0430 \u0434\u043E \u0427\u0435\u0440\u043A\u0430\u0441</div>
        </div>
        <div class="node dest">
          <span class="marker"></span>
          <div class="place">\u0427\u0435\u0440\u043A\u0430\u0441\u0438, \u0423\u043A\u0440\u0430\u0457\u043D\u0430<small>\u041F\u0440\u0438\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F</small></div>
        </div>
      </div>

      <div class="term">
        <span class="term-label">\u041E\u0440\u0456\u0454\u043D\u0442\u043E\u0432\u043D\u0438\u0439 \u0442\u0435\u0440\u043C\u0456\u043D \u0443 \u0434\u043E\u0440\u043E\u0437\u0456</span>
        <span class="term-val">${t.months}</span>
      </div>

      <div class="breakdown">
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u0410\u0432\u0442\u043E (\u0446\u0456\u043D\u0430 \u043D\u0430 Copart)</span>
          <span class="amount">${usdOrDash(carUsd, hasPrice)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u0410\u0443\u043A\u0446\u0456\u043E\u043D\u043D\u0456 \u0437\u0431\u043E\u0440\u0438 Copart${state.cleanTitle ? " \u00B7 clean" : ""}</span>
          <span class="amount">${usdOrDash(commissionUsd, hasPrice)}</span>
        </div>
        <div class="b-row road">
          <span class="tag"><span class="swatch"></span>\u0414\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u0434\u043E \u043F\u043E\u0440\u0442\u0443 (${escapeHtml(portLabel)})</span>
          <span class="amount">${usd(freight.towing)}</span>
        </div>
        <div class="b-row sea">
          <span class="tag"><span class="swatch"></span>\u041C\u043E\u0440\u0441\u044C\u043A\u0438\u0439 \u0444\u0440\u0430\u0445\u0442 \u0434\u043E \u041A\u043B\u0430\u0439\u043F\u0435\u0434\u0438</span>
          <span class="amount">${usd(freight.ocean)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u0420\u043E\u0437\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F / \u0435\u043A\u0441\u043F\u0435\u0434\u0438\u0442\u043E\u0440 (\u041A\u043B\u0430\u0439\u043F\u0435\u0434\u0430)</span>
          <span class="amount">${eur(klaipedaEur)}<span class="eur">&asymp; ${usd(klaipedaUsd)}</span></span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u041B\u043E\u0433\u0456\u0441\u0442\u0438\u043A\u0430 \u0434\u043E \u0427\u0435\u0440\u043A\u0430\u0441</span>
          <span class="amount">${usd(cherkasyUsd)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u0411\u0440\u043E\u043A\u0435\u0440\u0441\u044C\u043A\u0456 \u043F\u043E\u0441\u043B\u0443\u0433\u0438</span>
          <span class="amount">${usd(brokerUsd)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>\u0421\u0443\u043F\u0440\u043E\u0432\u0456\u0434 \u0442\u0430 \u043E\u0440\u0433\u0430\u043D\u0456\u0437\u0430\u0446\u0456\u044F \u0456\u043C\u043F\u043E\u0440\u0442\u0443</span>
          <span class="amount">${usd(serviceUsd)}</span>
        </div>
      </div>

      <div class="total-row">
        <span class="tag">\u0420\u0430\u0437\u043E\u043C<small>${escapeHtml(typeLabel)}</small></span>
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
    note.innerHTML = "\u041A\u0443\u0440\u0441: \u20AC1 = $" + state.eurUsd.toFixed(4) +
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
