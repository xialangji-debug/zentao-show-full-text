# ZenTao Show Full Text

A Tampermonkey userscript for ZenTao/ChanDao pages. It improves long project/product text display, adds a product filter for Bug lists, and keeps custom Bug table column layout settings.

## Features

- Show long ZenTao project/product names more safely in top menus and dropdowns.
- Reduce dropdown clipping, overlap, and row misalignment.
- Add a "所属产品" filter on Bug list pages.
- Support persistent Bug table column width and order settings.
- Save user settings in browser `localStorage`.

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

After installation, refresh ZenTao. A small badge like `ZenTao Full Text 1.0.0` appears briefly when the script runs.

On Bug list pages, use:

- `所属产品` filter to show Bug rows for one product.
- `列设置` to adjust Bug table column width and order.

## Authors

- xiakezhen
- Codex

## License

MIT License. See [LICENSE](LICENSE).
