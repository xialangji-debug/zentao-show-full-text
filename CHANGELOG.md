# Changelog

## 1.1.1 - 2026-09-29

- Size the product/project switcher popup intrinsically from its longest loaded name instead of a fixed pixel width.
- Display the selected product/project name in the header without ellipsis.
- Let long names wrap when the viewport limits available width.
- Verified on the live ZenTao 21.7.1 menu: all 73 product names fit; changing a label expands the popup and restoring it shrinks the popup again.

## 1.1.0 - 2026-09-28

- Limit layout changes to identified Bug tables; leave requirement and story tables untouched.
- Remove unused legacy styles and broad menu/table overrides.
- Keep native Bug column geometry until a user saves a custom layout; reset removes the override.
- Make the product filter explicitly page-local and show it only when product cells are available.
- Narrow userscript URL matching and reduce repeated DOM processing.
- Set the product switcher popup width to 280px while allowing long names to wrap.
- Recognize product Bug tables with ID `bugs`, including encoded iframe routes.
- Observe same-origin application frames from the top-level script and prevent duplicate frame injection.
- Contain custom column overflow and synchronize header/body horizontal scrolling; reset restores native scrolling.

## 1.0.0 - 2026-06-15

Initial stable open source release.

- Improved long ZenTao project/product name display.
- Added compact project dropdown layout to reduce row spacing and misalignment.
- Added Bug list product filtering by "所属产品".
- Added persistent Bug table column width and order settings.
- Added MIT license metadata.
