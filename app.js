// ============================================================
// app.js — UI logic for the Copart → Klaipeda freight estimate
// Depends on globals from data.js: YARDS, CARGO_TYPES, FREIGHT
// ============================================================

(function () {
  "use strict";

  // ---- App state -------------------------------------------------
  const state = {
    yard: null,          // selected yard name, or null
    type: CARGO_TYPES[0].id, // default to first cargo type
  };

  // ---- DOM references --------------------------------------------
  const input       = document.getElementById("yard-input");
  const list        = document.getElementById("yard-list");
  const segment     = document.getElementById("type-segment");
  const manifest    = document.getElementById("manifest");
  const emptyState  = document.getElementById("manifest-empty");

  // ---- Helpers ---------------------------------------------------

  // Format a number as USD, e.g. 1450 -> "$1,450".
  function usd(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  // Escape user text before inserting into innerHTML.
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
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
      empty.textContent = "No yard matches that search.";
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
    options.forEach((o, i) => {
      o.classList.toggle("active", i === activeIndex);
    });
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

    const data = FREIGHT[state.yard][state.type];
    const typeLabel = CARGO_TYPES.find((t) => t.id === state.type).label;

    // Split "CITY - State" for display.
    const yardName = state.yard;

    manifest.innerHTML = `
      <div class="route">
        <div class="stop origin">
          <div class="dot"></div>
          <div class="place">${escapeHtml(yardName)}<small>Yard</small></div>
        </div>
        <div class="leg road">
          <div class="bar"></div>
          <span class="mode">🚚</span>
        </div>
        <div class="stop port">
          <div class="dot"></div>
          <div class="place">US Port<small>Export</small></div>
        </div>
        <div class="leg sea">
          <div class="bar"></div>
          <span class="mode">🚢</span>
        </div>
        <div class="stop dest">
          <div class="dot"></div>
          <div class="place">Klaipeda<small>Lithuania</small></div>
        </div>
      </div>

      <div class="lines">
        <div class="cost-row road">
          <span class="tag"><span class="swatch"></span>Road haul to port</span>
          <span class="amount">${usd(data.towing)}</span>
        </div>
        <div class="cost-row sea">
          <span class="tag"><span class="swatch"></span>Ocean freight to Klaipeda</span>
          <span class="amount">${usd(data.ocean)}</span>
        </div>
      </div>

      <div class="total-row">
        <span class="tag">To Klaipeda port<small>${escapeHtml(typeLabel)}</small></span>
        <span class="amount">${usd(data.total)}</span>
      </div>
    `;
  }

  // ---- Event wiring ----------------------------------------------
  input.addEventListener("focus", () => {
    renderOptions(input.value === state.yard ? "" : input.value);
    openList();
  });

  input.addEventListener("input", () => {
    // Typing invalidates the previous selection until reconfirmed.
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
  buildTypeSegment();
  render();

  // Register the service worker for offline use (ignored on file://).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline-first is best-effort */ });
    });
  }
})();
