# FleetDesk demonstration guide

Use the sample inventory for the presentation. Refreshing the page restores all 12 sample records.

## Suggested demonstration

1. Open Computers. Point out the count cards, table, navigation menu, and session-only data notice.
2. Search for `laptop`, filter by Available, and choose IT. The results are PC-1003 and PC-1011. Clear the search and filters.
3. Choose Add computer and enter a unique name, tag, and serial; choose a department and location; add a past purchase date and a cost. Save and show the new table record.
4. Open its details and choose Edit computer. Change its status to Assigned and add a person or team, then save.
5. Open Overview and explain that its figures derive from the same current collection.
6. Delete the new record. First cancel to show the safeguard, then confirm the deletion.
7. Open About & team to show ABDULLAH NAIF ALORABI (222110432) and Yousef khalid alyousef (222110269).
8. Open the repository documentation and run `npm test` to show the actual automated tests.

## Questions to prepare for

**Why is React used?** The assignment requires it. Components separate reusable interface parts, and state updates redraw the affected interface.

**Where is the data?** The sample records are objects in `src/data/seedAssets.js`. The working array lives in React state inside `App`. There is no database in Part 1.

**Why does refreshing reset the data?** The collection is stored in memory. Reloading starts a new application instance with the sample objects.

**How do you prevent duplicates?** The validator compares normalized tags and serials with other records. During an edit, it excludes the current record's internal ID.

**Why have both an internal ID and an asset tag?** The internal ID remains stable, while a user can correct the company-facing tag. This keeps record selection and React row keys stable.

**What do the tests verify?** Data validation, immutability, searching, sorting, totals, and rendered add/edit/delete/navigation workflows. The recorded tests use jsdom; real-browser pixel layout is a separate concern.

**What did AI help with?** Requirements, design, source code, tests, documentation, and review, as the Part 1 brief requests. The human team supplied its identities and should be able to explain the resulting work.

**What changes in Part 2?** A manually written backend will add persistent storage and independent validation and access controls.
