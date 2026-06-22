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
      motorcycle: 550,                  // motorcycle
      atv: 550,                         // ATV (same as motorcycle by default)
      jetski: 1000,                     // jet ski (like a car / sedan)
    },
    broker: 100,                        // customs broker fee (USD)
    service: 300,                       // owner's import-organization service (USD)
  };

  // Fallback EUR->USD rate used when the live API is unreachable.
  const FALLBACK_EUR_USD = 1.15;

  // Money-transfer commission on (car + Copart fees + delivery to Klaipeda).
  const TRANSFER_PCT = 0.04;
  const TRANSFER_FIXED = 4;

  // Ukrainian customs clearance (2026 rules).
  const CUSTOMS = {
    deliveryAdd: 1600,   // amount customs adds to the value for delivery (USD)
    deliveryAddMoto: 800,// same, for motorcycles
    dutyRate: 0.10,      // import duty: 10% of customs value
    vatRate: 0.20,       // VAT: 20%
    // Excise base rates in EUR by fuel and engine-size threshold (cm3).
    excise: {
      petrol: { threshold: 3000, low: 50, high: 100 },
      diesel: { threshold: 3500, low: 75, high: 150 },
    },
    // Motorcycle excise: fixed EUR per cm3, no age coefficient.
    motoExcise: [
      { upTo: 500, perCc: 0.062 },
      { upTo: 800, perCc: 0.443 },
      { upTo: Infinity, perCc: 0.447 },
    ],
    ageMin: 1, ageMax: 15,
  };

  // Engine-volume input bounds (litres).
  const VOL_MIN = 0.6, VOL_MAX = 8.5, VOL_STEP = 0.1, VOL_DEFAULT = 2.0;
  // Motorcycle displacement bounds (litres).
  const CC_MIN = 0.1, CC_MAX = 2.5, CC_STEP = 0.1, CC_DEFAULT = 0.8;
  // ATV (quadricycle) displacement bounds (litres).
  const ATV_CC_MIN = 0.1, ATV_CC_MAX = 2.0, ATV_CC_STEP = 0.1, ATV_CC_DEFAULT = 1.0;
  const CURRENT_YEAR = new Date().getFullYear();

  // Copart bid increments by current bid value (USD). The +/- on the price
  // field steps by the increment for the current band.
  const BID_INCREMENTS = [
    { upTo: 9.99, step: 1 },
    { upTo: 99.99, step: 10 },
    { upTo: 999.99, step: 25 },
    { upTo: 4999.99, step: 50 },
    { upTo: 24999.99, step: 100 },
    { upTo: Infinity, step: 250 },
  ];
  function bidStep(price) {
    for (const b of BID_INCREMENTS) if (price <= b.upTo) return b.step;
    return 250;
  }

  // localStorage key for persisting user settings.
  const STORE_KEY = "copartCalc.v1";

  // Default purchase price by transport type: cars 5000, other tech 3000.
  const CAR_TYPES = ["regular"];
  function defaultPrice(type) { return CAR_TYPES.includes(type) ? 5000 : 3000; }

  // Car body size -> freight/cherkasy key and display label.
  function carSizeLabel(size) {
    return size === "large" ? "Кросовер" : size === "oversize" ? "Пікап" : "Седан";
  }

  // Battery-capacity input bounds (kWh) for electric cars.
  const BATT_MIN = 10, BATT_MAX = 250, BATT_DEFAULT = 82;
  const YEAR_MIN = 1980;

  // Dangerous-goods surcharges for electric or hybrid vehicles.
  const DANGEROUS_OCEAN_USD = 150;     // added to ocean freight
  const DANGEROUS_KLAIPEDA_EUR = 50;   // added to Klaipeda unloading

  // Electric excise: EUR per kWh of battery capacity.
  const EV_EXCISE_EUR_PER_KWH = 1;

  // Display overrides for departure port names.
  const PORT_DISPLAY = { "NEWARK": "New York" };

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

  // Buyer fee — CrashedToys (motorcycles / powersports), Secured Payment.
  // Verified against a CrashedToys invoice: $4,250 bid -> buyer $710.
  const BUYER_FEE_CRASHEDTOYS = [
    { upTo: 49.99, fee: 30 },    { upTo: 99.99, fee: 45 },
    { upTo: 199.99, fee: 70 },   { upTo: 299.99, fee: 105 },
    { upTo: 349.99, fee: 130 },  { upTo: 399.99, fee: 132.5 },
    { upTo: 449.99, fee: 145 },  { upTo: 499.99, fee: 150 },
    { upTo: 549.99, fee: 165 },  { upTo: 599.99, fee: 170 },
    { upTo: 699.99, fee: 190 },  { upTo: 799.99, fee: 225 },
    { upTo: 899.99, fee: 250 },  { upTo: 999.99, fee: 270 },
    { upTo: 1199.99, fee: 300 }, { upTo: 1299.99, fee: 335 },
    { upTo: 1399.99, fee: 335 }, { upTo: 1499.99, fee: 360 },
    { upTo: 1599.99, fee: 370 }, { upTo: 1699.99, fee: 400 },
    { upTo: 1799.99, fee: 415 }, { upTo: 1999.99, fee: 465 },
    { upTo: 2399.99, fee: 500 }, { upTo: 2499.99, fee: 510 },
    { upTo: 2999.99, fee: 570 }, { upTo: 3499.99, fee: 695 },
    { upTo: 3999.99, fee: 710 }, { upTo: 4499.99, fee: 710 },
    { upTo: 4999.99, fee: 720 }, { upTo: 5499.99, fee: 780 },
    { upTo: 5999.99, fee: 815 }, { upTo: 6499.99, fee: 850 },
    { upTo: 6999.99, fee: 880 }, { upTo: 7499.99, fee: 900 },
    { upTo: 7999.99, fee: 1020 },{ upTo: 8999.99, fee: 1025 },
    { upTo: 9999.99, fee: 1050 },{ upTo: Infinity, pct: 0.105 },
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
    carSize: "regular",                 // car body: regular | large | oversize
    copartPrice: 5000,                  // default car price
    priceIsDefault: true,              // true until the user edits the price
    cleanTitle: false,
    fuel: "petrol",                     // "petrol" | "diesel" | "electric"
    hybrid: false,                      // hybrid flag (petrol/diesel only)
    engineVol: VOL_DEFAULT,             // litres
    batteryKwh: BATT_DEFAULT,           // kWh (electric only)
    year: CURRENT_YEAR - 5,             // year of manufacture (car)
    crashedToys: true,                  // CrashedToys auction (moto/ATV), default on
    bigMoto: false,                     // large motorcycle
    motoCc: CC_DEFAULT,                 // motorcycle displacement (litres)
    atvCc: ATV_CC_DEFAULT,              // ATV displacement (litres)
    atvYear: CURRENT_YEAR - 5,          // ATV year of manufacture
    jetskiTrailer: false,               // jet ski shipped with trailer
    hiddenMode: false,                  // hidden: drop transfer fee + service fee
    eurUsd: FALLBACK_EUR_USD,
    fxSource: "приблизний курс",
  };

  // ---- DOM references --------------------------------------------
  const input      = document.getElementById("yard-input");
  const list       = document.getElementById("yard-list");
  const segment    = document.getElementById("type-segment");
  const priceInput = document.getElementById("price-input");
  const priceMinus = document.getElementById("price-minus");
  const pricePlus  = document.getElementById("price-plus");
  const cleanCheck = document.getElementById("clean-title");
  const carsizeGroup = document.getElementById("carsize-group");
  const sizeLarge    = document.getElementById("size-large");
  const sizeOversize = document.getElementById("size-oversize");
  const fuelSeg    = document.getElementById("fuel-segment");
  const hybridCheck= document.getElementById("hybrid");
  const volInput   = document.getElementById("vol-input");
  const volMinus   = document.getElementById("vol-minus");
  const volPlus    = document.getElementById("vol-plus");
  const yearInput  = document.getElementById("year-input");
  const yearMinus  = document.getElementById("year-minus");
  const yearPlus   = document.getElementById("year-plus");
  const battInput  = document.getElementById("batt-input");
  const battMinus  = document.getElementById("batt-minus");
  const battPlus   = document.getElementById("batt-plus");
  const combustionGroup = document.getElementById("combustion-group");
  const electricGroup   = document.getElementById("electric-group");
  const motoGroup       = document.getElementById("moto-group");
  const cleantitleField = document.getElementById("cleantitle-field");
  const powertrainField = document.getElementById("powertrain-field");
  const crashedCheck    = document.getElementById("crashedtoys");
  const bigMotoCheck    = document.getElementById("big-moto");
  const ccInput   = document.getElementById("cc-input");
  const ccMinus   = document.getElementById("cc-minus");
  const ccPlus    = document.getElementById("cc-plus");
  const atvGroup       = document.getElementById("atv-group");
  const atvCrashed     = document.getElementById("atv-crashedtoys");
  const atvCcInput = document.getElementById("atv-cc-input");
  const atvCcMinus = document.getElementById("atv-cc-minus");
  const atvCcPlus  = document.getElementById("atv-cc-plus");
  const atvYearInput = document.getElementById("atv-year-input");
  const atvYearMinus = document.getElementById("atv-year-minus");
  const atvYearPlus  = document.getElementById("atv-year-plus");
  const jetskiGroup    = document.getElementById("jetski-group");
  const jetskiTrailer  = document.getElementById("jetski-trailer");
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
  // opts: { moto, crashedToys, clean }
  function copartCommission(price, opts) {
    if (!(price > 0)) return 0;
    let buyer, virtual, gate;
    if (opts.powersport && opts.crashedToys) {
      // CrashedToys (motorcycles / ATVs): same fees regardless of title.
      buyer = tierFee(BUYER_FEE_CRASHEDTOYS, price);
      virtual = tierFee(VIRTUAL_BID_NONCLEAN, price);
      gate = COPART_FIXED.gateNonClean;
    } else {
      // Cars and non-CrashedToys powersports: clean vs non-clean.
      buyer = tierFee(opts.clean ? BUYER_FEE_CLEAN : BUYER_FEE_NONCLEAN, price);
      virtual = tierFee(opts.clean ? VIRTUAL_BID_CLEAN : VIRTUAL_BID_NONCLEAN, price);
      gate = opts.clean ? COPART_FIXED.gateClean : COPART_FIXED.gateNonClean;
    }
    return buyer + virtual + gate + COPART_FIXED.environmental + COPART_FIXED.titleFee;
  }

  // ---- Money transfer & customs ----------------------------------
  // Commission for wiring money for (car + Copart fees + delivery to Klaipeda).
  function transferFee(car, commission, deliveryToKlaipeda) {
    const base = car + commission + deliveryToKlaipeda;
    return Math.ceil(base * TRANSFER_PCT + TRANSFER_FIXED);
  }

  // Excise age coefficient: full years since manufacture, clamped to [1, 15].
  function ageCoef(year) {
    const age = CURRENT_YEAR - year;
    return Math.min(CUSTOMS.ageMax, Math.max(CUSTOMS.ageMin, age));
  }

  // Excise base rate in EUR by fuel type and engine volume (litres).
  function exciseRateEur(fuel, volL) {
    const cfg = CUSTOMS.excise[fuel] || CUSTOMS.excise.petrol;
    return volL * 1000 <= cfg.threshold ? cfg.low : cfg.high;
  }

  // Motorcycle excise rate (EUR per cm3) by displacement.
  function motoExcisePerCc(cc) {
    for (const t of CUSTOMS.motoExcise) if (cc <= t.upTo) return t.perCc;
    return 0.447;
  }

  // Ukrainian customs clearance, returned in USD (excise also kept in EUR).
  // opts: { moto, electric, fuel, volL, ccL, year, batteryKwh, car, commission, eurUsd }
  function customs(opts) {
    const add = (opts.moto || opts.atv || opts.jetski) ? CUSTOMS.deliveryAddMoto : CUSTOMS.deliveryAdd;
    const value = opts.car + opts.commission + add;
    let duty, exciseEur;
    if (opts.moto) {
      duty = value * CUSTOMS.dutyRate;
      const cc = opts.ccL * 1000;
      exciseEur = motoExcisePerCc(cc) * cc;          // no age coefficient
    } else if (opts.atv) {
      // ATV is classified under HS 8703 (taxed like a petrol car).
      duty = value * CUSTOMS.dutyRate;
      exciseEur = exciseRateEur("petrol", opts.volL) * opts.volL * ageCoef(opts.year);
    } else if (opts.jetski) {
      // Jet ski / personal watercraft (HS 8903): duty + VAT, no excise.
      duty = value * CUSTOMS.dutyRate;
      exciseEur = 0;
    } else if (opts.electric) {
      duty = 0;
      exciseEur = EV_EXCISE_EUR_PER_KWH * opts.batteryKwh;
    } else {
      duty = value * CUSTOMS.dutyRate;
      exciseEur = exciseRateEur(opts.fuel, opts.volL) * opts.volL * ageCoef(opts.year);
    }
    const exciseUsd = exciseEur * opts.eurUsd;
    const vat = (value + duty + exciseUsd) * CUSTOMS.vatRate;
    return { value, duty, exciseEur, exciseUsd, vat, total: duty + exciseUsd + vat };
  }

  // Clamp + format engine volume (keeps cc precision when typed manually).
  function clampVol(v) {
    if (!(v > 0)) v = VOL_DEFAULT;
    return Math.min(VOL_MAX, Math.max(VOL_MIN, v));
  }
  function formatVol(v) {
    return Number.isInteger(v * 10) ? v.toFixed(1) : String(Math.round(v * 1000) / 1000);
  }
  function clampBatt(v) {
    if (!(v > 0)) v = BATT_DEFAULT;
    return Math.min(BATT_MAX, Math.max(BATT_MIN, Math.round(v)));
  }
  function clampYear(v) {
    let y = Math.round(v);
    if (!(y >= YEAR_MIN)) y = YEAR_MIN;
    if (y > CURRENT_YEAR) y = CURRENT_YEAR;
    return y;
  }
  function clampCc(v) {
    if (!(v > 0)) v = CC_DEFAULT;
    return Math.min(CC_MAX, Math.max(CC_MIN, v));
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
      btn.addEventListener("click", () => {
        state.type = t.id;
        if (state.priceIsDefault) {
          state.copartPrice = defaultPrice(t.id);
          priceInput.value = String(state.copartPrice);
        }
        syncTypeButtons();
        updateControlVisibility();
        render();
        if (t.id === "jetski") registerSecretTap();
      });
      segment.appendChild(btn);
    });
  }
  // Show the right controls for car (combustion/electric) vs motorcycle.
  // For moto/ATV the CrashedToys checkbox comes first, then clean-title;
  // for cars/jet ski the clean-title sits in its original top position.
  function placeCleanTitle() {
    if (state.type === "motorcycle") {
      motoGroup.insertBefore(cleantitleField, motoGroup.children[1] || null);
    } else if (state.type === "atv") {
      atvGroup.insertBefore(cleantitleField, atvGroup.children[1] || null);
    } else {
      powertrainField.parentNode.insertBefore(cleantitleField, powertrainField);
    }
  }

  function updateControlVisibility() {
    placeCleanTitle();
    const moto = state.type === "motorcycle";
    const atv = state.type === "atv";
    const jetski = state.type === "jetski";
    const powersport = moto || atv;
    const car = state.type === "regular";
    const ev = car && state.fuel === "electric";
    // Title matters for cars and jet skis; for powersports only when NOT CrashedToys.
    const showClean = powersport ? !state.crashedToys : true;
    if (carsizeGroup) carsizeGroup.style.display = car ? "grid" : "none";
    if (cleantitleField) cleantitleField.style.display = showClean ? "block" : "none";
    if (powertrainField) powertrainField.style.display = car ? "block" : "none";
    if (combustionGroup) combustionGroup.style.display = (car && !ev) ? "block" : "none";
    if (electricGroup) electricGroup.style.display = ev ? "block" : "none";
    if (motoGroup) motoGroup.style.display = moto ? "block" : "none";
    if (atvGroup) atvGroup.style.display = atv ? "block" : "none";
    if (jetskiGroup) jetskiGroup.style.display = jetski ? "block" : "none";
    // Sync the body-size and CrashedToys checkboxes with state.
    if (sizeLarge) sizeLarge.checked = state.carSize === "large";
    if (sizeOversize) sizeOversize.checked = state.carSize === "oversize";
    if (crashedCheck) crashedCheck.checked = state.crashedToys;
    if (atvCrashed) atvCrashed.checked = state.crashedToys;
  }
  function syncTypeButtons() {
    segment.querySelectorAll("button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.type === state.type)));
  }

  // ---- Fuel-type segmented control -------------------------------
  const FUEL_TYPES = [
    { id: "petrol", label: "Бензин" },
    { id: "diesel", label: "Дизель" },
    { id: "electric", label: "Електро" },
  ];
  function buildFuelSegment() {
    FUEL_TYPES.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = f.label;
      btn.dataset.fuel = f.id;
      btn.setAttribute("aria-pressed", String(f.id === state.fuel));
      btn.addEventListener("click", () => {
        state.fuel = f.id;
        fuelSeg.querySelectorAll("button").forEach((b) =>
          b.setAttribute("aria-pressed", String(b.dataset.fuel === state.fuel)));
        updateControlVisibility();
        render();
      });
      fuelSeg.appendChild(btn);
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
    saveState();
    if (!state.yard || !FREIGHT[state.yard]) {
      manifest.innerHTML = "";
      manifest.appendChild(emptyState);
      removeFxNote();
      return;
    }

    const isMoto = state.type === "motorcycle";
    const isAtv = state.type === "atv";
    const isJetski = state.type === "jetski";
    const isPowersport = isMoto || isAtv;
    const isCar = state.type === "regular";
    const freightKey = isMoto ? (state.bigMoto ? "moto_large" : "moto")
      : isAtv ? "atv"
      : isJetski ? (state.jetskiTrailer ? "jetski_trailer" : "jetski")
      : state.carSize;
    let freight = FREIGHT[state.yard][freightKey];
    let freightApprox = false;
    if (!freight) {
      // No specific tariff for this yard: fall back to the car (regular) rate.
      freight = FREIGHT[state.yard].regular;
      freightApprox = true;
    }

    const typeLabel = isCar ? carSizeLabel(state.carSize)
      : CARGO_TYPES.find((t) => t.id === state.type).label;
    const port = YARD_PORT[state.yard] || "";
    const portLabel = port ? (PORT_DISPLAY[port] || portName(port)) : "Порт США";
    const isCanada = port === "TORONTO";
    const t = timeline(port);

    // Electric or hybrid (cars only) ship as dangerous goods (battery).
    const isElectric = isCar && state.fuel === "electric";
    const isDangerous = isCar && (isElectric || state.hybrid);

    const hasPrice = state.copartPrice > 0;
    const carUsd = hasPrice ? state.copartPrice : 0;
    const commissionUsd = copartCommission(state.copartPrice, {
      powersport: isPowersport, crashedToys: state.crashedToys, clean: state.cleanTitle,
    });

    const towingUsd = freight.towing;
    const oceanUsd = freight.ocean + (isDangerous ? DANGEROUS_OCEAN_USD : 0);
    const deliveryToKlaipeda = towingUsd + oceanUsd;

    const klaipedaEur = COSTS.klaipedaUnloadingEur + (isDangerous ? DANGEROUS_KLAIPEDA_EUR : 0);
    const klaipedaUsd = klaipedaEur * state.eurUsd;
    const cherkasyUsd = COSTS.cherkasyByType[isCar ? state.carSize : state.type];
    const brokerUsd   = COSTS.broker;
    const serviceUsd  = state.hiddenMode ? 0 : COSTS.service;

    // Money-transfer commission and customs only apply once a price is set.
    const transferUsd = (hasPrice && !state.hiddenMode) ? transferFee(carUsd, commissionUsd, deliveryToKlaipeda) : 0;
    const cust = hasPrice
      ? customs({
          moto: isMoto, atv: isAtv, jetski: isJetski, electric: isElectric, fuel: state.fuel,
          volL: isAtv ? state.atvCc : state.engineVol, ccL: state.motoCc,
          year: isAtv ? state.atvYear : state.year,
          batteryKwh: state.batteryKwh, car: carUsd, commission: commissionUsd,
          eurUsd: state.eurUsd,
        })
      : null;
    const customsUsd = cust ? cust.total : 0;

    const grandTotal = carUsd + commissionUsd + transferUsd + deliveryToKlaipeda +
      klaipedaUsd + cherkasyUsd + customsUsd + brokerUsd + serviceUsd;

    const customsSub = cust
      ? (isJetski
          ? `Мито ${usd(cust.duty)} \u00B7 без акцизу \u00B7 ПДВ ${usd(cust.vat)}`
          : `Мито ${usd(cust.duty)} \u00B7 Акциз ${eur(cust.exciseEur)} (&asymp;${usd(cust.exciseUsd)}) \u00B7 ПДВ ${usd(cust.vat)}`)
      : "введіть ціну покупки";

    const powertrain = isPowersport
      ? (isMoto && state.bigMoto ? " · великий" : "") + (state.crashedToys ? " · CrashedToys" : "")
      : isJetski ? (state.jetskiTrailer ? " · з причепом" : "")
      : (isElectric ? " · електро" : (state.hybrid ? " · гібрид" : ""));
    const priceLabel = (isMoto ? "Мотоцикл" : isAtv ? "Квадроцикл" : isJetski ? "Гідроцикл" : "Авто") + " (ціна на Copart)";
    const commissionLabel = "Аукціонні збори" +
      (isPowersport ? (state.crashedToys ? " CrashedToys" : " Copart")
                    : " Copart" + (state.cleanTitle ? " · clean" : ""));
    const oceanTag = "Морський фрахт до Клайпеди" + (isDangerous ? " (+$150 небезп.)" : "");
    const klaipedaTag = "Розвантаження / експедитор (Клайпеда" + (isDangerous ? ", +€50)" : ")");

    // Notes shown under the towing/ocean rows.
    let freightNotes = "";
    if (freightApprox) {
      freightNotes += `<div class="b-note">Тариф приблизний: для цієї площадки немає мото-тарифу, узято легковий.</div>`;
    }
    if (isCanada) {
      freightNotes += `<div class="b-note">Канада: тарифи на сушу й океан орієнтовні, можлива неточність. Можливі додаткові податки.</div>`;
    }
    if (isJetski && state.jetskiTrailer) {
      freightNotes += `<div class="b-note">З причепом: можлива додаткова плата за розвантаження причепа в Клайпеді. Причеп розмитнюється окремо.</div>`;
    }

    manifest.innerHTML = `
      <div class="summary">
        <div class="summary-main">
          <span class="summary-label">Разом</span>
          <span class="summary-total">${usd(grandTotal)}</span>
        </div>
        <div class="summary-sub">${escapeHtml(typeLabel)}${powertrain} \u00B7 ${t.months} у дорозі</div>
      </div>

      <div class="breakdown">
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>${priceLabel}</span>
          <span class="amount">${usdOrDash(carUsd, hasPrice)}</span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>${commissionLabel}</span>
          <span class="amount">${usdOrDash(commissionUsd, hasPrice)}</span>
        </div>
        <div class="b-row road">
          <span class="tag"><span class="swatch"></span>Доставка до порту (${escapeHtml(portLabel)})</span>
          <span class="amount">${usd(towingUsd)}</span>
        </div>
        <div class="b-row sea">
          <span class="tag"><span class="swatch"></span>${oceanTag}</span>
          <span class="amount">${usd(oceanUsd)}</span>
        </div>
        ${freightNotes}
        ${state.hiddenMode ? "" : `<div class="b-row">
          <span class="tag"><span class="swatch"></span>Комісія за переказ коштів</span>
          <span class="amount">${usdOrDash(transferUsd, hasPrice)}</span>
        </div>`}
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>${klaipedaTag}</span>
          <span class="amount">${eur(klaipedaEur)}<span class="eur">&asymp; ${usd(klaipedaUsd)}</span></span>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Логістика до Черкас</span>
          <span class="amount">${usd(cherkasyUsd)}</span>
        </div>
        <div class="b-row col">
          <div class="b-line">
            <span class="tag"><span class="swatch"></span>Розмитнення (мито, акциз, ПДВ)</span>
            <span class="amount">${usdOrDash(customsUsd, hasPrice)}</span>
          </div>
          <div class="sub">${customsSub}</div>
        </div>
        <div class="b-row">
          <span class="tag"><span class="swatch"></span>Брокерські послуги</span>
          <span class="amount">${usd(brokerUsd)}</span>
        </div>
        ${state.hiddenMode ? "" : `<div class="b-row">
          <span class="tag"><span class="swatch"></span>Супровід та організація імпорту</span>
          <span class="amount">${usd(serviceUsd)}</span>
        </div>`}
      </div>

      <div class="route">
        <div class="node origin">
          <span class="marker"></span>
          <div class="place">${escapeHtml(state.yard)}<small>Площадка Copart</small></div>
          <div class="leg"><span class="mode">🚚</span> Доставка до порту <span class="dur">${weeksShort(t.toPort)}</span></div>
          <div class="leg"><span class="mode">📦</span> Завантаження та відправлення <span class="dur">${weeksShort(t.dispatch)}</span></div>
        </div>
        <div class="node port">
          <span class="marker"></span>
          <div class="place">${escapeHtml(portLabel)}<small>${isCanada ? "Порт відправлення · Канада" : "Порт відправлення"}</small></div>
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
  // On focus, clear the field so the user can type fresh (as if nothing
  // was selected); remember the current pick to restore on blur if needed.
  let prevYard = null;
  input.addEventListener("focus", () => {
    prevYard = state.yard;
    input.value = "";
    renderOptions("");
    openList();
  });
  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (state.yard) { input.value = state.yard; }
      else if (prevYard) { state.yard = prevYard; input.value = prevYard; render(); }
    }, 180);
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

  // Purchase price: digits only + stepper using Copart bid increments.
  function setPrice(v) {
    state.copartPrice = Math.max(0, Math.round(v));
    state.priceIsDefault = false;
    priceInput.value = state.copartPrice ? String(state.copartPrice) : "";
    render();
  }
  priceInput.addEventListener("input", () => {
    const digits = priceInput.value.replace(/\D+/g, "");
    if (priceInput.value !== digits) priceInput.value = digits;
    state.copartPrice = digits ? parseInt(digits, 10) : 0;
    state.priceIsDefault = false;
    render();
  });
  pricePlus.addEventListener("click", () => setPrice(state.copartPrice + bidStep(state.copartPrice)));
  priceMinus.addEventListener("click", () => setPrice(state.copartPrice - bidStep(Math.max(0, state.copartPrice - 1))));
  // On focus clear the field; on blur restore the previous value if unchanged.
  let prevPrice = null;
  priceInput.addEventListener("focus", () => {
    prevPrice = state.copartPrice;
    priceInput.value = "";
  });
  priceInput.addEventListener("blur", () => {
    const digits = priceInput.value.replace(/\D+/g, "");
    if (!digits) {
      state.copartPrice = prevPrice;
      priceInput.value = prevPrice ? String(prevPrice) : "";
      render();
    }
  });

  // Clean-title checkbox.
  cleanCheck.addEventListener("change", () => {
    state.cleanTitle = cleanCheck.checked;
    render();
  });

  // Car body size: two mutually-exclusive checkboxes (off/off = sedan).
  sizeLarge.addEventListener("change", () => {
    state.carSize = sizeLarge.checked ? "large" : "regular";
    updateControlVisibility();
    render();
  });
  sizeOversize.addEventListener("change", () => {
    state.carSize = sizeOversize.checked ? "oversize" : "regular";
    updateControlVisibility();
    render();
  });

  // Hybrid checkbox (petrol/diesel only).
  hybridCheck.addEventListener("change", () => {
    state.hybrid = hybridCheck.checked;
    render();
  });

  // Engine volume: stepper buttons + manual entry (cc precision).
  function setVol(v) {
    state.engineVol = clampVol(v);
    volInput.value = formatVol(state.engineVol);
    render();
  }
  volMinus.addEventListener("click", () => setVol(Math.round((state.engineVol - VOL_STEP) * 10) / 10));
  volPlus.addEventListener("click", () => setVol(Math.round((state.engineVol + VOL_STEP) * 10) / 10));
  volInput.addEventListener("input", () => {
    const v = parseFloat(volInput.value.replace(",", "."));
    if (v > 0) { state.engineVol = v; render(); }   // clamp on blur, not mid-typing
  });
  volInput.addEventListener("blur", () => setVol(parseFloat(volInput.value.replace(",", "."))));

  // Year of manufacture: stepper buttons (step 1) + manual entry.
  function setYear(v) {
    state.year = clampYear(v);
    yearInput.value = String(state.year);
    render();
  }
  yearMinus.addEventListener("click", () => setYear(state.year - 1));
  yearPlus.addEventListener("click", () => setYear(state.year + 1));
  yearInput.addEventListener("input", () => {
    const digits = yearInput.value.replace(/\D+/g, "").slice(0, 4);
    if (yearInput.value !== digits) yearInput.value = digits;
    const y = parseInt(digits, 10);
    if (y >= YEAR_MIN && y <= CURRENT_YEAR) { state.year = y; render(); }
  });
  yearInput.addEventListener("blur", () => setYear(parseInt(yearInput.value, 10)));

  // Battery capacity: stepper buttons (step 1 kWh) + manual entry.
  function setBatt(v) {
    state.batteryKwh = clampBatt(v);
    battInput.value = String(state.batteryKwh);
    render();
  }
  battMinus.addEventListener("click", () => setBatt(state.batteryKwh - 1));
  battPlus.addEventListener("click", () => setBatt(state.batteryKwh + 1));
  battInput.addEventListener("input", () => {
    const digits = battInput.value.replace(/\D+/g, "");
    if (battInput.value !== digits) battInput.value = digits;
    const v = parseInt(digits, 10);
    if (v > 0) { state.batteryKwh = v; render(); }
  });
  battInput.addEventListener("blur", () => setBatt(parseInt(battInput.value, 10)));

  // Motorcycle: CrashedToys + large-moto checkboxes.
  crashedCheck.addEventListener("change", () => { state.crashedToys = crashedCheck.checked; updateControlVisibility(); render(); });
  bigMotoCheck.addEventListener("change", () => { state.bigMoto = bigMotoCheck.checked; render(); });

  // Motorcycle displacement: stepper + manual entry (cc precision).
  function setCc(v) {
    state.motoCc = clampCc(v);
    ccInput.value = formatVol(state.motoCc);
    render();
  }
  ccMinus.addEventListener("click", () => setCc(Math.round((state.motoCc - CC_STEP) * 10) / 10));
  ccPlus.addEventListener("click", () => setCc(Math.round((state.motoCc + CC_STEP) * 10) / 10));
  ccInput.addEventListener("input", () => {
    const v = parseFloat(ccInput.value.replace(",", "."));
    if (v > 0) { state.motoCc = v; render(); }
  });
  ccInput.addEventListener("blur", () => setCc(parseFloat(ccInput.value.replace(",", "."))));

  // ATV: CrashedToys (shared flag), displacement, year of manufacture.
  atvCrashed.addEventListener("change", () => { state.crashedToys = atvCrashed.checked; updateControlVisibility(); render(); });
  function setAtvCc(v) {
    if (!(v > 0)) v = ATV_CC_DEFAULT;
    state.atvCc = Math.min(ATV_CC_MAX, Math.max(ATV_CC_MIN, v));
    atvCcInput.value = formatVol(state.atvCc);
    render();
  }
  atvCcMinus.addEventListener("click", () => setAtvCc(Math.round((state.atvCc - ATV_CC_STEP) * 10) / 10));
  atvCcPlus.addEventListener("click", () => setAtvCc(Math.round((state.atvCc + ATV_CC_STEP) * 10) / 10));
  atvCcInput.addEventListener("input", () => {
    const v = parseFloat(atvCcInput.value.replace(",", "."));
    if (v > 0) { state.atvCc = v; render(); }
  });
  atvCcInput.addEventListener("blur", () => setAtvCc(parseFloat(atvCcInput.value.replace(",", "."))));
  function setAtvYear(v) {
    state.atvYear = clampYear(v);
    atvYearInput.value = String(state.atvYear);
    render();
  }
  atvYearMinus.addEventListener("click", () => setAtvYear(state.atvYear - 1));
  atvYearPlus.addEventListener("click", () => setAtvYear(state.atvYear + 1));
  atvYearInput.addEventListener("input", () => {
    const digits = atvYearInput.value.replace(/\D+/g, "").slice(0, 4);
    if (atvYearInput.value !== digits) atvYearInput.value = digits;
    const y = parseInt(digits, 10);
    if (y >= YEAR_MIN && y <= CURRENT_YEAR) { state.atvYear = y; render(); }
  });
  atvYearInput.addEventListener("blur", () => setAtvYear(parseInt(atvYearInput.value, 10)));

  // Jet ski: shipped with trailer (switches freight variant).
  jetskiTrailer.addEventListener("change", () => { state.jetskiTrailer = jetskiTrailer.checked; render(); });

  // Hidden toggle: 5 taps on the "Гідроцикл" type button within 5 seconds
  // drops the money-transfer commission and the service fee.
  let secretTaps = [];
  function registerSecretTap() {
    const now = Date.now();
    secretTaps = secretTaps.filter((ts) => now - ts < 5000);
    secretTaps.push(now);
    if (secretTaps.length >= 5) {
      secretTaps = [];
      state.hiddenMode = !state.hiddenMode;
      render();
      showToast(state.hiddenMode ? "Режим без комісій: увімкнено" : "Режим без комісій: вимкнено");
    }
  }
  let toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ---- Persistence (localStorage) --------------------------------
  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        yard: state.yard, type: state.type, carSize: state.carSize,
        copartPrice: state.copartPrice, priceIsDefault: state.priceIsDefault,
        cleanTitle: state.cleanTitle, fuel: state.fuel, hybrid: state.hybrid,
        engineVol: state.engineVol, batteryKwh: state.batteryKwh, year: state.year,
        crashedToys: state.crashedToys, bigMoto: state.bigMoto, motoCc: state.motoCc,
        atvCc: state.atvCc, atvYear: state.atvYear, jetskiTrailer: state.jetskiTrailer,
        hiddenMode: state.hiddenMode,
      }));
    } catch (e) { /* private mode / quota — ignore */ }
  }
  function loadState() {
    let s;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return; }
    if (!s || typeof s !== "object") return;
    const bool = (v) => typeof v === "boolean";
    const num = (v) => typeof v === "number" && isFinite(v);
    if (typeof s.yard === "string" && FREIGHT[s.yard]) state.yard = s.yard;
    if (CARGO_TYPES.some((t) => t.id === s.type)) state.type = s.type;
    if (["regular", "large", "oversize"].includes(s.carSize)) state.carSize = s.carSize;
    if (num(s.copartPrice) && s.copartPrice >= 0) state.copartPrice = Math.round(s.copartPrice);
    if (bool(s.priceIsDefault)) state.priceIsDefault = s.priceIsDefault;
    if (bool(s.cleanTitle)) state.cleanTitle = s.cleanTitle;
    if (["petrol", "diesel", "electric"].includes(s.fuel)) state.fuel = s.fuel;
    if (bool(s.hybrid)) state.hybrid = s.hybrid;
    if (num(s.engineVol)) state.engineVol = clampVol(s.engineVol);
    if (num(s.batteryKwh)) state.batteryKwh = clampBatt(s.batteryKwh);
    if (num(s.year)) state.year = clampYear(s.year);
    if (bool(s.crashedToys)) state.crashedToys = s.crashedToys;
    if (bool(s.bigMoto)) state.bigMoto = s.bigMoto;
    if (num(s.motoCc)) state.motoCc = clampCc(s.motoCc);
    if (num(s.atvCc)) state.atvCc = Math.min(ATV_CC_MAX, Math.max(ATV_CC_MIN, s.atvCc));
    if (num(s.atvYear)) state.atvYear = clampYear(s.atvYear);
    if (bool(s.jetskiTrailer)) state.jetskiTrailer = s.jetskiTrailer;
    if (bool(s.hiddenMode)) state.hiddenMode = s.hiddenMode;
  }

  // ---- Init ------------------------------------------------------
  // Block iOS pinch-zoom gestures (double-tap zoom handled by CSS
  // touch-action: manipulation, which keeps fast taps working as clicks).
  ["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  loadState();
  buildTypeSegment();
  buildFuelSegment();
  input.value = state.yard || "";
  priceInput.value = state.copartPrice ? String(state.copartPrice) : "";
  volInput.value = formatVol(state.engineVol);
  yearInput.value = String(state.year);
  battInput.value = String(state.batteryKwh);
  ccInput.value = formatVol(state.motoCc);
  atvCcInput.value = formatVol(state.atvCc);
  atvYearInput.value = String(state.atvYear);
  cleanCheck.checked = state.cleanTitle;
  hybridCheck.checked = state.hybrid;
  bigMotoCheck.checked = state.bigMoto;
  jetskiTrailer.checked = state.jetskiTrailer;
  updateControlVisibility();
  render();
  loadExchangeRate();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
