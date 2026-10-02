# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TestDummy is a Chrome extension (Manifest V3) that automatically fills signup forms with test accounts for local and staging environments. It uses modern JavaScript with Webpack bundling and provides keyboard shortcuts for quick form filling.

## Build Commands

```bash
npm run build    # Build production bundle to dist/
npm run dev      # Build with watch mode for development
npm run lint     # Run ESLint
npm run test     # Run Jest tests
npm run package  # Create zip file for distribution
```

## Architecture

### Extension Components
- **background.js**: Service worker handling commands, storage initialization, and extension lifecycle
- **content.js**: Injected into web pages to detect and fill forms (includes wait-and-retry pattern for dynamic forms)
- **popup-fixed.html/js**: Extension popup (Signup and Smart Fill modes)
- **options.js/html**: Settings page for managing profiles and preferences

### Utility Modules (utils/)
- **storage-manager.js**: Handles Chrome storage API operations
- **field-detection.js**: Analyzes DOM to identify form fields
- **input-simulation.js**: Simulates human-like input events
- **email-generator.js**: Creates unique test emails with versioning

### Build Configuration
- **webpack.config.js**: Bundles entry points (background, content) with Babel transpilation
- Output directory: `dist/`
- Copies static assets (manifest.json, HTML, CSS) via CopyPlugin

## Key Features

1. **Profile System**: Stores multiple test user profiles with customizable field mappings
2. **Email Versioning**: Generates unique emails using counter strategy (e.g., test+1@example.com)
3. **Smart Field Detection**: Identifies form fields by name, id, placeholder, and label text
4. **Wait-and-Retry Pattern**: Attempts to find form fields up to 10 times with 200ms delays for dynamic forms
5. **Keyboard Shortcut**: Alt+Shift+F for quick autofill
6. **Visual Indicators**: Shows "TestDummy Ready" on page load and success/error notifications after autofill
7. **Domain Restrictions**: Configured for localhost and all HTTPS sites

## Testing Approach

The extension can be tested by:
1. Loading unpacked extension from `dist/` folder in Chrome
2. Navigate to localhost or staging site with forms
3. Use Alt+Shift+F or popup button to trigger autofill
4. Check console logs for debug output when debugMode is enabled

## Chrome Extension Manifest

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: storage, scripting, activeTab
- **Host Permissions**: Now includes all HTTPS sites (`https://*/*`) in addition to localhost
- **Content Scripts**: Auto-inject with all utility modules loaded in sequence:
  - storage-manager.js, email-generator.js, field-detection.js, input-simulation.js, then content.js

## Chrome Web Store Submission Checklist

### Pre-Submission Steps

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Verify dist/ folder contains:**
   - All JavaScript files (background.js, content.js, options.js, popup-fixed.js)
   - All HTML files (popup-fixed.html, options.html)
   - All CSS files (options.css) - **Important**: options.css was missing before
   - All icon files (16x16, 48x48, 128x128 PNG and SVG)
   - All utils/ files (storage-manager.js, email-generator.js, field-detection.js, input-simulation.js)
   - manifest.json

3. **Test the options page:**
   - All buttons must work: Add Profile, Add Domain, Export/Import/Reset Settings
   - Tab switching works: Profiles, Domains, Settings
   - Profile modal opens and closes correctly
   - Form submission works

4. **Create zip package:**
   ```bash
   npm run package
   ```
   Upload `testdummy-extension.zip` to Chrome Web Store

### Recent Fixes

- ✅ Added null checks for all DOM elements in `setupEventListeners()` to prevent errors
- ✅ Fixed initialization to wait for DOMContentLoaded
- ✅ Added error handling with try-catch blocks
- ✅ Added `options.css` to webpack.config.js CopyPlugin patterns
- ✅ Fixed `switchTab()` method with null checks
- ✅ Prevents double initialization with `window.optionsManager` check

### Important Notes

- The options page was rejected 4 times due to non-working buttons - all buttons now have proper null checks
- Only mention features in Chrome Web Store description that are fully implemented and tested
- Options page is critical - test all buttons before submitting