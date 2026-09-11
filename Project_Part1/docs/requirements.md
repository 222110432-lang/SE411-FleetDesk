# FleetDesk requirements

## Purpose and source

FleetDesk is the frontend for a company computer inventory. The authoritative assignment is **Project SE411 Fall 2026–27, Part 1**, supplied as `project description Part 1.docx`. The brief permits AI assistance with requirements, visual design, code, documentation, tests, and review. Its deadline is **17 October 2026**.

The selected asset category is **computers**. Laptops, desktops, and workstations are subtypes of the same category. Cars, projects, financial assets, peripherals, and other categories are outside this project.

## Functional requirements and acceptance criteria

| ID   | Requirement              | Acceptance criterion                                                                                                                                              | Implementation                     |
| ---- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| FR01 | React frontend           | Application is built from React components and can be built from the supplied package and lockfile.                                                               | `src/main.jsx`, `src/App.jsx`      |
| FR02 | Menu navigation          | A menu opens Computers, Overview, Add computer, and About & team; the current page is identified.                                                                 | Main navigation and hash routes    |
| FR03 | Display computers        | The inventory lists all computers, with name, asset tag, subtype, status, assignment, department, and cost. A details dialog shows the complete record.           | `AssetTable`, details dialog       |
| FR04 | Add a computer           | A valid submitted form adds exactly one computer and displays a success message. Invalid input preserves the form and shows errors.                               | `AssetForm`, `addAsset`            |
| FR05 | Update a computer        | A record can be edited without changing its internal identity. The table and dashboard use the updated values. Cancel preserves the original.                     | `AssetForm`, `updateAsset`         |
| FR06 | Remove a computer        | Delete requests confirmation; Cancel preserves the record and confirmation removes only the selected record.                                                      | Confirmation dialog, `deleteAsset` |
| FR07 | Search computers         | Case-insensitive text search matches asset tags, names, serials, subtypes, statuses, departments, assignees, locations, and notes. Multiple words must all match. | `filterAssets`                     |
| FR08 | Filter and order results | Search combines with status and department filters. Results can be ordered by tag, name, highest cost, or newest purchase.                                        | Inventory toolbar                  |
| FR09 | Data as objects          | Records are JavaScript objects in an array, held in React state. No database, server, API, or browser storage persists records.                                   | `seedAssets`, application state    |
| FR10 | About page               | The About & team menu displays the names and IDs of both user-confirmed students. The original brief specifies three students; that difference is recorded below. | `src/data/team.js`, About view     |
| FR11 | Dashboard                | Counts and purchase value derive from the current collection and update after changes.                                                                            | `getSummary`, Overview view        |

## Data rules

- Asset tag: required, unique ignoring case, 2–24 letters, digits, or hyphens, beginning with a letter or digit. Tags are stored in uppercase.
- Computer name: required, at most 80 characters.
- Serial number: required, unique ignoring case, at most 64 characters; stored in uppercase.
- Computer type: Laptop, Desktop, or Workstation.
- Status: Assigned, Available, Maintenance, or Retired.
- Department: Engineering, Design, Operations, Finance, People, or IT.
- Assignee: a person or team, at most 80 characters. Required for Assigned; optional for Maintenance; empty for Available and Retired.
- Location: required, at most 100 characters.
- Purchase date: a real calendar date on or before the current local date.
- Purchase cost: from 0 to 1,000,000 SAR with at most two decimal places. It represents historical purchase cost, not a current valuation.
- Notes: optional, at most 500 characters.
- Leading and trailing whitespace is removed before storage.

## Quality requirements

Controls have accessible labels, visible keyboard focus, and text error messages. Native dialogs provide modal interaction. The layout changes for smaller screens; the inventory table scrolls within its own region when necessary. Search and summary calculations do not mutate the source collection. Tests verify behavior through the rendered interface and the domain functions.

## Scope boundaries

The initial 12 records are fictional demonstration data, including their prices and specifications. Changes survive menu navigation but reset on refresh, tab closure, or application remount. This is the Part 1 object-collection implementation. The backend is reserved for Part 2 and has not been implemented.

No authentication, multi-user synchronization, permanent storage, external integrations, or production access controls are claimed.

## Team membership

The user confirmed a two-person team on 11 September 2026:

| Full name              | Student ID |
| ---------------------- | ---------- |
| ABDULLAH NAIF ALORABI  | 222110432  |
| Yousef khalid alyousef | 222110269  |

The supplied assignment says groups should be made of three students. The application accurately represents the two students supplied by the user. Course acceptance of a two-person group has not been verified; the source requirement has not been rewritten as a two-person requirement.

## Submission requirements

| Required deliverable                                          | Location or status                                        |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| React source                                                  | `src/` and build configuration                            |
| Requirements and visual design                                | This file and `visual-design.md`                          |
| Architecture, technology stack, features                      | `architecture.md` and the repository README               |
| AI-generated tests and execution evidence                     | `tests/`, `testing.md`, `test-results.json`               |
| AI-generated security, performance, quality, and reuse review | `code-review.md`                                          |
| Actual team names and IDs                                     | Both supplied students are recorded in `src/data/team.js` |
| Public GitHub repository                                      | [222110432-lang/se411_mylabs](https://github.com/222110432-lang/se411_mylabs) is public; `Project_Part1` upload awaits write access       |
| One student submits the GitHub repository URL                 | The team will handle course submission later, as requested         |

`npm run check:submission` validates the two supplied team records and required local evidence, while reporting the original three-person wording. It cannot verify GitHub visibility or a submission receipt.
