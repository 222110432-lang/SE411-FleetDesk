# Part 2 requirement mapping

Source: the supplied `project description Part 2.docx`, SE411 Fall 2026–27.

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Java application is a Spring server | Spring Boot application, REST controller, service and repository | Backend tests and packaged-JAR HTTP smoke script |
| Add an element | React form and `POST /api/computers` | Service, MVC, database integration, React and smoke checks |
| Search by ID | Exact UUID lookup form and `GET /api/computers/{id}` | Existing, missing and malformed ID cases |
| Search all and display paginated results | Search/filter controls, page size, Next/Previous, database `PageRequest` | Page boundaries and filtered results |
| Update an element | Edit form and `PUT /api/computers/{id}` | Stable ID, unchanged unique fields, invalid and duplicate updates |
| Unit test suite using JUnit + Mockito | `ComputerServiceTest` and `ComputerControllerTest` | `mvn verify` |
| Test backend integration | `InventoryIntegrationTest` and `scripts/smoke.py` | Real database/migrations, HTTP, restart persistence |
| Architecture slide | Slide 1 in `presentation/FleetDesk_Part2.pptx` | Diagram of actual application components |
| REST routes table | Slide 2 in the same presentation | Methods, paths, purposes and success codes |
| Exactly two slides, then live demo | Two slides plus separate demo guide | No additional cover or appendix slides |
| Three students | Current project team in README and the Part 2 About page | Three IDs shown by frontend test |
| One student submits a public GitHub repository | Use the shared `SE411-FleetDesk` repository | Final course submission remains with the student |

The deadline in the brief is **14 November 2026**. Delete, persistent storage, overview statistics, and Twelve-Factor notes retain useful features and guidance from Part 1. They do not replace any Part 2 requirement.
