# REST API

Base URL for local use: `http://localhost:8080`. Requests and responses use JSON, except successful DELETE responses, which have no body. Record IDs are server-generated UUIDs. The asset tag is a separate business identifier.

| Method | Route | Purpose | Success |
| --- | --- | --- | --- |
| POST | `/api/computers` | Add a computer | `201 Created`, body and `Location` header |
| GET | `/api/computers/{id}` | Find one computer by UUID | `200 OK`, computer |
| GET | `/api/computers` | Search/list a page of computers | `200 OK`, page object |
| PUT | `/api/computers/{id}` | Replace all writable fields of an existing computer | `200 OK`, updated computer |
| DELETE | `/api/computers/{id}` | Delete a computer | `204 No Content` |
| GET | `/api/computers/summary` | Totals across the complete inventory | `200 OK`, summary |

`GET /actuator/health` is the operational health endpoint. It exposes status only.

## Add or update body

```json
{
  "tag": "PC-2000",
  "name": "Demo laptop",
  "serial": "DEMO-2000",
  "type": "Laptop",
  "status": "Available",
  "department": "IT",
  "assignedTo": "",
  "location": "Riyadh office",
  "purchaseDate": "2026-01-01",
  "cost": 2500.50,
  "notes": "Fictional presentation record"
}
```

The response contains these fields plus `id`. Do not include `id` or unknown fields in a create/update body. The backend trims text and uppercases tags and serial numbers before checking uniqueness.

## List parameters

Example: `/api/computers?page=0&size=5&q=laptop&status=Available&department=IT&sort=tag`

| Parameter | Default | Rules |
| --- | --- | --- |
| `page` | `0` | Zero-based integer, at least 0 |
| `size` | `5` | Integer from 1 to 100 |
| `q` | empty | At most 200 characters. Every word must match a searchable field, ignoring case. |
| `status` | empty | Assigned, Available, Maintenance, or Retired |
| `department` | empty | Engineering, Design, Operations, Finance, People, or IT |
| `sort` | `tag` | tag/name ascending, or cost/purchaseDate descending. Tag breaks ties. |

Search covers tag, name, serial, type, status, department, assignee, location, and notes. `%` and `_` are treated literally, not as SQL wildcard instructions. Exact UUID lookup uses the separate `/{id}` route. Invalid query parameters return 400. A valid page beyond the end returns an empty `content` array.

```json
{
  "content": [],
  "page": 0,
  "size": 5,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true
}
```

`content` contains the computer objects. Pagination is executed in the database using Spring Data `PageRequest`; the browser does not fetch every row and then slice the results.

## Validation and errors

- Required: tag, name, serial, type, status, department, location, purchase date, cost.
- Tag: 2–24 uppercase letters, digits, or hyphens, beginning with a letter or digit.
- Name and assignee: up to 80 characters. Serial: 64. Location: 100. Notes: 500.
- Type: Laptop, Desktop, or Workstation. Status and department follow the lists above.
- Assigned requires an assignee. Available and Retired must have no assignee. Maintenance may retain one.
- Purchase date must be valid and cannot be in the future according to the server's date.
- Cost: 0 to 1,000,000 SAR, with at most two decimal places. Java uses `BigDecimal`; the database uses `DECIMAL`.
- Both tag and serial are unique. Database constraints enforce uniqueness even if simultaneous requests pass the initial check.

| Status | Meaning |
| --- | --- |
| 400 | Invalid fields, malformed JSON/UUID, or invalid paging/filter parameters |
| 404 | A well-formed UUID has no matching record |
| 409 | Duplicate identifiers or another database integrity conflict |
| 500 | Unexpected failure, with a generic client message and server-side log |

```json
{
  "message": "A computer with these identifiers already exists.",
  "errors": { "tag": "This asset tag already exists." }
}
```

`errors` maps field names to messages when field-specific feedback is available. The React form displays these messages and retains entered data. A database-level race may return a general conflict message with an empty `errors` object.

## Summary response

`total` counts all records. `value` is total historical purchase cost, including retired records. `statusCounts` and `departments` contain counts across the whole database. `assignmentRate` is the rounded percentage `Assigned / (total - Retired)`, or zero if there are no active computers. `maintenance` contains at most five maintenance records ordered by tag.
