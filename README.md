# TestDummy Chrome Extension

A Chrome extension that automatically fills signup forms with test account data for local and staging environments. Built with vanilla JavaScript and Webpack.

## Features

- **Smart Form Autofill**: Automatically detects and fills email, name, and password fields
- **Profile Management**: Create and manage multiple test account profiles with customizable field mappings
- **Export/Import Settings**: Backup and share your profiles and settings across devices
- **Unique Email Generation**: Counter or timestamp-based email generation to avoid duplicates
- **Keyboard Shortcut**: Quick autofill with Alt+Shift+F (configurable)
- **Domain Customization**: Configure which domains the extension works on
- **Options Page**: Comprehensive settings UI with tabs for profiles, domains, and general settings
- **Visual Feedback**: Success/error notifications and "TestDummy Ready" indicator
- **Smart Field Detection**: Identifies form fields by name, id, placeholder, and label text
- **Dynamic Form Support**: Wait-and-retry pattern for forms loaded dynamically

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. For development with auto-rebuild:
   ```bash
   npm run dev
   ```

### Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. The extension should now appear in your extensions list

## Project Structure

```
testdummy/
├── manifest.json          # Extension manifest
├── popup.html            # Popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── background.js         # Service worker
├── content.js            # Content script
├── webpack.config.js     # Build configuration
├── package.json          # Dependencies and scripts
└── dist/                 # Built extension (after npm run build)
```

## Scripts

- `npm run build` - Build the extension for production (outputs to `dist/`)
- `npm run dev` - Build and watch for changes during development
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests
- `npm run package` - Create a zip file for Chrome Web Store submission

## Chrome Web Store Submission

### Before Submitting

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Verify the build:**
   - Check that `dist/` folder contains all necessary files:
     - `manifest.json`
     - `background.js`, `content.js`
     - `popup-fixed.html`, `popup-fixed.js`, `popup.html`, `popup.js`
     - `options.html`, `options.js`, `options.css`
     - `icons/` folder with all icon sizes (16, 48, 128)
     - `utils/` folder with all utility modules
     - `popup.css`

3. **Test the extension:**
   
   **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Navigate to and select the `dist/` folder from this project
   - The extension should now appear in your extensions list
   
   **Test Options Page (CRITICAL - this caused rejections):**
   - Right-click the extension icon → Select "Options" (or go to `chrome://extensions/` → find TestDummy → click "Extension options")
   - **Test tab switching:**
     - Click "Profiles" tab → Should show profiles section
     - Click "Domains" tab → Should show domains section
     - Click "Settings" tab → Should show settings section
   - **Test "Add Profile" button:**
     - Click "+ Add Profile" button
     - Modal should open
     - Fill in test data and click "Save Profile"
     - Profile should appear in the list
   - **Test profile editing:**
     - Click "Edit" button on a profile
     - Modal should open with existing data
     - Make a change and save
     - Changes should be reflected
   - **Test "Add Domain" button:**
     - Go to "Domains" tab
     - Enter a domain like "localhost:3000"
     - Click "Add Domain"
     - Domain should appear in the list
   - **Test "Export Settings" button:**
     - Click "Export Settings" button
     - A JSON file should download
   - **Test "Import Settings" button:**
     - Click "Import Settings" button
     - File picker should open
     - Select the exported JSON file
     - Settings should update
   - **Test "Reset All Settings" button:**
     - Click "Reset All Settings"
     - Confirm the dialog
     - All settings should reset to defaults
   - **Test modal close buttons:**
     - Open a profile modal
     - Click "Cancel" → Modal should close
     - Open modal again
     - Click "×" (close) button → Modal should close
   
   **Test Autofill:**
   - Navigate to a test page with a signup form (e.g., localhost:3000)
   - Right-click the extension icon → Click "Autofill" (or press Alt+Shift+F)
   - Form fields should be filled with test data
   
   **Test Keyboard Shortcut:**
   - On a page with a form, press Alt+Shift+F
   - Form should autofill

4. **Create the zip file:**
   ```bash
   npm run package
   ```
   This creates `testdummy-extension.zip` in the project root.

### Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload `testdummy-extension.zip`
3. Fill in store listing details:
   - Name: TestDummy
   - Description: Mention all working features, especially the options page
   - Screenshots: Include options page screenshot showing buttons work
   - Privacy policy: Required
4. **Important**: In the description, only mention features that are actually working:
   - ✅ Options page with buttons for profile management
   - ✅ Domain allowlist management
   - ✅ Settings export/import/reset
   - ✅ Keyboard shortcut (Alt+Shift+F)
   - ✅ Autofill form fields

### Common Rejection Issues

- **Options page buttons not working**: Make sure all buttons have null checks and proper event listeners
- **Missing functionality**: Only mention features that are fully implemented and tested
- **Missing files**: Ensure `options.css` is included in the build (now fixed in webpack config)

## API Integration Ready

The extension is structured to easily integrate with AI APIs like Claude:

- Background script handles API calls
- Content script extracts page data
- Popup provides user interface
- Storage system for caching and settings

## Permissions

- `activeTab`: Access to the current tab
- `storage`: Save settings and data
- `scripting`: Inject content scripts
- `host_permissions`: Access to all websites

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
