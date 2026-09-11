# FleetDesk code review

## Review scope and method

This AI-generated review covers the Part 1 React source, domain operations, sample data, build configuration, tests, and dependency manifest. It combines source inspection, automated domain and component tests, a lint check, a production build, and an npm dependency audit. The final execution results are recorded in `testing.md` and the accompanying JSON evidence.

The application is a frontend demonstration with session-only data. This review does not claim a penetration test, real-browser visual review, server review, or production security certification.

## Security

| Finding or risk                                  | Treatment                                                                                                                                  | Evidence or limitation                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Entered text could be interpreted as HTML        | All record content uses React text interpolation; the code does not use `dangerouslySetInnerHTML`, `innerHTML`, or `eval`.                 | The component suite adds an HTML-like computer name and confirms it remains text without creating an image element.                 |
| Duplicate or malformed records                   | A shared validator runs both in the form and at the domain operation boundary. Tags and serials are normalized and checked for duplicates. | Validation and edit-duplicate tests.                                                                                                |
| Accidental destructive action                    | Delete opens a dialog naming the exact computer and tag; Cancel is the initial focused action in a real browser.                           | Cancel and confirmed-delete component test; browser-native focus behavior is not certified by jsdom.                                |
| Secrets or real company records in public source | Seed data uses fictional records and team labels; there are no application API keys, credentials, or real company records.                 | Source inspection. The course requires real student names and IDs once provided.                                                    |
| Client validation could be bypassed              | No server security boundary is claimed in Part 1.                                                                                          | Part 2 must independently validate and authorize all backend operations.                                                            |
| Vulnerable dependencies                          | The lockfile records resolved versions and an npm audit was requested.                                                                     | See `dependency-audit.json` and `testing.md` for the actual result; an unavailable audit must not be represented as a clean result. |

The application has no network data calls, remote fonts, authentication tokens, or permanent data store. React state is not suitable for protected or shared production records. The current limited data lifetime follows the assignment's object-collection approach.

## Performance

Filtering scans the collection and checks the query words against each record. Sorting the resulting copy is O(n log n). `useMemo` recomputes filtered results and summary values when their dependencies change. Stable internal IDs serve as table row keys.

The initial data set contains 12 records. Pagination, list virtualization, server-side queries, and debounce logic are unnecessary for this scope. No large-data benchmark or runtime latency guarantee was measured. The production bundle sizes in `testing.md` describe the actual build output.

The application imports individual Lucide icons, uses local system fonts, and includes no decorative images. This avoids extra runtime requests. Vite creates the production static assets and performs its normal optimization.

## Code quality and data integrity

| Area                   | Review conclusion                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State ownership        | `App` owns one computer array; summaries and filtered lists derive from it. There are no separate stale copies of counts.                                 |
| Immutability           | Add, edit, delete, and sort return new arrays. Editing preserves the internal ID. Tests verify the original collection remains unchanged.                 |
| Validation             | Required values are trimmed; enums are allowlisted; real calendar dates and cost bounds are checked; validation rules are shared.                         |
| Assignment consistency | Assigned records require an assignee. Available and Retired records clear and disable the assignee field. Maintenance may retain an assignee.             |
| Monetary totals        | The summary accumulates integer halalas, then converts to SAR, avoiding repeated decimal addition.                                                        |
| Navigation             | Hash routes keep navigation compatible with static hosting. A skip link moves focus without overwriting the route.                                        |
| Error recovery         | Invalid submissions preserve values, show field errors, and focus the first invalid field. An empty search can clear all filters.                         |
| Readability            | Named domain operations and extracted form, table, dialog, and badge components keep the main responsibilities identifiable; Prettier formats the source. |

## Code reuse

`AssetForm` serves both create and edit workflows. `Modal` provides consistent details and deletion dialogs. `StatusBadge` is shared by the table, details, and overview. Statuses, computer types, departments, and money formatting are defined once. Unit tests call the same validator and mutation functions that the interface uses; component tests verify the observable outcomes through labels, roles, and visible content.

## Issues corrected during implementation

1. **Required-field test labels:** The first component run used exact label-text selectors that included a mismatch with the visual required marker. Tests were corrected to match the real labeled controls, then the full add and edit workflows were executed successfully. Assertions were retained.
2. **Skip-link route interference:** A conventional `#main-content` link would overwrite the hash used for navigation. Its handler now focuses the main element without changing the route, and a regression test covers the About page.
3. **Unused scaffold assets:** Starter artwork, logos, styles, and links were removed. The metadata and favicon now identify FleetDesk.

## Remaining submission dependencies

Both real student names and IDs were supplied on 11 September 2026 and are displayed on the About page. The brief specifies three students, while the user confirmed a two-person team; the readiness check validates the supplied team without claiming course acceptance of that difference. The project upload is prepared for [222110432-lang/se411_mylabs](https://github.com/222110432-lang/se411_mylabs) and awaits a GitHub connection with write access. The team will handle course submission later.

## Part 2 recommendations

When the manually implemented backend is introduced, move authoritative storage and validation to it, enforce unique identifiers at the database layer, add authentication and role permissions, handle concurrent updates, and avoid treating client-side state as a security boundary. These are future requirements, not implemented Part 1 features.
