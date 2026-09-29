# ZenTao Show Full Text

A Tampermonkey userscript for ZenTao pages. It improves long project/product names in the ZenTao switcher and adds Bug table controls when the current table can be identified safely.

## Features

- Size the ZenTao switcher popup from its longest loaded project/product name, with a viewport width limit and wrapping for longer names.
- Show the selected project/product name directly in the header without ellipsis, and retain its hover title.
- Add a page-local "所属产品" filter when a Bug table contains a product column. It filters the currently rendered rows only; ZenTao's pagination and total count are unchanged.
- Support persistent Bug table column width and order settings for columns present in the current table. No layout override is applied until settings are saved.
- Save user settings in browser `localStorage`.
- Support same-origin ZenTao application iframes through one top-level observer.
- Keep custom column overflow inside the middle table area and synchronize header/body scrolling.

## Install

1. Install Tampermonkey or another compatible userscript manager.
2. Open the raw script URL:
   `https://raw.githubusercontent.com/xialangji-debug/zentao-show-full-text/main/zentaopms-show-full-text.user.js`
3. Confirm installation in Tampermonkey.
4. Refresh the ZenTao page.

No browser restart is required.

## Auto Update

The userscript includes `@updateURL` and `@downloadURL` metadata pointing to the GitHub raw script file.

When publishing a new release:

1. Update `@version` in `zentaopms-show-full-text.user.js`, for example from `1.0.0` to `1.0.1`.
2. Commit and push the updated script to the `main` branch.
3. Tampermonkey will detect the newer version during its normal update check and download the new script.

## Usage

After installation, refresh ZenTao.

On Bug list pages, use:

- `所属产品` to filter currently rendered Bug rows, when the product column is available.
- `列设置` to adjust available Bug columns. `重置` removes the saved override and restores ZenTao's own layout.

The controls do not appear on story, requirement, or other non-Bug tables. On a product-specific Bug page without a product column, only `列设置` is shown.

ZenTao uses virtual rendering. The product filter covers rendered rows, which may be fewer than the page size; it preserves native row positions and can leave blank space. Use ZenTao's own search for complete result filtering. Long table titles retain ZenTao's native truncation; the full-name enhancement applies to the switcher popup.

## Validation of the local 1.1.0 revision

Checked on ZenTao 21.7.1 in the Codex in-app browser using temporary script injection: product Bug column save/reset, persistence after reload and reinjection, synchronized horizontal scrolling, long switcher names, story-table isolation, and product filtering on the personal Bug list. Also checked JavaScript syntax and local DOM regression cases.

This does not verify installation or automatic updates in Tampermonkey. Install the published revision using the raw script URL above, or replace the existing script content in Tampermonkey. Disable duplicate older copies.

## Authors

- xiakezhen
- Codex

## License

MIT License. See [LICENSE](LICENSE).
