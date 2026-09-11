# FleetDesk test execution report

Final recorded test run: **2026-09-11T09:53:04.823Z**. The suite ran in a Linux environment using **Node.js v24.19.0**.

## Results

| Check                       | Actual result                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated tests             | 62 passed, 0 failed, 0 pending                                                                                                                     |
| Test files                  | 2 passed                                                                                                                                           |
| Domain tests                | 46 passed, including parameterized cases                                                                                                           |
| Component interaction tests | 16 passed                                                                                                                                          |
| Production build            | Passed using Vite                                                                                                                                  |
| Lint check                  | Passed using Oxlint                                                                                                                                |
| npm dependency audit        | 0 reported vulnerabilities in the 10 September 2026 audit; dependencies unchanged                                                                  |
| Submission readiness        | Both team identities complete; two-person team recorded against the brief's three-person wording; project upload awaits write access; the team will submit to the course |

## Coverage

The V8 report targets application JavaScript and JSX. The React entry point and data configuration files are excluded from the coverage target. Passing tests and coverage do not establish that every browser behavior is correct.

| Metric     | Covered | Total | Percentage |
| ---------- | ------: | ----: | ---------: |
| lines      |     180 |   191 |     94.24% |
| statements |     203 |   215 |     94.41% |
| functions  |      77 |    83 |     92.77% |
| branches   |     197 |   218 |     90.36% |

## What the tests exercise

`tests/assets.test.js` covers every sample record, required inputs, duplicate tags and serials, unchanged identifiers on edit, valid and invalid costs, invalid and future dates, assignment rules, allowed types/statuses/departments, text limits, immutable create/update/delete, missing records, case-insensitive multi-word search, combined filters, sort order, monetary totals, and zero-denominator summaries.

`tests/App.test.jsx` covers the rendered inventory, menu navigation and both supplied team identities, adding a record, required-field errors and focus, duplicate rejection during editing, successful editing, assignment requirements, cancel and confirm deletion, complete record details, dialog cancellation, searching and clearing filters, sorting, cancelling unsaved edits, HTML-like text escaping, state reset on remount, and the skip-link route regression.

## Reproduce

```bash
npm ci
npm test
npm run test:coverage
npm run lint
npm run build
npm run check:submission
```

`npm run test:report` regenerates `docs/test-results.json` and the coverage output. `docs/coverage-summary.json` is the retained summary from the recorded run. `docs/dependency-audit.json` retains the npm audit output.

## Toolchain

| Package                | Resolved version |
| ---------------------- | ---------------- |
| react                  | 19.3.0           |
| react-dom              | 19.3.0           |
| vite                   | 8.2.2            |
| vitest                 | 5.0.0            |
| @testing-library/react | 16.3.3           |
| jsdom                  | 30.0.1           |

## Production output

| File                           |  Bytes | Gzip bytes |
| ------------------------------ | -----: | ---------: |
| dist/index.html                |    712 |        417 |
| dist/assets/index-DY59Awsx.js  | 254127 |      78322 |
| dist/assets/index-DoGbaxIO.css |  18296 |       4763 |

## Limits of verification

- Tests execute in jsdom, not a real browser. The native dialog open/close methods are polyfilled in the test environment; browser focus trapping, rendering, responsive layout, and assistive-technology behavior are not certified by these results.
- The Windows convenience launcher has been inspected but was not executed on Windows.
- The CI workflow is supplied, but no GitHub-hosted run is claimed before repository publication.
- The application has no backend or database; backend security, persistence, and concurrency are outside the tested Part 1 scope.
- The dependency audit is a point-in-time advisory check, not a guarantee that the application has no security defects.
- No grading outcome or successful course submission is claimed.
