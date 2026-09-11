# FleetDesk visual design

## Design intent

FleetDesk is an equipment management workspace for an IT or operations employee. The first page shows the actual inventory and an Add computer action. A dark navigation column establishes a stable frame; white content surfaces and blue actions keep the records easy to scan.

## Page structure

| View         | Primary content                                                         | Main action                |
| ------------ | ----------------------------------------------------------------------- | -------------------------- |
| Computers    | Inventory counts, search and filters, sortable table                    | Add, inspect, edit, delete |
| Overview     | Status counts, purchase value, department allocation, maintenance queue | Open the maintenance list  |
| Add or edit  | Grouped details, assignment, location, purchase information, notes      | Save or cancel             |
| About & team | Project introduction and two team identity cards                        | Read the team details      |

## Shared visual system

| Element            | Choice and reason                                                                 |
| ------------------ | --------------------------------------------------------------------------------- |
| Main navigation    | Deep navy `#111c2e` for separation from the working area                          |
| Main action        | Blue `#375fea` identifies the primary action                                      |
| Page background    | Cool light gray `#f5f7fa` supports distinct white content surfaces                |
| Main text          | Dark blue-gray for strong legibility                                              |
| Typography         | Local system sans-serif stack; no downloaded fonts or external font dependency    |
| Body copy          | 16 px; regular controls and record values are generally 14–16 px                  |
| Secondary metadata | 12–13 px for tags, labels, and supporting context                                 |
| Surfaces           | Modest borders and corners; minimal shadows                                       |
| Icons              | Lucide icons accompany labels and actions                                         |
| Status             | A written status plus a consistent color, so meaning does not rely on color alone |

## Interaction states

The form shows errors below the relevant inputs and focuses the first invalid field. Save actions produce a dismissible success notice. Empty search results offer Clear filters; an empty inventory offers Add computer. Delete displays the computer name and tag before confirmation. Cancel leaves the collection unchanged.

The application explains that changes last only for the current session. Available and Retired statuses clear and disable the assignment field, which helps prevent contradictory records.

## Responsive and keyboard behavior

On smaller screens, summary cards wrap to two columns, the form uses one column, the side navigation becomes a horizontal menu, and the inventory table scrolls within its own region. Buttons and inputs have visible focus indicators. Table action buttons identify their target asset in their accessible names. Dialogs use the native modal element and restore focus to their trigger when possible. A skip link moves keyboard focus directly to the main content.

Responsive styles are implemented in CSS. The recorded automated tests exercise the DOM and interactions through jsdom; they do not certify pixel layout or replace testing in a real browser.
