# Contributing to TestDummy

Thanks for helping out! Bug reports, field-detection fixes, and Smart Fill improvements are all welcome.

## Setup

```bash
npm install
npm run dev   # rebuilds dist/ on change
```

Load `dist/` as an unpacked extension at `chrome://extensions`, then click the reload icon on the extension card after each rebuild.

## Making a change

1. Fork the repo and branch off `development`
2. Keep pull requests focused on one change
3. Run `npm test` and `npm run lint` before pushing (CI runs both, plus the build)
4. Open your PR against `development`

## Reporting a form that doesn't fill

Field detection is heuristic, so real-world forms are the most useful bug reports. Please include:

- The HTML of the fields that were missed or filled wrong (`name`, `id`, `placeholder`, `type`, and the label text)
- Which mode you used (Signup or Smart Fill)
- What got filled versus what you expected

Never paste real personal data or production credentials into an issue.
