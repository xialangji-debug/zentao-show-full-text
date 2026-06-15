// ==UserScript==
// @name         ZenTao Show Full Text
// @namespace    local.codex.zentao
// @version      1.0.0
// @description  Show long ZenTao project/product names, filter Bug rows by product, and keep custom Bug column layout.
// @author       xiakezhen, Codex
// @license      MIT
// @homepageURL  https://github.com/xialangji-debug/zentao-show-full-text
// @supportURL   https://github.com/xialangji-debug/zentao-show-full-text/issues
// @updateURL    https://raw.githubusercontent.com/xialangji-debug/zentao-show-full-text/main/zentaopms-show-full-text.user.js
// @downloadURL  https://raw.githubusercontent.com/xialangji-debug/zentao-show-full-text/main/zentaopms-show-full-text.user.js
// @match        *://zentao.hzyuelan.com/*
// @match        *://*/zentao/*
// @match        about:blank
// @include      http://zentao.hzyuelan.com/*
// @include      https://zentao.hzyuelan.com/*
// @include      *://*/zentao/*
// @include      about:blank
// @include      about:srcdoc
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const STYLE_ID = "tm-zentao-show-full-text-style";
  const PROJECT_TEXT_PATTERN = /\b(?:TW|LT|JC|K|Q)\d+[A-Z]?[_-][^\n]{3,}/i;
  const PROJECT_LIST_PATTERN = /\b(?:TW|LT|JC|K|Q)\d+[A-Z]?[_-][^\n]{3,}/gi;
  const ACTION_WORDS = ["返回", "变更", "拆分", "指派", "关闭", "删除"];
  const VERSION = "1.0.0";
  const FORCE_STYLE_ID = "tm-zentao-show-full-text-force-style";
  const BUG_COLUMN_STYLE_ID = "tm-zentao-bug-column-layout-style";
  const PRODUCT_FILTER_ID = "tm-zentao-product-filter-item";
  const PRODUCT_FILTER_STORAGE_KEY = "tm-zentao-product-filter-value";
  const BUG_COLUMN_SETTINGS_ID = "tm-zentao-column-settings-item";
  const BUG_COLUMN_PANEL_ID = "tm-zentao-column-settings-panel";
  const BUG_COLUMN_LAYOUT_STORAGE_KEY = "tm-zentao-bug-column-layout-v1";
  const BUG_COLUMN_CONFIG = {
    severity: { label: "严重程度", width: 92, min: 64, max: 180 },
    pri: { label: "优先级", width: 68, min: 56, max: 160 },
    type: { label: "Bug类型", width: 88, min: 64, max: 180 },
    productName: { label: "所属产品", width: 220, min: 100, max: 420 },
    openedBy: { label: "创建者", width: 92, min: 64, max: 180 },
    confirmed: { label: "是否确认", width: 84, min: 64, max: 180 },
    deadline: { label: "截止日期", width: 96, min: 72, max: 180 },
    resolvedBy: { label: "解决者", width: 84, min: 64, max: 180 },
    resolution: { label: "解决方案", width: 88, min: 64, max: 180 },
    actions: { label: "操作", width: 132, min: 96, max: 220 },
  };
  const TARGETED_DROPMENU_CSS = `
      /* ZenTao/ZUI project dropmenu. The original CSS clips these names with
         overflow-x:hidden and a 248px popup width. */
      #dropmenu,
      #switcher,
      .tm-zentao-dropmenu-root,
      [data-fetcher*="product-ajaxGetDropMenu"],
      [data-fetcher*="project-ajaxGetDropMenu"],
      [data-fetcher*="execution-ajaxGetDropMenu"],
      [z-use-dropmenu] {
        flex: 0 0 auto !important;
        width: auto !important;
        max-width: min(720px, calc(100vw - 280px)) !important;
        overflow: visible !important;
      }

      #pick-dropmenu-menu,
      #pick-switcher,
      #dropmenu > .dropmenu-btn,
      #switcher > .dropmenu-btn,
      .tm-zentao-dropmenu-root > .dropmenu-btn,
      .tm-zentao-dropmenu-trigger {
        width: auto !important;
        min-width: max-content !important;
        max-width: min(720px, calc(100vw - 280px)) !important;
        overflow: visible !important;
      }

      #pick-dropmenu-menu > .text,
      #pick-switcher > .text,
      #dropmenu > .dropmenu-btn > .text,
      #switcher > .dropmenu-btn > .text,
      .tm-zentao-dropmenu-trigger > .text {
        display: inline-block !important;
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }

      .pick-container {
        overflow: visible !important;
        z-index: 2147483000 !important;
      }

      .pick-container > .pick-pop {
        pointer-events: auto !important;
      }

      #pick-pop-dropmenu-menu,
      #pick-pop-switcher,
      .tm-zentao-target-dropmenu-pop {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 2147483001 !important;
      }

      #pick-pop-dropmenu-menu .dropmenu-list,
      #pick-pop-switcher .dropmenu-list,
      .tm-zentao-target-dropmenu-pop .dropmenu-list {
        width: auto !important;
        min-width: 100% !important;
        max-width: none !important;
        overflow-x: visible !important;
        overflow-y: auto !important;
      }

      #pick-pop-dropmenu-menu .tree,
      #pick-pop-switcher .tree,
      .tm-zentao-target-dropmenu-pop .tree {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
      }

      #pick-pop-dropmenu-menu .tree-item,
      #pick-pop-switcher .tree-item,
      .tm-zentao-target-dropmenu-pop .tree-item {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }

      #pick-pop-dropmenu-menu .tree-item-inner,
      #pick-pop-switcher .tree-item-inner,
      .tm-zentao-target-dropmenu-pop .tree-item-inner {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }

      #pick-pop-dropmenu-menu .dropmenu-item,
      #pick-pop-dropmenu-menu .dropmenu-item *,
      #pick-pop-switcher .dropmenu-item,
      #pick-pop-switcher .dropmenu-item *,
      .tm-zentao-target-dropmenu-pop .dropmenu-item,
      .tm-zentao-target-dropmenu-pop .dropmenu-item * {
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      #pick-pop-dropmenu-menu .dropmenu-item .item-title,
      #pick-pop-dropmenu-menu .dropmenu-item .item-content,
      #pick-pop-dropmenu-menu .dropmenu-item .label,
      #pick-pop-switcher .dropmenu-item .item-title,
      #pick-pop-switcher .dropmenu-item .item-content,
      #pick-pop-switcher .dropmenu-item .label,
      .tm-zentao-target-dropmenu-pop .dropmenu-item .item-title,
      .tm-zentao-target-dropmenu-pop .dropmenu-item .item-content,
      .tm-zentao-target-dropmenu-pop .dropmenu-item .label {
        display: inline-flex !important;
        flex: 0 0 auto !important;
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      @supports selector(:has(*)) {
        .pick-pop.dropmenu:has(.tm-zentao-project-line) {
          width: min(440px, calc(100vw - 24px)) !important;
          min-width: min(400px, calc(100vw - 24px)) !important;
          max-width: calc(100vw - 24px) !important;
          overflow: visible !important;
        }

        .pick-pop.dropmenu:has(.tm-zentao-project-line) .dropmenu-list {
          overflow-x: visible !important;
        }
      }
  `;
  const COMPACT_PROJECT_DROPMENU_CSS = `
      body #pick-pop-dropmenu-menu,
      body #pick-pop-switcher,
      body .pick-pop.tm-zentao-target-dropmenu-pop,
      body .tm-zentao-target-dropmenu-pop {
        box-sizing: border-box !important;
        width: min(460px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
      }

      body #pick-pop-dropmenu-menu .dropmenu-list,
      body #pick-pop-switcher .dropmenu-list,
      body .pick-pop.tm-zentao-target-dropmenu-pop .dropmenu-list,
      body .tm-zentao-target-dropmenu-pop .dropmenu-list {
        box-sizing: border-box !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
      }

      body #pick-pop-dropmenu-menu .tree,
      body #pick-pop-switcher .tree,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree,
      body .tm-zentao-target-dropmenu-pop .tree {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: visible !important;
      }

      body #pick-pop-dropmenu-menu .tree-item,
      body #pick-pop-switcher .tree-item,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item,
      body .tm-zentao-target-dropmenu-pop .tree-item {
        display: block !important;
        box-sizing: border-box !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: normal !important;
        white-space: nowrap !important;
        overflow: visible !important;
        transform: none !important;
      }

      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner,
      body #pick-pop-switcher .tree-item > .tree-item-inner,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner,
      body #pick-pop-dropmenu-menu .dropmenu-item:not(.tree-item),
      body #pick-pop-switcher .dropmenu-item:not(.tree-item),
      body .pick-pop.tm-zentao-target-dropmenu-pop .dropmenu-item:not(.tree-item),
      body .tm-zentao-target-dropmenu-pop .dropmenu-item:not(.tree-item) {
        display: flex !important;
        box-sizing: border-box !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 8px !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        height: 34px !important;
        min-height: 34px !important;
        max-height: 34px !important;
        margin: 0 !important;
        padding: 0 14px !important;
        line-height: 34px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-align: left !important;
        transform: none !important;
      }

      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner > .item-icon,
      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner > .icon,
      body #pick-pop-switcher .tree-item > .tree-item-inner > .item-icon,
      body #pick-pop-switcher .tree-item > .tree-item-inner > .icon,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner > .item-icon,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner > .icon,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner > .item-icon,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner > .icon {
        display: inline-flex !important;
        flex: 0 0 20px !important;
        align-items: center !important;
        justify-content: center !important;
        width: 20px !important;
        min-width: 20px !important;
        max-width: 20px !important;
        height: 20px !important;
        margin: 0 !important;
        line-height: 20px !important;
      }

      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner .item-title,
      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner .item-content,
      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner .label,
      body #pick-pop-dropmenu-menu .tree-item > .tree-item-inner .text,
      body #pick-pop-switcher .tree-item > .tree-item-inner .item-title,
      body #pick-pop-switcher .tree-item > .tree-item-inner .item-content,
      body #pick-pop-switcher .tree-item > .tree-item-inner .label,
      body #pick-pop-switcher .tree-item > .tree-item-inner .text,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .item-title,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .item-content,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .label,
      body .pick-pop.tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .text,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .item-title,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .item-content,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .label,
      body .tm-zentao-target-dropmenu-pop .tree-item > .tree-item-inner .text {
        display: block !important;
        flex: 1 1 auto !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        height: 34px !important;
        line-height: 34px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-align: left !important;
      }
  `;

  function isZentaoContext() {
    try {
      if (/^https?:$/.test(location.protocol) && location.hostname === "zentao.hzyuelan.com") return true;
      if (/\/zentao\//.test(location.pathname)) return true;
    } catch (_) {
      // Ignore inaccessible location objects.
    }

    try {
      if (window.parent && window.parent !== window) {
        const parentLocation = window.parent.location;
        if (parentLocation.hostname === "zentao.hzyuelan.com" || /\/zentao\//.test(parentLocation.pathname)) {
          return true;
        }
      }
    } catch (_) {
      // Cross-origin parent frames are not our target.
    }

    try {
      return /:\/\/zentao\.hzyuelan\.com\/|\/zentao\//.test(document.referrer || "");
    } catch (_) {
      return false;
    }
  }

  if (!isZentaoContext()) return;

  window.__zentaoShowFullTextVersion = VERSION;
  document.documentElement.setAttribute("data-zentao-show-full-text", VERSION);

  function getMainStyleCss() {
    return `
      html body {
        padding-bottom: 96px !important;
      }

      ${TARGETED_DROPMENU_CSS}

      body .tm-zentao-top-project {
        width: clamp(360px, 46vw, 860px) !important;
        max-width: calc(100vw - 280px) !important;
        min-width: 260px !important;
        flex: 0 1 auto !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-top-project,
      body .tm-zentao-top-project * {
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-wide-menu {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .tm-zentao-readable-box,
      body .tm-zentao-readable-box > *,
      body .tm-zentao-wide-menu *,
      body .tm-zentao-project-item,
      body .tm-zentao-project-item * {
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      body .tm-zentao-readable-box,
      body .tm-zentao-readable-box > *,
      body .tm-zentao-wide-menu li,
      body .tm-zentao-wide-menu a,
      body .tm-zentao-wide-menu button,
      body .tm-zentao-wide-menu [role="option"],
      body .tm-zentao-project-item {
        height: auto !important;
        min-height: 34px !important;
        line-height: 1.35 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      body .tm-zentao-project-line,
      body .tm-zentao-project-line * {
        display: inline-block !important;
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        vertical-align: middle !important;
      }

      body .tm-zentao-readable-box {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
      }

      body .dropdown-menu:has(.tm-zentao-project-line),
      body .menu:has(.tm-zentao-project-line),
      body .popover:has(.tm-zentao-project-line),
      body .panel:has(.tm-zentao-project-line),
      body [class*="dropdown"]:has(.tm-zentao-project-line),
      body [class*="menu"]:has(.tm-zentao-project-line),
      body [class*="picker"]:has(.tm-zentao-project-line) {
        width: max-content !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .tm-zentao-run-badge {
        position: fixed !important;
        right: 12px !important;
        bottom: 48px !important;
        z-index: 2147483647 !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        background: rgba(29, 128, 255, 0.92) !important;
        color: #fff !important;
        font: 12px/1.2 Arial, sans-serif !important;
        pointer-events: none !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16) !important;
      }

      body .tm-zentao-product-filter-item {
        display: inline-flex !important;
        align-items: center !important;
        margin-left: 8px !important;
      }

      body .tm-zentao-product-filter {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        min-height: 32px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(var(--color-primary-200-rgb), 1) !important;
        border-radius: 16px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-fore-rgb), 1) !important;
        font: 13px/1.2 Arial, "Microsoft YaHei", sans-serif !important;
        box-shadow: 0 1px 2px rgba(20, 76, 225, 0.08) !important;
      }

      body .tm-zentao-product-filter select {
        width: min(320px, 36vw) !important;
        max-width: 320px !important;
        height: 28px !important;
        border: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        color: inherit !important;
        font: inherit !important;
      }

      body .tm-zentao-product-filter-count {
        flex: none !important;
        color: rgba(var(--color-gray-500-rgb), 1) !important;
        font-size: 12px !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-product-filter-empty {
        opacity: 0.55 !important;
      }

      body .tm-zentao-filter-hidden-row {
        display: none !important;
      }

      body #table-my-work .dtable-cell,
      body #table-my-work .dtable-cell-content {
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      body #table-my-work .dtable-cell-content {
        min-width: 0 !important;
        max-width: 100% !important;
        white-space: nowrap !important;
      }

      body #table-my-work .tm-zentao-project-line,
      body #table-my-work .tm-zentao-project-line * {
        display: block !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body .pick-pop .item-title.tm-zentao-project-line,
      body .pick-pop .item-content.tm-zentao-project-line,
      body .pick-pop .label.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .item-title.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .item-content.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .label.tm-zentao-project-line {
        display: inline-block !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body .pick-pop .dropmenu-item,
      body .pick-pop .tree-item-inner,
      body .tm-zentao-target-dropmenu-pop .dropmenu-item,
      body .tm-zentao-target-dropmenu-pop .tree-item-inner {
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }

      body .pick-pop .tree-item,
      body .tm-zentao-target-dropmenu-pop .tree-item {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }

      body .pick-pop .dropmenu-item,
      body .pick-pop .tree-item-inner,
      body .tm-zentao-target-dropmenu-pop .dropmenu-item,
      body .tm-zentao-target-dropmenu-pop .tree-item-inner {
        height: 36px !important;
        min-height: 36px !important;
        max-height: 36px !important;
        line-height: 36px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        white-space: nowrap !important;
      }

      body .pick-pop .item-title.tm-zentao-project-line,
      body .pick-pop .item-content.tm-zentao-project-line,
      body .pick-pop .label.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .item-title.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .item-content.tm-zentao-project-line,
      body .tm-zentao-target-dropmenu-pop .label.tm-zentao-project-line {
        flex: 1 1 auto !important;
        line-height: 36px !important;
      }

      body .tm-zentao-column-settings-item {
        position: fixed !important;
        right: 12px !important;
        bottom: 78px !important;
        z-index: 2147483646 !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
      }

      body .tm-zentao-column-settings-button {
        height: 32px !important;
        padding: 0 12px !important;
        border: 1px solid rgba(29, 128, 255, 0.55) !important;
        border-radius: 4px !important;
        background: rgba(29, 128, 255, 0.94) !important;
        color: #fff !important;
        cursor: pointer !important;
        font: 13px/1.2 Arial, "Microsoft YaHei", sans-serif !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16) !important;
      }

      body .tm-zentao-column-settings-button:hover,
      body .tm-zentao-column-settings-button:focus {
        background: rgba(16, 102, 214, 0.96) !important;
        outline: 0 !important;
      }

      body .tm-zentao-column-settings-panel {
        position: fixed !important;
        right: 12px !important;
        bottom: 118px !important;
        z-index: 2147483646 !important;
        width: 420px !important;
        max-width: calc(100vw - 32px) !important;
        padding: 12px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 8px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-fore-rgb), 1) !important;
        box-shadow: 0 10px 28px rgba(16, 24, 40, 0.18) !important;
        font: 13px/1.35 Arial, "Microsoft YaHei", sans-serif !important;
      }

      body .tm-zentao-column-settings-panel[hidden] {
        display: none !important;
      }

      body .tm-zentao-column-settings-head,
      body .tm-zentao-column-settings-actions {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }

      body .tm-zentao-column-settings-head {
        margin-bottom: 10px !important;
        font-weight: 700 !important;
      }

      body .tm-zentao-column-settings-close {
        width: 26px !important;
        height: 26px !important;
        border: 0 !important;
        border-radius: 4px !important;
        background: transparent !important;
        color: inherit !important;
        cursor: pointer !important;
        font: 18px/1 Arial, sans-serif !important;
      }

      body .tm-zentao-column-settings-list {
        display: grid !important;
        gap: 6px !important;
        max-height: min(52vh, 420px) !important;
        overflow: auto !important;
        padding-right: 2px !important;
      }

      body .tm-zentao-column-settings-row {
        display: grid !important;
        grid-template-columns: minmax(96px, 1fr) 86px 30px 30px !important;
        align-items: center !important;
        gap: 8px !important;
        min-height: 34px !important;
        padding: 5px 6px !important;
        border: 1px solid rgba(var(--color-gray-100-rgb), 1) !important;
        border-radius: 6px !important;
        background: rgba(var(--color-gray-50-rgb), 0.65) !important;
      }

      body .tm-zentao-column-settings-row label {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        font-weight: 600 !important;
      }

      body .tm-zentao-column-settings-row input {
        width: 86px !important;
        height: 28px !important;
        padding: 0 6px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: inherit !important;
        font: inherit !important;
      }

      body .tm-zentao-column-move {
        width: 30px !important;
        height: 28px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-primary-500-rgb), 1) !important;
        cursor: pointer !important;
        font: 13px/1 Arial, sans-serif !important;
      }

      body .tm-zentao-column-move:disabled {
        cursor: default !important;
        opacity: 0.35 !important;
      }

      body .tm-zentao-column-settings-actions {
        margin-top: 10px !important;
        justify-content: flex-end !important;
      }

      body .tm-zentao-column-settings-actions button {
        min-width: 58px !important;
        height: 30px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(var(--color-primary-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-primary-500-rgb), 1) !important;
        cursor: pointer !important;
        font: inherit !important;
      }

      body .tm-zentao-column-settings-actions .tm-zentao-column-save {
        background: rgba(var(--color-primary-500-rgb), 1) !important;
        color: #fff !important;
      }

      body .dropdown-menu,
      body .dropdown-menu *,
      body .picker,
      body .picker *,
      body [class*="picker"],
      body [class*="picker"] *,
      body .tree,
      body .tree *,
      body [class*="tree"],
      body [class*="tree"] * {
        text-overflow: clip !important;
      }

      body .dropdown-menu,
      body .picker,
      body [class*="picker"],
      body .picker-menu,
      body .picker-panel,
      body .picker .panel,
      body .picker .list,
      body .picker .tree,
      body .dropdown-menu .tree {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .dropdown-menu .tree li,
      body .dropdown-menu .tree .item,
      body .dropdown-menu .tree [class*="item"],
      body .picker .tree li,
      body .picker .tree .item,
      body .picker .tree [class*="item"],
      body [class*="picker"] [class*="item"] {
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        white-space: nowrap !important;
      }

      body .dropdown-menu .tree li *,
      body .dropdown-menu .tree .item *,
      body .dropdown-menu .tree [class*="item"] *,
      body .picker .tree li *,
      body .picker .tree .item *,
      body .picker .tree [class*="item"] *,
      body [class*="picker"] [class*="item"] * {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
      }

      body .tm-zentao-action-bar {
        position: sticky !important;
        bottom: 12px !important;
        left: auto !important;
        right: 24px !important;
        transform: none !important;
        width: max-content !important;
        max-width: calc(100vw - 280px) !important;
        margin: 16px 24px 16px auto !important;
        z-index: 1000 !important;
        opacity: 0.9 !important;
      }

      body .tm-zentao-action-bar:hover,
      body .tm-zentao-action-bar:focus-within {
        opacity: 1 !important;
      }

      body .pick-pop .item-title.tm-zentao-project-line,
      body .pick-pop .item-content.tm-zentao-project-line,
      body .pick-pop .label.tm-zentao-project-line,
      body .pick-pop .dropmenu-item,
      body .pick-pop .tree-item-inner {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      body .pick-pop .tree-item {
        min-width: 0 !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }

      body .pick-pop .dropmenu-item,
      body .pick-pop .tree-item-inner {
        height: 36px !important;
        min-height: 36px !important;
        max-height: 36px !important;
        line-height: 36px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }

      @media (max-width: 980px) {
        body .tm-zentao-top-project {
          width: clamp(260px, 45vw, 560px) !important;
          max-width: calc(100vw - 300px) !important;
        }

        body .tm-zentao-action-bar {
          max-width: calc(100vw - 32px) !important;
          right: 16px !important;
          margin-right: 16px !important;
        }
      }

      ${COMPACT_PROJECT_DROPMENU_CSS}
    `;
  }

  function injectStyleInto(targetDocument = document) {
    if (!targetDocument?.documentElement || targetDocument.getElementById(STYLE_ID)) return;

    const style = targetDocument.createElement("style");
    style.id = STYLE_ID;
    style.textContent = getMainStyleCss();
    (targetDocument.head || targetDocument.documentElement).appendChild(style);
  }

  function injectStyle() {
    injectStyleInto(document);
  }

  function unusedLegacyStyleTemplate() {
    return `
      html body {
        padding-bottom: 96px !important;
      }

      ${TARGETED_DROPMENU_CSS}

      body .tm-zentao-top-project {
        width: clamp(360px, 46vw, 860px) !important;
        max-width: calc(100vw - 280px) !important;
        min-width: 260px !important;
        flex: 0 1 auto !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-top-project,
      body .tm-zentao-top-project * {
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-wide-menu {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .tm-zentao-readable-box,
      body .tm-zentao-readable-box > *,
      body .tm-zentao-wide-menu *,
      body .tm-zentao-project-item,
      body .tm-zentao-project-item * {
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
      }

      body .tm-zentao-readable-box,
      body .tm-zentao-readable-box > *,
      body .tm-zentao-wide-menu li,
      body .tm-zentao-wide-menu a,
      body .tm-zentao-wide-menu button,
      body .tm-zentao-wide-menu [role="option"],
      body .tm-zentao-project-item {
        height: auto !important;
        min-height: 34px !important;
        line-height: 1.35 !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      body .tm-zentao-project-line,
      body .tm-zentao-project-line * {
        display: inline-block !important;
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        vertical-align: middle !important;
      }

      body .tm-zentao-readable-box {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
      }

      body .dropdown-menu:has(.tm-zentao-project-line),
      body .menu:has(.tm-zentao-project-line),
      body .popover:has(.tm-zentao-project-line),
      body .panel:has(.tm-zentao-project-line),
      body [class*="dropdown"]:has(.tm-zentao-project-line),
      body [class*="menu"]:has(.tm-zentao-project-line),
      body [class*="picker"]:has(.tm-zentao-project-line) {
        width: max-content !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .tm-zentao-run-badge {
        position: fixed !important;
        right: 12px !important;
        bottom: 48px !important;
        z-index: 2147483647 !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        background: rgba(29, 128, 255, 0.92) !important;
        color: #fff !important;
        font: 12px/1.2 Arial, sans-serif !important;
        pointer-events: none !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16) !important;
      }

      body .tm-zentao-product-filter-item {
        display: inline-flex !important;
        align-items: center !important;
        margin-left: 8px !important;
      }

      body .tm-zentao-product-filter {
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        min-height: 32px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(var(--color-primary-200-rgb), 1) !important;
        border-radius: 16px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-fore-rgb), 1) !important;
        font: 13px/1.2 Arial, "Microsoft YaHei", sans-serif !important;
        box-shadow: 0 1px 2px rgba(20, 76, 225, 0.08) !important;
      }

      body .tm-zentao-product-filter select {
        width: min(320px, 36vw) !important;
        max-width: 320px !important;
        height: 28px !important;
        border: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        color: inherit !important;
        font: inherit !important;
      }

      body .tm-zentao-product-filter-count {
        flex: none !important;
        color: rgba(var(--color-gray-500-rgb), 1) !important;
        font-size: 12px !important;
        white-space: nowrap !important;
      }

      body .tm-zentao-product-filter-empty {
        opacity: 0.55 !important;
      }

      body .tm-zentao-filter-hidden-row {
        display: none !important;
      }

      body .tm-zentao-column-settings-item {
        position: relative !important;
        display: inline-flex !important;
        align-items: center !important;
        margin-left: 8px !important;
      }

      body .tm-zentao-column-settings-button {
        height: 32px !important;
        padding: 0 12px !important;
        border: 1px solid rgba(var(--color-primary-200-rgb), 1) !important;
        border-radius: 16px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-primary-500-rgb), 1) !important;
        cursor: pointer !important;
        font: 13px/1.2 Arial, "Microsoft YaHei", sans-serif !important;
        box-shadow: 0 1px 2px rgba(20, 76, 225, 0.08) !important;
      }

      body .tm-zentao-column-settings-button:hover,
      body .tm-zentao-column-settings-button:focus {
        background: rgba(var(--color-primary-50-rgb), 1) !important;
        outline: 0 !important;
      }

      body .tm-zentao-column-settings-panel {
        position: absolute !important;
        top: calc(100% + 8px) !important;
        right: 0 !important;
        z-index: 2147483002 !important;
        width: 420px !important;
        max-width: calc(100vw - 32px) !important;
        padding: 12px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 8px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-fore-rgb), 1) !important;
        box-shadow: 0 10px 28px rgba(16, 24, 40, 0.18) !important;
        font: 13px/1.35 Arial, "Microsoft YaHei", sans-serif !important;
      }

      body .tm-zentao-column-settings-panel[hidden] {
        display: none !important;
      }

      body .tm-zentao-column-settings-head,
      body .tm-zentao-column-settings-actions {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 8px !important;
      }

      body .tm-zentao-column-settings-head {
        margin-bottom: 10px !important;
        font-weight: 700 !important;
      }

      body .tm-zentao-column-settings-close {
        width: 26px !important;
        height: 26px !important;
        border: 0 !important;
        border-radius: 4px !important;
        background: transparent !important;
        color: inherit !important;
        cursor: pointer !important;
        font: 18px/1 Arial, sans-serif !important;
      }

      body .tm-zentao-column-settings-list {
        display: grid !important;
        gap: 6px !important;
        max-height: min(52vh, 420px) !important;
        overflow: auto !important;
        padding-right: 2px !important;
      }

      body .tm-zentao-column-settings-row {
        display: grid !important;
        grid-template-columns: minmax(96px, 1fr) 86px 30px 30px !important;
        align-items: center !important;
        gap: 8px !important;
        min-height: 34px !important;
        padding: 5px 6px !important;
        border: 1px solid rgba(var(--color-gray-100-rgb), 1) !important;
        border-radius: 6px !important;
        background: rgba(var(--color-gray-50-rgb), 0.65) !important;
      }

      body .tm-zentao-column-settings-row label {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        font-weight: 600 !important;
      }

      body .tm-zentao-column-settings-row input {
        width: 86px !important;
        height: 28px !important;
        padding: 0 6px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: inherit !important;
        font: inherit !important;
      }

      body .tm-zentao-column-move {
        width: 30px !important;
        height: 28px !important;
        border: 1px solid rgba(var(--color-gray-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-primary-500-rgb), 1) !important;
        cursor: pointer !important;
        font: 13px/1 Arial, sans-serif !important;
      }

      body .tm-zentao-column-move:disabled {
        cursor: default !important;
        opacity: 0.35 !important;
      }

      body .tm-zentao-column-settings-actions {
        margin-top: 10px !important;
        justify-content: flex-end !important;
      }

      body .tm-zentao-column-settings-actions button {
        min-width: 58px !important;
        height: 30px !important;
        padding: 0 10px !important;
        border: 1px solid rgba(var(--color-primary-200-rgb), 1) !important;
        border-radius: 4px !important;
        background: rgba(var(--color-canvas-rgb), 1) !important;
        color: rgba(var(--color-primary-500-rgb), 1) !important;
        cursor: pointer !important;
        font: inherit !important;
      }

      body .tm-zentao-column-settings-actions .tm-zentao-column-save {
        background: rgba(var(--color-primary-500-rgb), 1) !important;
        color: #fff !important;
      }

      body .dropdown-menu,
      body .dropdown-menu *,
      body .picker,
      body .picker *,
      body [class*="picker"],
      body [class*="picker"] *,
      body .tree,
      body .tree *,
      body [class*="tree"],
      body [class*="tree"] * {
        text-overflow: clip !important;
      }

      body .dropdown-menu,
      body .picker,
      body [class*="picker"],
      body .picker-menu,
      body .picker-panel,
      body .picker .panel,
      body .picker .list,
      body .picker .tree,
      body .dropdown-menu .tree {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body .dropdown-menu .tree li,
      body .dropdown-menu .tree .item,
      body .dropdown-menu .tree [class*="item"],
      body .picker .tree li,
      body .picker .tree .item,
      body .picker .tree [class*="item"],
      body [class*="picker"] [class*="item"] {
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }

      body .dropdown-menu .tree li *,
      body .dropdown-menu .tree .item *,
      body .dropdown-menu .tree [class*="item"] *,
      body .picker .tree li *,
      body .picker .tree .item *,
      body .picker .tree [class*="item"] *,
      body [class*="picker"] [class*="item"] * {
        max-width: none !important;
        overflow: visible !important;
        white-space: nowrap !important;
        text-overflow: clip !important;
      }

      body .tm-zentao-action-bar {
        position: sticky !important;
        bottom: 12px !important;
        left: auto !important;
        right: 24px !important;
        transform: none !important;
        width: max-content !important;
        max-width: calc(100vw - 280px) !important;
        margin: 16px 24px 16px auto !important;
        z-index: 1000 !important;
        opacity: 0.9 !important;
      }

      body .tm-zentao-action-bar:hover,
      body .tm-zentao-action-bar:focus-within {
        opacity: 1 !important;
      }

      @media (max-width: 980px) {
        body .tm-zentao-top-project {
          width: clamp(260px, 45vw, 560px) !important;
          max-width: calc(100vw - 300px) !important;
        }

        body .tm-zentao-action-bar {
          max-width: calc(100vw - 32px) !important;
          right: 16px !important;
          margin-right: 16px !important;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function textOf(element) {
    return (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(element) {
    if (!isHtmlElement(element)) return false;
    const rect = element.getBoundingClientRect();
    const style = getElementWindow(element).getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function findReasonableAncestor(element) {
    let current = element;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      if (!isHtmlElement(current)) break;

      const rect = current.getBoundingClientRect();
      if (rect.top > 150 || rect.width > 760 || rect.height > 96) continue;

      const className = String(current.className || "");
      const tag = current.tagName.toLowerCase();
      if (
        tag === "a" ||
        tag === "button" ||
        current.hasAttribute("data-toggle") ||
        current.hasAttribute("aria-haspopup") ||
        /dropdown|switch|project|breadcrumb|program|picker|select/i.test(className)
      ) {
        return current;
      }
    }

    return element;
  }

  function markTopProject() {
    if (!document.body) return;

    const candidates = Array.from(document.querySelectorAll("a, button, span, div"))
      .filter((element) => {
        if (!isVisible(element)) return false;
        const rect = element.getBoundingClientRect();
        if (rect.top < 0 || rect.top > 130 || rect.left < 80 || rect.width < 80 || rect.height > 88) return false;
        const text = textOf(element);
        return text.length >= 12 && PROJECT_TEXT_PATTERN.test(text);
      })
      .sort((a, b) => textOf(b).length - textOf(a).length);

    const target = candidates[0];
    if (!target) return;

    const projectText = textOf(target);
    const holder = findReasonableAncestor(target);
    holder.classList.add("tm-zentao-top-project");
    holder.title = projectText;
    target.title = projectText;
  }

  function showRunBadge() {
    if (!document.body || document.getElementById("tm-zentao-run-badge")) return;

    const badge = document.createElement("div");
    badge.id = "tm-zentao-run-badge";
    badge.className = "tm-zentao-run-badge";
    badge.textContent = `ZenTao Full Text ${VERSION}`;
    document.body.appendChild(badge);
    window.setTimeout(() => badge.remove(), 2200);
  }

  function markProjectMenuItems(container) {
    const itemCandidates = container.querySelectorAll("li, a, button, div, span, [role='option']");
    for (const item of itemCandidates) {
      if (!shouldTreatAsSingleProjectLine(item)) continue;
      const text = textOf(item);
      if (text.length >= 12 && PROJECT_TEXT_PATTERN.test(text)) {
        item.classList.add("tm-zentao-project-item", "tm-zentao-project-line");
        item.title = text;
      }
    }
  }

  function injectForceStyle(targetDocument = document) {
    if (!targetDocument || targetDocument.getElementById(FORCE_STYLE_ID)) return;

    const style = targetDocument.createElement("style");
    style.id = FORCE_STYLE_ID;
    style.textContent = `
      .dropdown-menu,
      .picker,
      [class*="picker"],
      .picker-menu,
      .picker-panel,
      .picker .panel,
      .picker .list,
      .picker .tree,
      .dropdown-menu .tree {
        width: min(440px, calc(100vw - 24px)) !important;
        min-width: min(400px, calc(100vw - 24px)) !important;
        max-width: calc(100vw - 24px) !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      ${TARGETED_DROPMENU_CSS}

      .dropdown-menu *,
      .picker *,
      [class*="picker"] *,
      .tree *,
      [class*="tree"] * {
        text-overflow: clip !important;
      }

      .dropdown-menu .tree li,
      .dropdown-menu .tree .item,
      .dropdown-menu .tree [class*="item"],
      .picker .tree li,
      .picker .tree .item,
      .picker .tree [class*="item"],
      [class*="picker"] [class*="item"] {
        width: auto !important;
        min-width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        white-space: nowrap !important;
      }

      .dropdown-menu .tree li *,
      .dropdown-menu .tree .item *,
      .dropdown-menu .tree [class*="item"] *,
      .picker .tree li *,
      .picker .tree .item *,
      .picker .tree [class*="item"] *,
      [class*="picker"] [class*="item"] * {
        max-width: none !important;
        overflow: visible !important;
        white-space: nowrap !important;
        text-overflow: clip !important;
      }

      ${TARGETED_DROPMENU_CSS}
      ${COMPACT_PROJECT_DROPMENU_CSS}
    `;

    (targetDocument.head || targetDocument.documentElement).appendChild(style);
  }

  function isVisibleInDocument(element, targetWindow) {
    if (!isHtmlElement(element)) return false;
    const rect = element.getBoundingClientRect();
    const view = targetWindow || element.ownerDocument.defaultView || window;
    const style = view.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function forceBox(element) {
    element.classList.add("tm-zentao-readable-box", "tm-zentao-wide-menu");
    element.style.setProperty("width", "min(460px, calc(100vw - 24px))", "important");
    element.style.setProperty("min-width", "min(400px, calc(100vw - 24px))", "important");
    element.style.setProperty("max-width", "calc(100vw - 24px)", "important");
    element.style.setProperty("overflow", "visible", "important");
    element.style.setProperty("z-index", "99999", "important");
  }

  function forceTextLine(element, options = {}) {
    const allowWide = !!options.allowWide;
    if (!allowWide && !shouldTreatAsSingleProjectLine(element)) return;
    element.classList.add("tm-zentao-project-item", "tm-zentao-project-line");
    element.style.setProperty("width", "auto", "important");
    element.style.setProperty("min-width", allowWide ? "max-content" : "0", "important");
    element.style.setProperty("max-width", allowWide ? "none" : "100%", "important");
    if (!allowWide) element.style.setProperty("flex", "1 1 auto", "important");
    element.style.setProperty("overflow", allowWide ? "visible" : "hidden", "important");
    element.style.setProperty("white-space", "nowrap", "important");
    element.style.setProperty("text-overflow", allowWide ? "clip" : "ellipsis", "important");
    const text = textOf(element);
    if (text) element.title = text;
  }

  function normalizeProjectPopupRows(popup) {
    if (!isHtmlElement(popup)) return;
    popup.classList.add("tm-zentao-target-dropmenu-pop");

    for (const treeItem of popup.querySelectorAll(".tree-item")) {
      if (!isHtmlElement(treeItem)) continue;
      setImportant(treeItem, "display", "block");
      setImportant(treeItem, "width", "100%");
      setImportant(treeItem, "min-width", "0");
      setImportant(treeItem, "max-width", "100%");
      setImportant(treeItem, "height", "auto");
      setImportant(treeItem, "min-height", "0");
      setImportant(treeItem, "max-height", "none");
      setImportant(treeItem, "margin", "0");
      setImportant(treeItem, "padding", "0");
      setImportant(treeItem, "overflow", "visible");
      setImportant(treeItem, "white-space", "nowrap");
    }

    for (const row of popup.querySelectorAll(".tree-item > .tree-item-inner, .dropmenu-item:not(.tree-item)")) {
      if (!isHtmlElement(row)) continue;
      setImportant(row, "display", "flex");
      setImportant(row, "align-items", "center");
      setImportant(row, "justify-content", "flex-start");
      setImportant(row, "gap", "8px");
      setImportant(row, "box-sizing", "border-box");
      setImportant(row, "width", "100%");
      setImportant(row, "min-width", "0");
      setImportant(row, "max-width", "100%");
      setImportant(row, "height", "34px");
      setImportant(row, "min-height", "34px");
      setImportant(row, "max-height", "34px");
      setImportant(row, "margin", "0");
      setImportant(row, "padding", "0 14px");
      setImportant(row, "line-height", "34px");
      setImportant(row, "overflow", "hidden");
      setImportant(row, "white-space", "nowrap");
    }

    for (const icon of popup.querySelectorAll(".tree-item > .tree-item-inner > .item-icon, .tree-item > .tree-item-inner > .icon")) {
      if (!isHtmlElement(icon)) continue;
      setImportant(icon, "display", "inline-flex");
      setImportant(icon, "flex", "0 0 20px");
      setImportant(icon, "align-items", "center");
      setImportant(icon, "justify-content", "center");
      setImportant(icon, "width", "20px");
      setImportant(icon, "min-width", "20px");
      setImportant(icon, "max-width", "20px");
      setImportant(icon, "height", "20px");
      setImportant(icon, "margin", "0");
      setImportant(icon, "line-height", "20px");
    }

    for (const textElement of popup.querySelectorAll(".tree-item > .tree-item-inner .item-title, .tree-item > .tree-item-inner .item-content, .tree-item > .tree-item-inner .label, .tree-item > .tree-item-inner .text")) {
      if (!isHtmlElement(textElement)) continue;
      setImportant(textElement, "display", "block");
      setImportant(textElement, "flex", "1 1 auto");
      setImportant(textElement, "width", "auto");
      setImportant(textElement, "min-width", "0");
      setImportant(textElement, "max-width", "100%");
      setImportant(textElement, "height", "34px");
      setImportant(textElement, "line-height", "34px");
      setImportant(textElement, "overflow", "hidden");
      setImportant(textElement, "text-overflow", "ellipsis");
      setImportant(textElement, "white-space", "nowrap");
    }
  }

  function forceProjectPickerInDocument(targetDocument = document, targetWindow = window) {
    if (!targetDocument?.body) return;
    injectForceStyle(targetDocument);
    forceKnownZentaoDropmenu(targetDocument, targetWindow);

    const menuCandidates = Array.from(
      targetDocument.querySelectorAll(
        "#pick-pop-dropmenu-menu, #pick-pop-switcher, .pick-pop.dropmenu, .dropdown-menu, .menu, .picker, .panel, .tree, [class*='dropdown'], [class*='picker'], [class*='tree']"
      )
    );

    for (const menu of menuCandidates) {
      if (!isHtmlElement(menu) || !isVisibleInDocument(menu, targetWindow)) continue;
      const text = textOf(menu);
      const projectCount = (text.match(PROJECT_LIST_PATTERN) || []).length;
      if (projectCount < 2 || !/我负责|其他|项目集|RTOS-ASR|已关闭的产品|搜索/.test(text)) continue;

      forceBox(menu);
      menu.classList.add("tm-zentao-target-dropmenu-pop");
      normalizeProjectPopupRows(menu);
      for (const descendant of menu.querySelectorAll("li, a, button, div, span, [class*='item']")) {
        if (!isHtmlElement(descendant)) continue;
        const lineText = textOf(descendant);
        if (PROJECT_TEXT_PATTERN.test(lineText)) forceTextLine(descendant);
      }
      adjustMenuPosition(menu);
    }
  }

  function getElementWindow(element) {
    return element?.ownerDocument?.defaultView || window;
  }

  function isHtmlElement(element) {
    const view = getElementWindow(element);
    return !!(view?.HTMLElement && element instanceof view.HTMLElement);
  }

  function setImportant(element, property, value) {
    if (isHtmlElement(element)) element.style.setProperty(property, value, "important");
  }

  function forceKnownZentaoDropmenu(targetDocument = document, targetWindow = window) {
    if (!targetDocument?.body) return;

    const roots = targetDocument.querySelectorAll(
      "#dropmenu, #switcher, [z-use-dropmenu], [data-fetcher*='product-ajaxGetDropMenu'], [data-fetcher*='project-ajaxGetDropMenu'], [data-fetcher*='execution-ajaxGetDropMenu']"
    );
    for (const root of roots) {
      if (!isHtmlElement(root)) continue;
      root.classList.add("tm-zentao-dropmenu-root");
      setImportant(root, "overflow", "visible");
      setImportant(root, "width", "auto");
      setImportant(root, "max-width", "min(720px, calc(100vw - 280px))");

      const trigger = root.querySelector(".dropmenu-btn, .pick, button");
      if (isHtmlElement(trigger)) {
        trigger.classList.add("tm-zentao-dropmenu-trigger");
        setImportant(trigger, "width", "auto");
        setImportant(trigger, "min-width", "max-content");
        setImportant(trigger, "max-width", "min(720px, calc(100vw - 280px))");
        setImportant(trigger, "overflow", "visible");
      }

      const text = root.querySelector(".dropmenu-btn > .text, .pick > .text, .text");
      if (isHtmlElement(text)) {
        const value = textOf(text) || root.getAttribute("data-text") || "";
        text.title = value;
        forceTextLine(text, { allowWide: true });
      }
    }

    const popups = targetDocument.querySelectorAll(
      "#pick-pop-dropmenu-menu, #pick-pop-switcher, .pick-pop.dropmenu"
    );
    for (const popup of popups) {
      if (!isHtmlElement(popup) || !isVisibleInDocument(popup, targetWindow)) continue;
      const text = textOf(popup);
      const looksProjectPopup =
        popup.id === "pick-pop-dropmenu-menu" ||
        popup.id === "pick-pop-switcher" ||
        (text.match(PROJECT_LIST_PATTERN) || []).length >= 1 ||
        /我负责|其他|项目集|RTOS-ASR|已关闭的产品|搜索/.test(text);
      if (!looksProjectPopup) continue;

      popup.classList.add("tm-zentao-target-dropmenu-pop", "tm-zentao-readable-box", "tm-zentao-wide-menu");
      forceBox(popup);
      setImportant(popup, "position", "absolute");

      for (const list of popup.querySelectorAll(".dropmenu-list, .tree")) {
        if (!isHtmlElement(list)) continue;
        setImportant(list, "overflow-x", "hidden");
        setImportant(list, "overflow-y", list.classList.contains("dropmenu-list") ? "auto" : "visible");
        setImportant(list, "width", "100%");
        setImportant(list, "min-width", "100%");
        setImportant(list, "max-width", "100%");
      }

      normalizeProjectPopupRows(popup);

      for (const item of popup.querySelectorAll(".item-title, .item-content, .label")) {
        if (!isHtmlElement(item)) continue;
        const itemText = textOf(item);
        if (PROJECT_TEXT_PATTERN.test(itemText)) {
          forceTextLine(item);
        }
      }

      adjustMenuPosition(popup);
    }
  }

  function forceProjectPickerInFrames() {
    for (const iframe of document.querySelectorAll("iframe")) {
      try {
        const frameWindow = iframe.contentWindow;
        const frameDocument = iframe.contentDocument || frameWindow?.document;
        if (!frameDocument?.documentElement) continue;
        frameDocument.documentElement.setAttribute("data-zentao-show-full-text-frame", VERSION);
        injectStyleInto(frameDocument);
        injectForceStyle(frameDocument);
        forceProjectPickerInDocument(frameDocument, frameWindow || frameDocument.defaultView || window);
        applyBugProductFilterInDocument(frameDocument, frameWindow || frameDocument.defaultView || window);
        applyBugColumnLayoutInDocument(frameDocument, frameWindow || frameDocument.defaultView || window);
      } catch (_) {
        // Cross-origin or protected frames are ignored.
      }
    }
  }

  function nearestListItem(element) {
    if (element.closest?.("#table-my-work, .dtable")) return null;
    let current = element;
    for (let depth = 0; current && depth < 5; depth += 1, current = current.parentElement) {
      if (!isHtmlElement(current)) break;
      const tag = current.tagName.toLowerCase();
      const className = String(current.className || "");
      if (/tree-item\b/i.test(className) && !/tree-item-inner\b/i.test(className)) continue;
      if (
        tag === "li" ||
        tag === "a" ||
        tag === "button" ||
        current.getAttribute("role") === "option" ||
        /item|option|project|program|story|bug|cell|row|list|tree/i.test(className)
      ) {
        return current;
      }
    }
    return isHtmlElement(element) ? element : null;
  }

  function shouldTreatAsSingleProjectLine(element) {
    if (!isHtmlElement(element) || element.closest?.("#table-my-work, .dtable")) return false;
    const text = textOf(element);
    if (text.length < 12 || !PROJECT_TEXT_PATTERN.test(text)) return false;
    const matches = text.match(PROJECT_LIST_PATTERN) || [];
    if (matches.length !== 1 || text.length > 140) return false;
    if (element.matches?.(".tree, .dropmenu-list, [class*='list'], [class*='menu'], [class*='panel']")) return false;
    if (element.matches?.(".tree-item:not(.tree-item-inner)")) return false;
    const childItems = element.querySelectorAll?.(".tree-item, .dropmenu-item, li, [role='option']");
    if (childItems && childItems.length > 1) return false;
    const rect = element.getBoundingClientRect?.();
    return !rect || rect.height <= 80;
  }

  function countProjectLines(container) {
    const text = textOf(container);
    return (text.match(PROJECT_LIST_PATTERN) || []).length;
  }

  function nearestReadableContainer(element) {
    if (element.closest?.("#table-my-work, .dtable")) return null;
    let best = null;
    let current = element;

    for (let depth = 0; current && depth < 10; depth += 1, current = current.parentElement) {
      if (!isHtmlElement(current) || current === document.body || current === document.documentElement) break;

      const rect = current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const className = String(current.className || "");
      const likelyMenu = /dropdown|menu|popover|picker|panel|select|tree|list|project|program/i.test(className);
      const enoughItems = countProjectLines(current) >= 2;
      const reasonableBox = rect.width >= 180 && rect.width <= 900 && rect.height >= 80;

      if ((likelyMenu || enoughItems) && reasonableBox) best = current;
      if (enoughItems && rect.height >= 180) return current;
    }

    return best;
  }

  function markProjectTextEverywhere() {
    if (!document.body) return;

    const elements = Array.from(document.querySelectorAll("body *")).filter((element) => {
      if (!isHtmlElement(element) || !isVisible(element)) return false;
      if (element.closest("#table-my-work, .dtable")) return false;
      const text = textOf(element);
      if (text.length < 12 || !PROJECT_TEXT_PATTERN.test(text)) return false;
      const rect = element.getBoundingClientRect();
      return rect.top > -100 && rect.top < window.innerHeight + 100;
    });

    for (const element of elements) {
      const text = textOf(element);
      const looksLikeSingleItem = shouldTreatAsSingleProjectLine(element);

      if (looksLikeSingleItem) {
        element.classList.add("tm-zentao-project-line");
        element.title = text;

        const item = nearestListItem(element);
        if (item) {
          item.classList.add("tm-zentao-project-item", "tm-zentao-project-line");
          item.title = text;
        }
      }

      const container = nearestReadableContainer(element);
      if (container) {
        container.classList.add("tm-zentao-readable-box", "tm-zentao-wide-menu");
        adjustMenuPosition(container);
      }
    }
  }

  function adjustMenuPosition(menu) {
    const rect = menu.getBoundingClientRect();
    const overflowRight = rect.right - (window.innerWidth - 12);
    const overflowLeft = 12 - rect.left;

    if (overflowRight > 0) {
      menu.style.setProperty("transform", `translateX(${-Math.ceil(overflowRight)}px)`, "important");
    } else if (overflowLeft > 0) {
      menu.style.setProperty("transform", `translateX(${Math.ceil(overflowLeft)}px)`, "important");
    }
  }

  function markProjectMenus() {
    if (!document.body) return;

    const possibleMenus = document.querySelectorAll(
      ".dropdown-menu, .popover, .menu, .picker, .panel, [role='menu'], [class*='dropdown'], [class*='menu'], [class*='picker']"
    );

    for (const menu of possibleMenus) {
      if (!isHtmlElement(menu) || !isVisible(menu)) continue;

      const text = textOf(menu);
      const projectMatches = text.match(PROJECT_LIST_PATTERN) || [];
      const looksLikeProjectMenu =
        projectMatches.length >= 2 ||
        (projectMatches.length >= 1 && /我参与的|项目集|其他|搜索/.test(text));

      if (!looksLikeProjectMenu) continue;

      menu.classList.add("tm-zentao-wide-menu");
      markProjectMenuItems(menu);
      adjustMenuPosition(menu);
    }
  }

  function countActionWords(text) {
    return ACTION_WORDS.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
  }

  function getLocalStorage(targetWindow = window) {
    try {
      return targetWindow.localStorage;
    } catch (_) {
      return null;
    }
  }

  function normalizeProductName(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function getProductNameFromCell(cell) {
    const content = cell.querySelector(".dtable-cell-content") || cell;
    return normalizeProductName(content.getAttribute("title") || textOf(content));
  }

  function getBugProductTableState(targetDocument = document, targetWindow = window) {
    const productCells = Array.from(
      targetDocument.querySelectorAll('.dtable-cell[data-col="productName"][data-row]:not([data-row="HEADER"])')
    ).filter(isHtmlElement);

    const rowProducts = new Map();
    const productCounts = new Map();

    for (const cell of productCells) {
      const rowId = cell.getAttribute("data-row");
      const product = getProductNameFromCell(cell);
      if (!rowId || !product) continue;
      rowProducts.set(rowId, product);
      productCounts.set(product, (productCounts.get(product) || 0) + 1);
    }

    const rowCells = new Map();
    for (const cell of targetDocument.querySelectorAll(".dtable-cell[data-row]")) {
      if (!isHtmlElement(cell)) continue;
      const rowId = cell.getAttribute("data-row");
      if (!rowId || rowId === "HEADER" || !rowProducts.has(rowId)) continue;
      if (!rowCells.has(rowId)) rowCells.set(rowId, []);
      rowCells.get(rowId).push(cell);
    }

    const rowOrder = Array.from(rowProducts.keys()).sort((a, b) => {
      const aCell = rowCells.get(a)?.[0];
      const bCell = rowCells.get(b)?.[0];
      const aTop = parseFloat(aCell?.style.top || "0");
      const bTop = parseFloat(bCell?.style.top || "0");
      return aTop - bTop;
    });

    const products = Array.from(productCounts, ([name, count]) => ({ name, count })).sort((a, b) =>
      a.name.localeCompare(b.name, "zh-CN", { numeric: true })
    );

    return {
      productCells,
      rowProducts,
      productCounts,
      rowCells,
      rowOrder,
      products,
      totalRows: rowOrder.length,
    };
  }

  function getSavedProductFilter(targetWindow, products) {
    const storage = getLocalStorage(targetWindow);
    const saved = normalizeProductName(storage?.getItem(PRODUCT_FILTER_STORAGE_KEY) || "");
    if (!saved) return "";
    return products.some((product) => product.name === saved) ? saved : "";
  }

  function saveProductFilter(targetWindow, value) {
    const storage = getLocalStorage(targetWindow);
    try {
      if (!storage) return;
      if (value) storage.setItem(PRODUCT_FILTER_STORAGE_KEY, value);
      else storage.removeItem(PRODUCT_FILTER_STORAGE_KEY);
    } catch (_) {
      // Storage may be blocked by the browser.
    }
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function getDefaultBugColumnLayout(targetDocument = document) {
    const headerCells = Array.from(
      targetDocument.querySelectorAll('#table-my-work .dtable-cell[data-row="HEADER"][data-col]')
    ).filter(isHtmlElement);
    const seen = new Set();
    const columns = [];

    for (const cell of headerCells) {
      const key = cell.getAttribute("data-col");
      const config = BUG_COLUMN_CONFIG[key];
      if (!key || !config || seen.has(key)) continue;
      seen.add(key);
      columns.push({ key, width: config.width });
    }

    for (const [key, config] of Object.entries(BUG_COLUMN_CONFIG)) {
      if (!seen.has(key)) columns.push({ key, width: config.width });
    }

    return columns;
  }

  function sanitizeBugColumnLayout(layout, targetDocument = document) {
    const fallback = getDefaultBugColumnLayout(targetDocument);
    const fallbackKeys = fallback.map((column) => column.key);
    const fallbackWidths = new Map(fallback.map((column) => [column.key, column.width]));
    const rawColumns = Array.isArray(layout?.columns) ? layout.columns : Array.isArray(layout) ? layout : [];
    const byKey = new Map();

    for (const column of rawColumns) {
      const key = String(column?.key || "");
      const config = BUG_COLUMN_CONFIG[key];
      if (!config || byKey.has(key)) continue;
      byKey.set(key, {
        key,
        width: clampNumber(column.width, config.min, config.max, fallbackWidths.get(key) || config.width),
      });
    }

    const orderedKeys = [];
    for (const column of rawColumns) {
      const key = String(column?.key || "");
      if (key !== "actions" && byKey.has(key) && !orderedKeys.includes(key)) orderedKeys.push(key);
    }
    for (const key of fallbackKeys) {
      if (key !== "actions" && byKey.has(key) && !orderedKeys.includes(key)) orderedKeys.push(key);
    }
    for (const key of fallbackKeys) {
      if (key !== "actions" && !orderedKeys.includes(key) && BUG_COLUMN_CONFIG[key]) orderedKeys.push(key);
    }

    const columns = orderedKeys.map((key) => byKey.get(key) || { key, width: fallbackWidths.get(key) || BUG_COLUMN_CONFIG[key].width });
    columns.push(byKey.get("actions") || { key: "actions", width: fallbackWidths.get("actions") || BUG_COLUMN_CONFIG.actions.width });
    return { columns };
  }

  function readBugColumnLayout(targetWindow, targetDocument = document) {
    const storage = getLocalStorage(targetWindow);
    try {
      const saved = storage?.getItem(BUG_COLUMN_LAYOUT_STORAGE_KEY);
      return sanitizeBugColumnLayout(saved ? JSON.parse(saved) : null, targetDocument);
    } catch (_) {
      return sanitizeBugColumnLayout(null, targetDocument);
    }
  }

  function saveBugColumnLayout(targetWindow, layout) {
    const storage = getLocalStorage(targetWindow);
    try {
      storage?.setItem(BUG_COLUMN_LAYOUT_STORAGE_KEY, JSON.stringify(sanitizeBugColumnLayout(layout)));
    } catch (_) {
      // Storage may be blocked by the browser.
    }
  }

  function resetBugColumnLayout(targetWindow) {
    const storage = getLocalStorage(targetWindow);
    try {
      storage?.removeItem(BUG_COLUMN_LAYOUT_STORAGE_KEY);
    } catch (_) {
      // Storage may be blocked by the browser.
    }
  }

  function setStyleIfChanged(element, property, value, priority = "important") {
    if (!isHtmlElement(element) || element.style.getPropertyValue(property) === value) return;
    element.style.setProperty(property, value, priority);
  }

  function setCellGeometry(cell, left, width) {
    setStyleIfChanged(cell, "left", `${left}px`);
    setStyleIfChanged(cell, "width", `${width}px`);
  }

  function getBugColumnLayoutCss(layout, targetDocument = document, rightBlockLeft = null, centerWidth = null, leftWidth = null) {
    const safeLayout = sanitizeBugColumnLayout(layout, targetDocument);
    const middleColumns = safeLayout.columns.filter((column) => column.key !== "actions");
    const actionColumn = safeLayout.columns.find((column) => column.key === "actions") || {
      key: "actions",
      width: BUG_COLUMN_CONFIG.actions.width,
    };
    const rules = [];
    let left = 0;

    rules.push("#table-my-work .dtable-cell,#table-my-work .dtable-cell-content{overflow:hidden!important;text-overflow:ellipsis!important;}");
    rules.push("#table-my-work .dtable-cell-content{min-width:0!important;max-width:100%!important;white-space:nowrap!important;}");
    rules.push("#table-my-work .tm-zentao-project-line,#table-my-work .tm-zentao-project-line *{display:block!important;width:auto!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}");

    for (const column of middleColumns) {
      rules.push(
        `#table-my-work .dtable-cell[data-col="${column.key}"]{left:${left}px!important;width:${column.width}px!important;}`
      );
      left += column.width;
    }

    rules.push(`#table-my-work .dtable-scroll-center .dtable-cells-container{min-width:${left}px!important;}`);
    rules.push(`#table-my-work .dtable-cell[data-col="actions"]{left:0!important;width:${actionColumn.width}px!important;}`);
    rules.push(`#table-my-work .dtable-fixed-right{width:${actionColumn.width}px!important;}`);
    rules.push(`#table-my-work .dtable-fixed-right .dtable-cells-container{width:${actionColumn.width}px!important;}`);

    if (Number.isFinite(rightBlockLeft)) rules.push(`#table-my-work .dtable-fixed-right{left:${rightBlockLeft}px!important;}`);
    if (Number.isFinite(leftWidth)) rules.push(`#table-my-work .dtable-scroll-center{left:${leftWidth}px!important;}`);
    if (Number.isFinite(centerWidth)) rules.push(`#table-my-work .dtable-scroll-center{width:${centerWidth}px!important;}`);

    return rules.join("\n");
  }

  function updateBugColumnLayoutStyle(targetDocument = document, layout, geometry = {}) {
    if (!targetDocument?.documentElement) return;
    let style = targetDocument.getElementById(BUG_COLUMN_STYLE_ID);
    if (!style) {
      style = targetDocument.createElement("style");
      style.id = BUG_COLUMN_STYLE_ID;
      (targetDocument.head || targetDocument.documentElement).appendChild(style);
    }

    const css = getBugColumnLayoutCss(
      layout,
      targetDocument,
      geometry.rightBlockLeft,
      geometry.centerWidth,
      geometry.leftWidth
    );
    if (style.textContent !== css) style.textContent = css;
  }

  function getBugDtableBlocks(targetDocument = document) {
    const table = targetDocument.querySelector("#table-my-work.dtable");
    if (!isHtmlElement(table)) return null;
    const leftCells = Array.from(table.querySelectorAll(".dtable-fixed-left")).filter(isHtmlElement);
    const centerCells = Array.from(table.querySelectorAll(".dtable-scroll-center")).filter(isHtmlElement);
    const rightCells = Array.from(table.querySelectorAll(".dtable-fixed-right")).filter(isHtmlElement);
    const centerContainers = centerCells
      .map((block) => block.querySelector(".dtable-cells-container"))
      .filter(isHtmlElement);
    const rightContainers = rightCells
      .map((block) => block.querySelector(".dtable-cells-container"))
      .filter(isHtmlElement);
    return { table, leftCells, centerCells, rightCells, centerContainers, rightContainers };
  }

  function applyBugColumnLayoutInDocument(targetDocument = document, targetWindow = window) {
    if (!targetDocument?.body) return;
    const blocks = getBugDtableBlocks(targetDocument);
    if (!blocks) {
      targetDocument.getElementById(BUG_COLUMN_SETTINGS_ID)?.remove();
      targetDocument.getElementById(BUG_COLUMN_STYLE_ID)?.remove();
      return;
    }

    const layout = readBugColumnLayout(targetWindow, targetDocument);
    const middleColumns = layout.columns.filter((column) => column.key !== "actions");
    const actionColumn = layout.columns.find((column) => column.key === "actions") || { key: "actions", width: BUG_COLUMN_CONFIG.actions.width };
    let left = 0;

    for (const column of middleColumns) {
      for (const cell of targetDocument.querySelectorAll(`#table-my-work .dtable-cell[data-col="${column.key}"]`)) {
        setCellGeometry(cell, left, column.width);
      }
      left += column.width;
    }

    for (const container of blocks.centerContainers) setStyleIfChanged(container, "min-width", `${left}px`);

    for (const cell of targetDocument.querySelectorAll('#table-my-work .dtable-cell[data-col="actions"]')) {
      setCellGeometry(cell, 0, actionColumn.width);
    }

    const tableWidth = parseFloat(blocks.table.style.width || "") || blocks.table.getBoundingClientRect().width;
    const leftWidth = parseFloat(blocks.leftCells[0]?.style.width || "") || blocks.leftCells[0]?.getBoundingClientRect().width || 0;
    const rightBlockLeft = Math.max(leftWidth, Math.round(tableWidth - actionColumn.width));
    for (const block of blocks.rightCells) setStyleIfChanged(block, "width", `${actionColumn.width}px`);
    for (const container of blocks.rightContainers) setStyleIfChanged(container, "width", `${actionColumn.width}px`);
    for (const block of blocks.rightCells) setStyleIfChanged(block, "left", `${rightBlockLeft}px`);

    const centerWidth = Math.max(0, rightBlockLeft - leftWidth);
    for (const block of blocks.centerCells) {
      setStyleIfChanged(block, "left", `${leftWidth}px`);
      setStyleIfChanged(block, "width", `${centerWidth}px`);
    }

    updateBugColumnLayoutStyle(targetDocument, layout, { rightBlockLeft, centerWidth, leftWidth });
    updateBugColumnSettingsControl(targetDocument, targetWindow, layout);
  }

  function getEditableBugColumnRows(layout) {
    return layout.columns.filter((column) => BUG_COLUMN_CONFIG[column.key]);
  }

  function renderBugColumnSettingsRows(panel, layout) {
    const list = panel.querySelector(".tm-zentao-column-settings-list");
    if (!list) return;
    const columns = getEditableBugColumnRows(layout);
    list.textContent = "";

    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const config = BUG_COLUMN_CONFIG[column.key];
      const row = panel.ownerDocument.createElement("div");
      row.className = "tm-zentao-column-settings-row";
      row.dataset.key = column.key;
      row.innerHTML = `
        <label title="${config.label}">${config.label}</label>
        <input type="number" min="${config.min}" max="${config.max}" step="4" value="${column.width}" aria-label="${config.label}宽度">
        <button type="button" class="tm-zentao-column-move" data-move="-1" aria-label="${config.label}上移">↑</button>
        <button type="button" class="tm-zentao-column-move" data-move="1" aria-label="${config.label}下移">↓</button>
      `;
      list.appendChild(row);
    }

    const rows = Array.from(list.querySelectorAll(".tm-zentao-column-settings-row"));
    for (let index = 0; index < rows.length; index += 1) {
      const key = rows[index].dataset.key;
      const isAction = key === "actions";
      const up = rows[index].querySelector('[data-move="-1"]');
      const down = rows[index].querySelector('[data-move="1"]');
      if (up) up.disabled = isAction || index === 0;
      if (down) down.disabled = isAction || index >= rows.length - 2;
    }
  }

  function readBugColumnLayoutFromPanel(panel, targetDocument = document) {
    const columns = [];
    for (const row of panel.querySelectorAll(".tm-zentao-column-settings-row")) {
      const key = row.dataset.key;
      const config = BUG_COLUMN_CONFIG[key];
      const input = row.querySelector("input");
      if (!config || !input) continue;
      columns.push({
        key,
        width: clampNumber(input.value, config.min, config.max, config.width),
      });
    }
    return sanitizeBugColumnLayout({ columns }, targetDocument);
  }

  function ensureBugColumnSettingsPanel(item, targetDocument, targetWindow, layout) {
    let panel = item.querySelector(`#${BUG_COLUMN_PANEL_ID}`);
    if (!panel) {
      panel = targetDocument.createElement("div");
      panel.id = BUG_COLUMN_PANEL_ID;
      panel.className = "tm-zentao-column-settings-panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="tm-zentao-column-settings-head">
          <span>列设置</span>
          <button type="button" class="tm-zentao-column-settings-close" aria-label="关闭">×</button>
        </div>
        <div class="tm-zentao-column-settings-list"></div>
        <div class="tm-zentao-column-settings-actions">
          <button type="button" class="tm-zentao-column-reset">重置</button>
          <button type="button" class="tm-zentao-column-save">保存</button>
        </div>
      `;
      item.appendChild(panel);

      panel.addEventListener("click", (event) => {
        const target = event.target;
        if (!isHtmlElement(target)) return;
        const moveButton = target.closest(".tm-zentao-column-move");
        if (moveButton && isHtmlElement(moveButton) && !moveButton.disabled) {
          const row = moveButton.closest(".tm-zentao-column-settings-row");
          const direction = Number(moveButton.getAttribute("data-move") || "0");
          const sibling = direction < 0 ? row?.previousElementSibling : row?.nextElementSibling;
          if (row && sibling && row.dataset.key !== "actions" && sibling.dataset.key !== "actions") {
            if (direction < 0) row.parentElement.insertBefore(row, sibling);
            else row.parentElement.insertBefore(sibling, row);
            renderBugColumnSettingsRows(panel, readBugColumnLayoutFromPanel(panel, targetDocument));
          }
          return;
        }

        if (target.closest(".tm-zentao-column-settings-close")) {
          panel.hidden = true;
          return;
        }

        if (target.closest(".tm-zentao-column-reset")) {
          resetBugColumnLayout(targetWindow);
          const freshLayout = sanitizeBugColumnLayout(null, targetDocument);
          renderBugColumnSettingsRows(panel, freshLayout);
          updateBugColumnLayoutStyle(targetDocument, freshLayout);
          applyBugColumnLayoutInDocument(targetDocument, targetWindow);
          return;
        }

        if (target.closest(".tm-zentao-column-save")) {
          const nextLayout = readBugColumnLayoutFromPanel(panel, targetDocument);
          saveBugColumnLayout(targetWindow, nextLayout);
          updateBugColumnLayoutStyle(targetDocument, nextLayout);
          applyBugColumnLayoutInDocument(targetDocument, targetWindow);
          panel.hidden = true;
        }
      });

      panel.addEventListener("change", (event) => {
        const input = event.target;
        if (!isHtmlElement(input) || input.tagName !== "INPUT") return;
        const row = input.closest(".tm-zentao-column-settings-row");
        const config = BUG_COLUMN_CONFIG[row?.dataset.key];
        if (config) input.value = String(clampNumber(input.value, config.min, config.max, config.width));
      });
    }

    if (panel.hidden) renderBugColumnSettingsRows(panel, layout);
    return panel;
  }

  function updateBugColumnSettingsControl(targetDocument, targetWindow, layout) {
    if (!targetDocument.body || !targetDocument.querySelector("#table-my-work.dtable")) {
      targetDocument.getElementById(BUG_COLUMN_SETTINGS_ID)?.remove();
      return;
    }

    let item = targetDocument.getElementById(BUG_COLUMN_SETTINGS_ID);
    if (!item) {
      item = targetDocument.createElement("div");
      item.id = BUG_COLUMN_SETTINGS_ID;
      item.className = "tm-zentao-column-settings-item";
      item.innerHTML = `<button type="button" class="tm-zentao-column-settings-button">列设置</button>`;
      targetDocument.body.appendChild(item);

      item.querySelector(".tm-zentao-column-settings-button")?.addEventListener("click", () => {
        const currentLayout = readBugColumnLayout(targetWindow, targetDocument);
        const panel = ensureBugColumnSettingsPanel(item, targetDocument, targetWindow, currentLayout);
        panel.hidden = !panel.hidden;
        if (!panel.hidden) renderBugColumnSettingsRows(panel, currentLayout);
      });
    }

    ensureBugColumnSettingsPanel(item, targetDocument, targetWindow, layout);
  }

  function findBugProductFilterMount(targetDocument) {
    const nav = targetDocument.querySelector("#featureBar menu.nav, #featureBar .nav");
    if (!nav) return null;
    const searchButton = nav.querySelector(".search-form-toggle");
    const before = searchButton?.closest("li") || null;
    return { nav, before };
  }

  function updateProductFilterControl(targetDocument, targetWindow, state, selectedValue, visibleCount) {
    const mount = findBugProductFilterMount(targetDocument);
    if (!mount || !state.products.length) {
      targetDocument.getElementById(PRODUCT_FILTER_ID)?.remove();
      return;
    }

    let item = targetDocument.getElementById(PRODUCT_FILTER_ID);
    if (!item) {
      item = targetDocument.createElement("li");
      item.id = PRODUCT_FILTER_ID;
      item.className = "tm-zentao-product-filter-item";
      item.innerHTML = `
        <label class="tm-zentao-product-filter">
          <span>所属产品</span>
          <select aria-label="所属产品"></select>
          <span class="tm-zentao-product-filter-count"></span>
        </label>
      `;
      mount.nav.insertBefore(item, mount.before);
    }

    const select = item.querySelector("select");
    const count = item.querySelector(".tm-zentao-product-filter-count");
    if (!select || !count) return;

    const signature = state.products.map((product) => `${product.name}:${product.count}`).join("|");
    if (select.dataset.tmZentaoProductsSignature !== signature) {
      select.textContent = "";
      const allOption = targetDocument.createElement("option");
      allOption.value = "";
      allOption.textContent = `全部产品 (${state.totalRows})`;
      select.appendChild(allOption);

      for (const product of state.products) {
        const option = targetDocument.createElement("option");
        option.value = product.name;
        option.textContent = `${product.name} (${product.count})`;
        select.appendChild(option);
      }
      select.dataset.tmZentaoProductsSignature = signature;
    }

    select.value = selectedValue;
    item.classList.toggle("tm-zentao-product-filter-empty", !selectedValue);
    const countText = selectedValue ? `${visibleCount}/${state.totalRows}` : `本页 ${state.totalRows}`;
    if (count.textContent !== countText) count.textContent = countText;
    select.onchange = () => {
      saveProductFilter(targetWindow, select.value);
      applyBugProductFilterInDocument(targetDocument, targetWindow);
    };
  }

  function applyBugProductFilterInDocument(targetDocument = document, targetWindow = window) {
    if (!targetDocument?.body) return;

    const state = getBugProductTableState(targetDocument, targetWindow);
    if (!state.totalRows) {
      targetDocument.getElementById(PRODUCT_FILTER_ID)?.remove();
      return;
    }

    const selected = getSavedProductFilter(targetWindow, state.products);
    let visibleCount = 0;

    for (const rowId of state.rowOrder) {
      const product = state.rowProducts.get(rowId);
      const rowVisible = !selected || product === selected;
      const cells = state.rowCells.get(rowId) || [];

      for (const cell of cells) {
        cell.classList.toggle("tm-zentao-filter-hidden-row", !rowVisible);
      }

      if (rowVisible) {
        visibleCount += 1;
      }
    }

    updateProductFilterControl(targetDocument, targetWindow, state, selected, visibleCount);
  }

  function markFloatingActionBar() {
    if (!document.body) return;

    const candidates = Array.from(document.querySelectorAll("body *")).filter((element) => {
      if (!isHtmlElement(element) || !isVisible(element)) return false;

      const rect = element.getBoundingClientRect();
      if (rect.width < 180 || rect.width > window.innerWidth || rect.height < 28 || rect.height > 120) return false;
      if (rect.bottom < window.innerHeight - 180) return false;

      const style = window.getComputedStyle(element);
      const isFloating = style.position === "fixed" || style.position === "sticky";
      if (!isFloating) return false;

      return countActionWords(textOf(element)) >= 3;
    });

    for (const actionBar of candidates) {
      actionBar.classList.add("tm-zentao-action-bar");
    }
  }

  let pending = false;
  function scheduleEnhance() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(() => {
      pending = false;
      injectStyle();
      showRunBadge();
      markTopProject();
      markProjectTextEverywhere();
      markProjectMenus();
      forceProjectPickerInDocument(document, window);
      forceProjectPickerInFrames();
      applyBugProductFilterInDocument(document, window);
      applyBugColumnLayoutInDocument(document, window);
      markFloatingActionBar();
    });
  }

  injectStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleEnhance, { once: true });
  } else {
    scheduleEnhance();
  }

  window.addEventListener("resize", scheduleEnhance);
  window.addEventListener("click", () => window.setTimeout(scheduleEnhance, 80), true);
  window.addEventListener("keyup", () => window.setTimeout(scheduleEnhance, 80), true);

  new MutationObserver(scheduleEnhance).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "aria-expanded"],
  });
})();
