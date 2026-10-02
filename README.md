# TestDummy

A Chrome extension that fills forms with test data on local and staging sites. Press **Alt+Shift+F** and the signup form is done.

Every signup gets a fresh email (`test+1@example.com`, `test+2@example.com`, …), so you never hit "email already taken" while testing.

## Features

- **Signup mode**: fills email, name, password, and confirm-password fields from a saved profile
- **Smart Fill mode**: fills *any* form (addresses, phone numbers, company info, dates, dropdowns, checkboxes) with realistic fake data, based on each field's labels, names, and placeholders
- **Unique emails**: counter (`+1`, `+2`, …) or timestamp-based plus-addressing
- **Profiles**: keep multiple test identities, with custom field selectors for tricky forms
- **Domain allowlist**: choose which sites it's allowed to fill
- **Framework-friendly input**: dispatches real input events, so React and Vue forms register the values
- **Export/import**: back up your profiles and settings as JSON

Everything runs locally in your browser. No accounts, no network requests, no analytics. See the [privacy policy](PRIVACY_POLICY.md).

## Install from source

Requires Node.js 18+.

```bash
git clone https://github.com/coreyhaines31/testdummy.git
cd testdummy
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

## Usage

1. Open a page with a form on an allowed domain
2. Press **Alt+Shift+F**, or click the toolbar icon and hit **Autofill**
3. Switch the popup to **Smart Fill** to fill non-signup forms

Set your own email prefix, domain, and password in the extension's options page. Change the shortcut at `chrome://extensions/shortcuts`.

`test-page.html` is a sample signup form you can use to try it out.

## Development

```bash
npm run dev      # rebuild on change
npm test         # Jest tests
npm run lint     # ESLint
npm run package  # zip dist/ for the Chrome Web Store
```

| File | Role |
|------|------|
| `background.js` | Service worker: shortcut handling, script injection, default settings |
| `content.js` | Runs in the page: finds fields and fills them |
| `popup-fixed.html/js` | Toolbar popup (Signup / Smart Fill modes) |
| `options.html/js` | Profiles, domains, and settings |
| `utils/field-detection.js` | Signup field detection |
| `utils/smart-field-detector.js` | Field classification for Smart Fill |
| `utils/value-generator.js` | Fake data for Smart Fill |
| `utils/input-simulation.js` | Input events that frameworks recognize |
| `utils/email-generator.js` | Unique email generation |

Scripts are injected on demand using the `activeTab` permission, so the extension can't read a page until you trigger it.

## Contributing

Issues and pull requests are welcome. Please run `npm test` and `npm run lint` before opening a PR.

## License

[MIT](LICENSE)
