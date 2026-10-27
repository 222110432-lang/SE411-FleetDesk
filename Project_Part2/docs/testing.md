# Testing

Verified on **27 October 2026** using Java 17, Maven 3.9.11, Node.js 24, and the committed npm lockfile.

## Automated suites

| Suite | Tests passed | Scope |
| --- | ---: | --- |
| `ComputerServiceTest` | 18 | Mockito-isolated business rules, missing records, uniqueness, assignment, paging and sorting |
| `ComputerControllerTest` | 19 | MockMvc HTTP status, request validation, malformed input and safe errors |
| `InventoryIntegrationTest` | 9 | Real Spring/JPA/Flyway/H2 CRUD, paging, search, constraints, summaries and one-time seeding |
| React / HTTP component tests | 17 | Asynchronous list, pagination, ID lookup, create/update/delete, errors, stale responses and team page |
| Client validation tests | 28 | Required fields, input limits, dates, cost boundaries and status rules |

**Total: 91 tests passing.** Backend tests use JUnit 5 and Mockito from `spring-boot-starter-test`. The test-only Mockito configuration uses subclass mocks because the suite mocks interfaces and a non-final service and does not require runtime agent attachment.

## Coverage

| Code | Lines | Branches |
| --- | ---: | ---: |
| Backend, JaCoCo | 98.54% | 98.18% |
| Frontend, Vitest V8 | 87.68% | 80.82% |

Coverage measures executed code, not proof that every possible behavior is correct. JaCoCo's normal compiler-generated-code filters apply. Frontend coverage excludes the bootstrap file and static team data.

To regenerate reports:

```bash
cd frontend
npm run test:coverage
cd ../backend
mvn clean verify
```

The HTML reports are `frontend/coverage/index.html` and `backend/target/site/jacoco/index.html`. Builds and reports stay out of version control. Backend tests use an isolated in-memory database and never modify the local demo inventory.

## Packaged application check

`scripts/smoke.py` starts the actual executable JAR with a temporary file database. It checks the served frontend and JavaScript bundle, creation, generated IDs, exact lookup, server pagination, search, update, duplicate/invalid input, summary totals, deletion, and persistence after stopping and restarting Java. It cleans up only its own temporary data and process.

## Verification limits

- The local JVM build, H2 integration, and React component tests were run in Linux. The Windows launcher has not been run on a Windows machine.
- Docker is unavailable in the build environment. The optional Compose/PostgreSQL configuration is supplied but has not been executed here.
- Component tests use jsdom and mocked HTTP responses. The live HTTP check exercises the real backend. A full browser end-to-end run was not completed because the browser download was unavailable.
- Frontend lint completes with two advisory `react/set-state-in-effect` warnings for setting request loading/error state inside effects. They synchronize the UI with HTTP requests.
- No authentication, authorization, load test, multi-instance deployment, or public hosting is included.
- The GitHub workflow is provided. Its remote run cannot be confirmed until the changes are uploaded to the repository.
