# Changelog - The Grotto

All notable changes to the Grotto Web App will be documented in this file.

---

## [v1.1.0] - 2026-03-17

### Added
- **Archive Logic Restored:** Setters can now archive/unarchive routes directly from the `RouteViewer` interface.
- **Visual Feedback:** Added a pulsing red state for archived routes to prevent accidental public listing.
- **Haptic Feedback:** Integrated vibration API for "Mark as Sent" actions to enhance user satisfaction on mobile devices.
- **Persistence:** High contrast and marker style preferences now persist across sessions using `localStorage`.

### Fixed
- **UI Overflow:** Fixed an issue where the new Settings menu pushed the Route Info header off-screen.
- **Marker Selection:** Restored the floating hold-type selector in Edit Mode for faster route setting.
- **Filtering:** Refined the grade filter bar for better horizontal scrolling on smaller mobile devices.

### Changed
- **Launch Experience:** Updated Splash Screen to reflect Beta v1.1.
- **System Theme:** Switched to a higher-contrast blue/black aesthetic for better visibility in gym lighting.

---

## [v1.0.0] - 2026-01-15
- Initial Beta Release.
- Image-stitching for multi-wall routes.
- Basic marker placement and Supabase integration.
- Public route gallery.