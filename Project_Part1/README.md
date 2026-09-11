# FleetDesk

FleetDesk is a React-based computer asset management application developed for **SE411 Software Construction – Project Part 1, Fall 2026–27**.

The application allows a company to manage its computer inventory through a simple interface for adding, viewing, updating, deleting, searching, filtering, and sorting computer records.

## Features

FleetDesk includes:

- Computer inventory management
- Add new computer records
- Edit existing computer records
- Delete computers with confirmation
- Search computer records
- Filter computers by status and department
- Sort inventory records
- Dashboard with asset statistics
- Purchase value and assignment information
- Department allocation overview
- Maintenance status tracking
- Form validation
- About page with team member information
- Responsive user interface
- Automated tests

## Technologies Used

- React
- JavaScript
- Vite
- CSS
- Vitest
- React Testing Library
- npm

## Project Structure

```text
Project_Part1/
├── docs/
├── public/
├── scripts/
├── src/
│   ├── components/
│   ├── data/
│   ├── domain/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── tests/
├── index.html
├── package.json
├── package-lock.json
├── START-WINDOWS.bat
└── vite.config.js
```

## Running the Project

### Requirements

Make sure you have:

- Node.js 22.12 or newer
- npm

### Installation

Open a terminal inside the `Project_Part1` folder and run:

```bash
npm ci
```

Then start the development server:

```bash
npm run dev
```

Vite will display a local address in the terminal. Open that address in your browser.

### Windows

Windows users can also run:

```text
START-WINDOWS.bat
```

This script starts the application using the required npm commands.

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Data

For Part 1, FleetDesk uses a collection of computer objects stored in the frontend.

The application starts with **12 sample computer records** defined in:

```text
src/data/seedAssets.js
```

The data is stored in React state while the application is running.

Changes made through the application remain available while navigating between pages, but refreshing the browser resets the data back to the original sample records.

Part 1 does not use:

- A database
- A backend server
- An external API
- User accounts

The backend will be handled separately in Part 2.

## Main Application Functions

### Computer Inventory

Users can view the available computer assets and their information in the inventory table.

Computer records include information such as:

- Computer identification
- Model and specifications
- Status
- Department
- Assignment information
- Purchase information
- Maintenance information

### Add Computer

Users can create a new computer record through the application form.

The form validates required information before the record is added.

### Edit Computer

Existing computer records can be selected and updated using the same validated form.

### Delete Computer

Users can delete a computer record after confirming the operation.

### Search and Filtering

The inventory can be searched and filtered to make computer records easier to locate.

The application supports:

- Text search
- Status filtering
- Department filtering
- Sorting

### Dashboard

The dashboard provides an overview of the computer inventory, including information such as:

- Total computers
- Assignment status
- Purchase value
- Department distribution
- Maintenance information

### About Page

The application includes an About page that displays the members of the project team and their student IDs.

## Testing

The project includes automated tests for application behavior and domain logic.

Run the full test suite with:

```bash
npm test
```

Run the coverage report with:

```bash
npm run test:coverage
```

Generate the test report with:

```bash
npm run test:report
```

Run the linter with:

```bash
npm run lint
```

The project also includes a submission readiness check:

```bash
npm run check:submission
```

## Documentation

Additional project documentation is available in the `docs` folder.

| Document | Description |
| --- | --- |
| [Requirements](docs/requirements.md) | Project requirements and acceptance criteria |
| [Architecture](docs/architecture.md) | Application architecture, components, data flow, and technology stack |
| [Visual Design](docs/visual-design.md) | Interface layout, navigation, responsive behavior, and design decisions |
| [Testing](docs/testing.md) | Test approach, execution results, and coverage information |
| [Code Review](docs/code-review.md) | Review of security, performance, code quality, and code reuse |
| [AI Assistance](docs/ai-use.md) | Summary of AI-assisted work used during development |
| [Demo Guide](docs/demo-guide.md) | Suggested sequence for demonstrating the application |

## Team

| Student | Student ID |
| --- | --- |
| Abdullah Naif Alorabi | 222110432 |
| Yousef Khalid Alyousef | 222110269 |

## Course Information

**Course:** SE411 – Software Construction  
**Project:** Part 1 – Frontend Application  
**University:** Prince Sultan University  
**Semester:** Fall 2026–27

## Project Scope

FleetDesk was developed as the frontend portion of the SE411 project.

The Part 1 application satisfies the main project requirements by providing:

- A React-based frontend
- Navigation between application features
- Adding records
- Updating records
- Removing records
- Searching records
- Displaying records
- An About page containing team information
- Project documentation
- Automated testing
- Code review documentation

The application manages **computer assets** as its selected company asset category.
