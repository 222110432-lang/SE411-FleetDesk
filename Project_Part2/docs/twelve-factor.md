# Twelve-Factor design notes

Part 2 uses the [Twelve-Factor App](https://12factor.net/) as design guidance. The table separates implemented behavior from deployment work. The convenient local H2 setup is a single-instance demo; it does not satisfy every production deployment factor on its own.

| Factor | Application in FleetDesk | Status or limitation |
| --- | --- | --- |
| I. Codebase | One shared Git repository. Part 1 is an earlier project stage; Part 2 is the integrated app. | Implemented in the source layout. |
| II. Dependencies | Maven declares Java libraries and framework versions. npm uses a committed lockfile and `npm ci`. | Implemented. The optional container build isolates toolchains. |
| III. Config | Port, database connection, credentials, and sample-data choice use environment variables. | Implemented. No production credentials in source. |
| IV. Backing services | PostgreSQL is selected through a JDBC URL and credentials. | External-service option included. H2 file mode is only the local shortcut. |
| V. Build, release, run | React and Maven create an executable JAR. Runtime configuration is supplied when launching that JAR. | Build/run separation implemented. A release promotion system is not deployed. |
| VI. Processes | HTTP request handling does not keep inventory in process memory or user sessions. | Suitable with PostgreSQL. Local H2 storage is tied to one machine. |
| VII. Port binding | Embedded Tomcat serves the UI and API, using `PORT`. | Implemented. No separately installed app server required. |
| VIII. Concurrency | The same stateless API process can be replicated with a shared external database. | No multi-instance deployment or load test performed. Disable demo seeding before replication. |
| IX. Disposability | Spring graceful shutdown allows active requests to finish, with a 20-second timeout. | Implemented. Storage remains in the database. |
| X. Dev/prod parity | The Compose setup can use PostgreSQL for local development and deployment. | Default tests use H2. Database parity is partial until the PostgreSQL workflow is exercised. |
| XI. Logs | Spring writes logs to the process output. The app does not manage log files. | Implemented. The host collects/rotates logs. Test scripts redirect output only for test diagnostics. |
| XII. Admin processes | Flyway versions database schema changes with the app. | Migrations currently run at startup. A separate one-off administration job is not implemented. |

This is a course project using relevant principles, not a claim of complete production Twelve-Factor compliance. The supplied Compose configuration binds the app to localhost and keeps PostgreSQL on its internal network. No public service is deployed as part of this deliverable.
