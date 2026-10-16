# ATM Disputes — Interactive Data Portfolio

A static site built around the three source artifacts in `dist/files/`.

- Black background; Times New Roman throughout.
- SheetJS reads the original XLSX in the browser.
- HyperFormula evaluates the original Excel formulas and updates dependent cells.
- Editable Cases inputs and Guide settings are validated against the declared 2025 working-hours model.
- A dedicated Web Worker runs SQLite via sql.js. Every accepted workbook edit rebuilds the SQL snapshot.
- Eight original queries, custom SQL, visible result tables and CSV exports.
- Vietnamese source report rendered as HTML, plus all three originals for download.
- No server-side personal records or cross-visitor edits; experiments live only in the browser tab.

## Checks

`node test.cjs` checks the baseline summary, all eight SQL queries, every per-case Excel/SQL metric, reply-target changes, missing feedback, low-rating threshold, an overdue refund, input rejection and edited XLSX export/import. `node ui-check.cjs` checks DOM references and local assets. JavaScript syntax checks are included in publication.

Browser visual QA was unavailable in the managed environment. Responsive CSS and semantic HTML are included; the formula engine, SQLite worker logic, browser globals and asset references were checked programmatically.

## Source and licenses

Site application code is licensed under GNU GPL version 3. Full license: `dist/assets/gpl-3.0.txt`. Third-party notices are in `dist/assets/licenses.txt`. HyperFormula is used under its GPLv3 option; its source archive and notices are linked in the website. SheetJS CE uses Apache 2.0 and sql.js uses MIT. The synthetic data is illustrative and makes no claims about a real employee's performance.
