# FleetDesk

A React computer asset manager for **SE411 Software Construction, Part 1, Fall 2026–27**.

FleetDesk lets a company add, display, search, update, and remove computer records. It includes a dashboard, labeled forms, validation, delete confirmation, a team page, automated tests, and project documentation. The only asset category is computers.

**Project status:** the application is implemented, and both students' names and IDs are included. This package is prepared for [222110432-lang/se411_mylabs](https://github.com/222110432-lang/se411_mylabs) in `Project_Part1`. GitHub publication awaits a connection with write access. The team will handle course submission. The original brief's three-person wording and the actual two-person team are documented in [requirements](docs/requirements.md).

## Run the project

Use **Node.js 24** and npm. From the lab repository root, first run `cd Project_Part1`. Then run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. On Windows, `START-WINDOWS.bat` performs the installation if needed and starts the application in a browser. The launcher itself is a convenience script; Windows execution has not been tested in this Linux environment.

To create and preview a production build:

```bash
npm run build
npm run preview
```

The `dist/` folder is the generated static application. Hash navigation and relative build paths allow deployment at a site root or a subdirectory. Do not open `index.html` directly with `file://`; use the development or preview server.

## Features

- **Computers:** inventory table and complete record details.
- **Add and edit:** shared form with required-field, duplicate, assignment, date, and cost validation.
- **Delete:** confirmation naming the selected computer.
- **Search and filters:** multi-word text search, status, department, and sorting.
- **Overview:** live counts, purchase value in SAR, assignment rate, department allocation, and maintenance queue.
- **About & team:** a dedicated menu page listing both students' names and IDs.
- **Responsive interface:** adaptable navigation, forms, cards, and a scrollable inventory table.

## Data and Part 1 scope

The application starts with **12 fictional computer objects** from `src/data/seedAssets.js`. `App` owns a copy in React state. Data remains available while navigating the menu, but **refreshing resets the sample data**.

There is no database, backend, API, browser storage, or account system. This follows the Part 1 requirement to use a collection of objects. The assignment reserves manual backend implementation for Part 2. Sample costs and specifications are illustrative, not product quotations.

## Tests and review

```bash
npm test
npm run test:coverage
npm run lint
npm run check:submission
```

The full test suite covers domain rules and user-facing React interactions. `docs/testing.md` records the final execution result; `docs/test-results.json` is the machine-readable evidence. To regenerate that evidence:

```bash
npm run test:report
```

`check:submission` validates both supplied team identities and the required local documentation. It records the difference between the brief's three-person wording and the actual two-person team; it does not confirm course acceptance of the team size. It does not verify repository visibility or the course submission portal. The repository-root workflow, `../.github/workflows/fleetdesk.yml`, installs the locked dependencies, runs the local readiness check, lint, tests, and a production build for changes to `Project_Part1`. No GitHub-hosted run is claimed before the upload succeeds.

## Documentation

| Document                               | Contents                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| [Requirements](docs/requirements.md)   | Assignment mapping, acceptance criteria, data rules, pending submission items |
| [Architecture](docs/architecture.md)   | Component responsibilities, data model, technology stack, data flow           |
| [Visual design](docs/visual-design.md) | Layout, navigation, colors, states, responsive behavior                       |
| [Testing](docs/testing.md)             | Actual execution results, coverage, audit status, limitations                 |
| [Code review](docs/code-review.md)     | Security, performance, code quality, reuse, resolved issues                   |
| [AI assistance](docs/ai-use.md)        | AI-assisted work and scope                                                    |
| [Demo guide](docs/demo-guide.md)       | Short demonstration sequence and explanation questions                        |

## Project team

The About page reads these user-supplied details from `src/data/team.js`:

| Full name | Student ID | Repository |
| --- | --- | --- |
| ABDULLAH NAIF ALORABI | 222110432 | [222110432-lang/se411_mylabs](https://github.com/222110432-lang/se411_mylabs) |
| Yousef khalid alyousef | 222110269 | [Yousef-Khalid-Alyousef/SE411_mylabs](https://github.com/Yousef-Khalid-Alyousef/SE411_mylabs) |

The user confirmed that this project has two students on 11 September 2026. The original brief's group size is three; no third team member has been invented.

## Submission

The assignment requires a **public GitHub repository**, and **only one student submits its repository URL**. The stated deadline is **17 October 2026**.

The source, tests, documentation, lockfile, and GitHub workflow belong in the repository. Exclude `node_modules`, generated coverage, environment files, and local runtime files. The supplied `.gitignore` handles those exclusions.

The chosen repository is [https://github.com/222110432-lang/se411_mylabs](https://github.com/222110432-lang/se411_mylabs); project source belongs in `Project_Part1`. The repository was verified as public on 11 September 2026. Publication of this prepared project still awaits write access. The team will later submit the repository URL through the course's Part 1 submission page. A working application preview is separate from the required repository URL.
