# Singlish → Sinhala Playwright Test Suite

This project scaffolds Playwright tests (JavaScript) to validate a Singlish→Sinhala conversion application.

Quick start:
1. Install deps: npm install
2. Install Playwright browsers: npx playwright install
3. Run tests: npm test

Notes:
- Update selectors in `tests/singlish-sinhala.spec.js` (`SELECTORS`) to match your app's DOM.
- Place Excel (.xlsx) or CSV test data in `tests/data/` and update `tests/utils/excel-loader.js` if needed.
