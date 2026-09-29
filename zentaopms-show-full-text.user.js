// ==UserScript==
// @name         ZenTao Show Full Text
// @namespace    local.codex.zentao
// @version      1.1.1
// @description  Show long project/product names and provide page-local Bug product filtering and column layout.
// @author       xiakezhen, Codex
// @license      MIT
// @homepageURL  https://github.com/xialangji-debug/zentao-show-full-text
// @supportURL   https://github.com/xialangji-debug/zentao-show-full-text/issues
// @updateURL    https://raw.githubusercontent.com/xialangji-debug/zentao-show-full-text/main/zentaopms-show-full-text.user.js
// @downloadURL  https://raw.githubusercontent.com/xialangji-debug/zentao-show-full-text/main/zentaopms-show-full-text.user.js
// @match        *://zentao.hzyuelan.com/*
// @match        *://*/zentao/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==
(function () {
  "use strict";

  const STYLE_ID = "tm-zentao-full-text-style";
  const LAYOUT_STYLE_ID = "tm-zentao-bug-layout-style";
  const FILTER_ID = "tm-zentao-product-filter-item";
  const SETTINGS_ID = "tm-zentao-column-settings-item";
  const FILTER_KEY = "tm-zentao-product-filter-value";
  const LAYOUT_KEY = "tm-zentao-bug-column-layout-v1";
  const BUG_ONLY_COLUMNS = new Set(["severity", "type", "openedBy", "confirmed", "deadline", "resolvedBy", "resolution"]);
  const COLUMN_CONFIG = {
    severity: { label: "严重程度", min: 64, max: 180 },
    pri: { label: "优先级", min: 56, max: 160 },
    type: { label: "Bug类型", min: 64, max: 180 },
    productName: { label: "所属产品", min: 100, max: 420 },
    openedBy: { label: "创建者", min: 64, max: 180 },
    confirmed: { label: "是否确认", min: 64, max: 180 },
    deadline: { label: "截止日期", min: 72, max: 180 },
    resolvedBy: { label: "解决者", min: 64, max: 180 },
    resolution: { label: "解决方案", min: 64, max: 180 },
  };

  const CSS = `
    .tm-zentao-switcher { flex: 0 1 auto !important; width: max-content !important; min-width: 0 !important;
      max-width: 100% !important; overflow: visible !important; }
    .tm-zentao-trigger { width: max-content !important; max-width: 100% !important; min-width: 0 !important;
      height: auto !important; white-space: normal !important; }
    .tm-zentao-trigger .text { display: block !important; width: auto !important; max-width: none !important;
      min-width: 0 !important; overflow: visible !important; flex: 1 1 auto !important;
      text-overflow: clip !important; white-space: normal !important; overflow-wrap: anywhere !important; }
    .tm-zentao-popup { box-sizing: border-box !important; width: max-content !important;
      max-width: calc(100vw - 24px) !important; }
    .tm-zentao-popup .dropmenu-list { max-width: 100% !important; overflow-x: hidden !important; }
    .tm-zentao-popup .tree-item { height: auto !important; min-height: 34px !important;
      max-height: none !important; }
    .tm-zentao-popup .dropmenu-item, .tm-zentao-popup .tree-item-inner {
      box-sizing: border-box !important; width: 100% !important; height: auto !important;
      min-height: 34px !important; max-height: none !important; }
    .tm-zentao-popup .item-title, .tm-zentao-popup .item-content,
    .tm-zentao-popup .label, .tm-zentao-popup .text {
      min-width: 0 !important; max-width: 100% !important; height: auto !important;
      flex-shrink: 1 !important; -webkit-line-clamp: unset !important;
      overflow: visible !important; text-overflow: clip !important;
      white-space: normal !important; overflow-wrap: anywhere !important; }
    #${FILTER_ID} { display: inline-flex; align-items: center; margin-left: 8px; }
    #${FILTER_ID} label { display: inline-flex; align-items: center; gap: 6px; }
    #${FILTER_ID} select { max-width: min(260px, 36vw); }
    #${FILTER_ID} small { color: #666; white-space: nowrap; }
    .tm-zentao-bug-table .tm-zentao-filter-hidden { visibility: hidden !important;
      pointer-events: none !important; }
    #${SETTINGS_ID} { position: fixed; right: 12px; bottom: 12px; z-index: 10000;
      font: 13px/1.4 Arial, "Microsoft YaHei", sans-serif; }
    #${SETTINGS_ID} button { cursor: pointer; }
    #${SETTINGS_ID} > button { padding: 5px 10px; border: 1px solid #2680d9;
      border-radius: 4px; background: #2680d9; color: white; }
    #${SETTINGS_ID} .tm-zentao-panel { position: absolute; right: 0; bottom: 36px;
      box-sizing: border-box; width: min(340px, calc(100vw - 24px)); max-height: 70vh;
      overflow: auto; padding: 12px; border: 1px solid #ccd4dd; border-radius: 6px;
      background: #fff; color: #222; box-shadow: 0 6px 24px #0003; }
    #${SETTINGS_ID} [hidden] { display: none !important; }
    #${SETTINGS_ID} .tm-zentao-row { display: grid; grid-template-columns: minmax(0, 1fr) 72px 26px 26px;
      align-items: center; gap: 5px; margin: 5px 0; }
    #${SETTINGS_ID} .tm-zentao-row input { box-sizing: border-box; width: 72px; }
    #${SETTINGS_ID} .tm-zentao-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
  `;

  function storageFor(view) {
    try { return view.localStorage; } catch (_) { return null; }
  }

  function textOf(element) {
    return (element?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  function enhanceProjectMenus(doc) {
    for (const root of doc.querySelectorAll("#dropmenu, #switcher, [z-use-dropmenu], [data-fetcher*='product-ajaxGetDropMenu'], [data-fetcher*='project-ajaxGetDropMenu'], [data-fetcher*='execution-ajaxGetDropMenu']")) {
      const trigger = root.querySelector(".dropmenu-btn, .pick, button");
      if (!trigger) continue;
      root.classList.add("tm-zentao-switcher");
      trigger.classList.add("tm-zentao-trigger");
      const label = trigger.querySelector(".text") || trigger;
      const name = textOf(label);
      if (name && label.title !== name) label.title = name;
    }
    for (const popup of doc.querySelectorAll("#pick-pop-dropmenu-menu, #pick-pop-switcher")) {
      popup.classList.add("tm-zentao-popup");
      for (const label of popup.querySelectorAll(".item-title, .item-content, .label, .dropmenu-item .text")) {
        const name = textOf(label);
        if (name && label.title !== name) label.title = name;
      }
    }
  }

  function bugTable(doc) {
    const table = doc.querySelector("#bugs.dtable, #table-my-work.dtable");
    if (!table) return null;
    const headers = Array.from(table.querySelectorAll('.dtable-cell[data-row="HEADER"][data-col]'));
    const keys = new Set(headers.map((cell) => cell.dataset.col));
    const bugSpecificCount = Array.from(BUG_ONLY_COLUMNS).filter((key) => keys.has(key)).length;
    const isBugRoute = /(?:^|[/-])bug(?:-|\/|$)/i.test(doc.defaultView?.location?.pathname || "");
    return bugSpecificCount >= 2 && (table.id === "bugs" || isBugRoute || keys.has("productName")) ? { table, headers } : null;
  }

  function clearBugUi(doc) {
    doc.getElementById(FILTER_ID)?.remove();
    doc.getElementById(SETTINGS_ID)?.remove();
    doc.getElementById(LAYOUT_STYLE_ID)?.remove();
    doc.querySelector(".tm-zentao-bug-table")?.classList.remove("tm-zentao-bug-table");
  }

  function productRows(table) {
    const products = new Map();
    const rows = new Map();
    for (const cell of table.querySelectorAll('.dtable-cell[data-col="productName"][data-row]:not([data-row="HEADER"])')) {
      const row = cell.dataset.row;
      const product = textOf(cell.querySelector(".dtable-cell-content") || cell);
      if (!row || !product) continue;
      rows.set(row, product);
      products.set(product, (products.get(product) || 0) + 1);
    }
    return { rows, products };
  }

  function applyProductFilter(doc, view, table) {
    const { rows, products } = productRows(table);
    const nav = doc.querySelector("#featureBar menu.nav, #featureBar .nav");
    let item = doc.getElementById(FILTER_ID);
    if (!nav || !rows.size) {
      item?.remove();
      return;
    }
    if (!item) {
      item = doc.createElement("li");
      item.id = FILTER_ID;
      item.innerHTML = '<label>所属产品 <select aria-label="所属产品，本页筛选"></select></label><small></small>';
      nav.insertBefore(item, nav.querySelector(".search-form-toggle")?.closest("li") || null);
      item.querySelector("select").addEventListener("change", (event) => {
        try {
          if (event.target.value) storageFor(view)?.setItem(FILTER_KEY, event.target.value);
          else storageFor(view)?.removeItem(FILTER_KEY);
        } catch (_) {}
        const current = bugTable(doc);
        if (current) applyProductFilter(doc, view, current.table);
      });
    }
    const select = item.querySelector("select");
    const names = Array.from(products.keys()).sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
    const signature = names.map((name) => `${name}:${products.get(name)}`).join("|");
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      const all = new Option(`全部产品 (${rows.size})`, "");
      select.add(all);
      for (const name of names) select.add(new Option(`${name} (${products.get(name)})`, name));
      select.dataset.signature = signature;
    }
    let saved = "";
    try { saved = storageFor(view)?.getItem(FILTER_KEY) || ""; } catch (_) {}
    const selected = products.has(saved) ? saved : "";
    select.value = selected;
    for (const cell of table.querySelectorAll('.dtable-cell[data-row]:not([data-row="HEADER"])')) {
      const product = rows.get(cell.dataset.row);
      cell.classList.toggle("tm-zentao-filter-hidden", Boolean(product && selected && product !== selected));
    }
    const countText = selected ? `本页 ${products.get(selected)}/${rows.size}` : `本页 ${rows.size}`;
    const count = item.querySelector("small");
    if (count.textContent !== countText) count.textContent = countText;
  }

  function nativeColumns(headers) {
    const columns = [];
    const seen = new Set();
    for (const cell of headers) {
      const key = cell.dataset.col;
      if (!cell.closest(".dtable-scroll-center") || !COLUMN_CONFIG[key] || seen.has(key)) continue;
      seen.add(key);
      const width = Math.round(parseFloat(cell.style.width) || cell.getBoundingClientRect().width || COLUMN_CONFIG[key].min);
      columns.push({ key, width: Math.max(COLUMN_CONFIG[key].min, Math.min(COLUMN_CONFIG[key].max, width)) });
    }
    return columns;
  }

  function readLayout(view, headers) {
    let saved;
    try { saved = JSON.parse(storageFor(view)?.getItem(LAYOUT_KEY) || "null"); } catch (_) { return null; }
    if (!saved || !Array.isArray(saved.columns)) return null;
    const available = nativeColumns(headers);
    const byKey = new Map(available.map((column) => [column.key, column]));
    const order = [];
    for (const column of saved.columns) {
      if (!byKey.has(column?.key) || order.includes(column.key)) continue;
      const config = COLUMN_CONFIG[column.key];
      const width = Number(column.width);
      order.push(column.key);
      byKey.set(column.key, {
        key: column.key,
        width: Number.isFinite(width)
          ? Math.max(config.min, Math.min(config.max, Math.round(width)))
          : byKey.get(column.key).width,
      });
    }
    for (const column of available) if (!order.includes(column.key)) order.push(column.key);
    return order.map((key) => byKey.get(key));
  }

  const scrollBound = new WeakSet();
  function applyColumnLayout(doc, view, state) {
    const { table, headers } = state;
    const layout = readLayout(view, headers);
    const oldStyle = doc.getElementById(LAYOUT_STYLE_ID);
    if (!layout) {
      if (oldStyle) for (const block of table.querySelectorAll(".dtable-scroll-center")) block.scrollLeft = 0;
      oldStyle?.remove();
      return;
    }
    const center = table.querySelector(".dtable-scroll-center");
    if (!center) { oldStyle?.remove(); return; }
    const centerHeaders = headers.filter((cell) => center.contains(cell)).sort((a, b) =>
      (parseFloat(a.style.left) || 0) - (parseFloat(b.style.left) || 0)
    );
    const actualKeys = centerHeaders.map((cell) => cell.dataset.col);
    const saved = new Map(layout.map((column) => [column.key, column]));
    const editableOrder = layout.map((column) => column.key).filter((key) => actualKeys.includes(key));
    const ordered = actualKeys.map((key) => saved.has(key) ? editableOrder.shift() : key);
    const native = new Map(centerHeaders.map((cell) => [
      cell.dataset.col, Math.round(parseFloat(cell.style.width) || cell.getBoundingClientRect().width || 80),
    ]));
    let left = 0;
    const rules = [];
    for (const key of ordered) {
      const width = saved.get(key)?.width || native.get(key);
      if (!Number.isFinite(width)) continue;
      rules.push(`.tm-zentao-bug-table .dtable-scroll-center .dtable-cell[data-col="${key}"]{left:${left}px!important;width:${width}px!important}`);
      left += width;
    }
    rules.push(`.tm-zentao-bug-table .dtable-scroll-center .dtable-cells-container{min-width:${left}px!important}`);
    rules.push(`.tm-zentao-bug-table .dtable-scroll-center{overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}`);
    rules.push(`.tm-zentao-bug-table .dtable-scroll-center .dtable-cells-container{left:0!important;width:${left}px!important}`);
    for (const block of table.querySelectorAll(".dtable-scroll-center")) {
      if (scrollBound.has(block)) continue;
      scrollBound.add(block);
      block.addEventListener("scroll", () => {
        if (!doc.getElementById(LAYOUT_STYLE_ID)) return;
        for (const peer of table.querySelectorAll(".dtable-scroll-center")) {
          if (peer !== block && peer.scrollLeft !== block.scrollLeft) peer.scrollLeft = block.scrollLeft;
        }
      }, { passive: true });
    }
    const css = rules.join("\n");
    const style = oldStyle || doc.createElement("style");
    if (!oldStyle) {
      style.id = LAYOUT_STYLE_ID;
      (doc.head || doc.documentElement).appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }

  function ensureSettings(doc, view, state) {
    let item = doc.getElementById(SETTINGS_ID);
    if (item) return;
    item = doc.createElement("div");
    item.id = SETTINGS_ID;
    item.innerHTML = '<button type="button">列设置</button><div class="tm-zentao-panel" hidden></div>';
    doc.body.appendChild(item);
    const panel = item.querySelector(".tm-zentao-panel");
    item.querySelector("button").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (panel.hidden) return;
      const current = bugTable(doc);
      if (!current) { panel.hidden = true; return; }
      const columns = readLayout(view, current.headers) || nativeColumns(current.headers);
      panel.replaceChildren();
      const heading = doc.createElement("strong");
      heading.textContent = "Bug 列设置";
      panel.appendChild(heading);
      const list = doc.createElement("div");
      panel.appendChild(list);
      for (const column of columns) {
        const config = COLUMN_CONFIG[column.key];
        const row = doc.createElement("div");
        row.className = "tm-zentao-row";
        row.dataset.key = column.key;
        const label = doc.createElement("span");
        label.textContent = config.label;
        const input = doc.createElement("input");
        input.type = "number";
        input.min = String(config.min);
        input.max = String(config.max);
        input.value = String(column.width);
        input.setAttribute("aria-label", `${config.label}宽度`);
        const up = doc.createElement("button");
        up.type = "button";
        up.textContent = "↑";
        up.title = "上移";
        const down = doc.createElement("button");
        down.type = "button";
        down.textContent = "↓";
        down.title = "下移";
        for (const [button, direction] of [[up, -1], [down, 1]]) {
          button.addEventListener("click", () => {
            const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
            if (!sibling) return;
            if (direction < 0) list.insertBefore(row, sibling);
            else list.insertBefore(sibling, row);
          });
        }
        row.append(label, input, up, down);
        list.appendChild(row);
      }
      const actions = doc.createElement("div");
      actions.className = "tm-zentao-actions";
      const reset = doc.createElement("button");
      reset.type = "button";
      reset.textContent = "重置";
      reset.addEventListener("click", () => {
        try { storageFor(view)?.removeItem(LAYOUT_KEY); } catch (_) {}
        const current = bugTable(doc);
        if (current) applyColumnLayout(doc, view, current);
        panel.hidden = true;
      });
      const save = doc.createElement("button");
      save.type = "button";
      save.textContent = "保存";
      save.addEventListener("click", () => {
        const columns = Array.from(list.querySelectorAll(".tm-zentao-row"), (row) => ({
          key: row.dataset.key,
          width: Number(row.querySelector("input").value),
        }));
        try { storageFor(view)?.setItem(LAYOUT_KEY, JSON.stringify({ columns })); } catch (_) {}
        const fresh = bugTable(doc);
        if (fresh) applyColumnLayout(doc, view, fresh);
        panel.hidden = true;
      });
      actions.append(reset, save);
      panel.appendChild(actions);
    });
  }

  function enhanceDocument(doc, view) {
    if (!doc.body) return;
    ensureStyle(doc);
    enhanceProjectMenus(doc);
    const state = bugTable(doc);
    if (!state) {
      clearBugUi(doc);
      return;
    }
    state.table.classList.add("tm-zentao-bug-table");
    applyProductFilter(doc, view, state.table);
    applyColumnLayout(doc, view, state);
    ensureSettings(doc, view, state);
  }

  const observed = new WeakSet();
  function observeDocument(doc, view) {
    if (!doc.documentElement || observed.has(doc)) return;
    observed.add(doc);
    new view.MutationObserver(schedule).observe(doc.documentElement, {
      childList: true, subtree: true, characterData: true,
    });
    doc.addEventListener("click", schedule, true);
    doc.addEventListener("load", schedule, true);
    view.addEventListener("resize", schedule);
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      observeDocument(document, window);
      enhanceDocument(document, window);
      for (const frame of document.querySelectorAll("iframe")) {
        try {
          if (frame.contentDocument?.body) {
            observeDocument(frame.contentDocument, frame.contentWindow);
            enhanceDocument(frame.contentDocument, frame.contentWindow);
          }
        } catch (_) {}
      }
    });
  }

  schedule();
})();
