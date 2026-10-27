# FleetDesk · SE411 Part 2

A computer inventory application with a React frontend and a Java Spring Boot REST server. The server owns the records and stores them in a database. Part 1 remains in `../Project_Part1` as the original frontend project.

## Team

| Student | Student ID |
| --- | --- |
| Abdullah Naif Alorabi | 222110432 |
| Yousef Khalid Alyousef | 222110269 |
| Bader Emad Alshuraya | 221110016 |

## Run on Windows

Install **JDK 17 or later**, **Node.js 24**, and **Maven 3.9.x**. Make sure `java`, `javac`, `node`, `npm`, and `mvn` work in a new terminal. `JAVA_HOME` must point to the JDK, not a JRE.

1. Download or clone this repository and open `Project_Part2`.
2. Double-click **START-WINDOWS.bat**. The first run downloads dependencies, tests the app, and builds it.
3. When the terminal says `Started FleetDeskApplication`, open **http://localhost:8080**.
4. Keep that terminal open. Press Ctrl+C to stop the server.

The first local start adds 12 fictional computers. Changes survive browser refreshes and server restarts. Data lives in `backend/data/`, which Git ignores. Deleting the sample records does not make them reappear next time.

## Run on macOS or Linux

With the same prerequisites, from `Project_Part2`:

```bash
bash scripts/build.sh
cd backend
java -jar target/fleetdesk.jar
```

Open http://localhost:8080. The JAR serves both the React build and the REST API on one port. After building once, run the JAR directly on later starts. Keep the working directory the same so the relative database location stays the same.

## What to demonstrate

- Add a computer and receive its generated record ID.
- Copy the record ID from its details and find it using **Find by record ID**.
- Browse **Next / Previous** pages and change **Rows per page**. The server only returns the requested page.
- Search by words, combine status/department filters, and sort the results.
- Edit a computer, refresh the browser, and show that the saved update remains.
- Confirm a deletion and show the missing-ID response.
- Open **Overview** for totals across the entire database and **About & team** for all three students.

The [demo guide](docs/demo-guide.md) includes a short script and code questions. The [two-slide presentation](presentation/FleetDesk_Part2.pptx) contains the system architecture and REST route table.

## Development

Run the backend in one terminal:

```bash
cd backend
mvn spring-boot:run
```

Run the frontend in another:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the second terminal. Vite proxies `/api` to port 8080. The production build uses same-origin API requests, so no permissive CORS configuration is needed.

## Tests

```bash
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
cd ../backend
mvn clean verify
```

JUnit 5 and Mockito test backend business logic and controller behavior. Integration tests exercise the real controller, service, repository, migrations, and an isolated H2 database. React Testing Library tests asynchronous HTTP workflows. See [testing](docs/testing.md) for recorded results and limits.

For a live HTTP and restart check after building, run `python scripts/smoke.py` from `Project_Part2` with Java 17+ available. It starts its own server and temporary database, and never touches your normal demo inventory.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port |
| `DB_URL` | `jdbc:h2:file:./data/fleetdesk;DB_CLOSE_ON_EXIT=FALSE` | JDBC database connection |
| `DB_USER` | `sa` in local H2 mode | Database username |
| `DB_PASSWORD` | empty in local H2 mode | Database password |
| `SEED_DEMO` | `true` locally, `false` with PostgreSQL profile | Insert fictional records once into an empty database |
| `SPRING_PROFILES_ACTIVE` | default local H2 profile | Set `postgres` for PostgreSQL and supply all database variables |

Do not commit real credentials. Shell variables are read at runtime; a `.env` file is only read automatically by Docker Compose, not by `java -jar`.

An optional [Docker Compose configuration](compose.yaml) runs the application with PostgreSQL. Copy `.env.example` to `.env`, choose a local database password, and run `docker compose up --build` from this directory. See [Twelve-Factor notes](docs/twelve-factor.md) for the distinction between the local H2 demo and the external-database setup.

## Project map

```text
backend/src/main/java/edu/se411/fleetdesk/
  ComputerController.java      HTTP routes
  ComputerService.java         Business rules and paginated queries
  ComputerRepository.java      Database access
  Computer.java                Persistent entity
  ComputerRequest.java         Validated writable fields
  ApiExceptionHandler.java     Safe JSON error responses
backend/src/main/resources/    Runtime settings, migration, fictional sample data
backend/src/test/              JUnit, Mockito and database integration tests
frontend/src/api/              HTTP client
frontend/src/App.jsx           Pages and asynchronous inventory state
frontend/src/components/       Forms, table and dialogs
frontend/tests/                Browser-component and API-client tests
docs/                         API reference, architecture, demo and requirements
presentation/                 Exactly two editable slides
```

The course deadline is **14 November 2026**. One student submits the public repository link. This repository is a course demonstration without login or authorization, intended for local use. A public deployment with real inventory would need access control.

AI tools assisted with setup, implementation, and testing.
