# Critique fixes — progress

State on 2026-10-07, when the work was paused. Nothing has been pushed.

## Done

| Step | What | Commit |
| --- | --- | --- |
| 1 | Phone layout: header in two rows, breadcrumb stops at the parent page (none on home), module code on the first line of the title, four tabs in one row, the two filters side by side | `5dffe52` |
| 2 | Four defects: Arabic "PDF" and size isolated, space reserved for the size, filters built from the data, duplicate messages removed | `fad9796` |

Both were checked in headless Chrome at 320, 375, 768 and 1280px, in French and Arabic. Not checked on a real phone.

Measurements for step 8, on a 375 by 812 screen, Examens tab of ASD3, with the sample notice shown:

| | Before | After step 1 |
| --- | --- | --- |
| First exam row starts, French | 867px | 453px |
| First exam row starts, Arabic | 933px | 483px |
| Whole exam rows on the first screen, French | 0 | 2 |
| Whole exam rows on the first screen, Arabic | 0 | 1 |

## Interrupted: step 3, document rows

Saved in the commit "WIP: critique fixes in progress". **The site is not in a good state at that commit: document rows are drawn without their styles.**

- Done: `js/resource-list.js` draws the new row (number and title as one link that opens the PDF, one "Télécharger" button, facts as a list of plain text, "Avec corrigé" as the only badge). `js/i18n.js` has the new `action.open` text and no longer has `action.view`.
- Not done: `css/styles.css` has no rules yet for the new classes `resource__link`, `resource__download`, `facts`, `fact`, `fact--ok`, `fact--size`. The old rules for `tags`, `tag`, `tag--*`, `resource__body` and `resource__actions` are still there and must be removed.
- Not done: `docs/design-system.md` (rows and actions) and `docs/project-brief.md` (the "PDF behavior" line still describes a "Voir" button).
- Not checked in a browser at all.

In search results, an exam row is now marked with its academic year instead of the word "Examen". This was not asked for; it avoids a link that would read "Examen Examen de janvier 2025". Say so if you prefer the old marker.

## Not started

- Step 4: footer (student-run and unofficial, date of the last update, "Signaler une erreur"), and the same link beside "Fichier indisponible".
- Step 5: "Examens" link on each module row of the home page; visited state on document titles.
- Step 6: outlines only on things that can be tapped, stronger module code, muted tabs with zero documents.
- Step 7: "pour ... pour", Arabic correction labels, Arabic for "Contrôle", module shown once for an exact code search. The Arabic TP tab no longer wraps: step 1 changed the Arabic tabs to "TD" and "TP".
- Step 8: polish, detector on phone and desktop, final before and after measurements.
- The local server for checking on a phone.

## Waiting for the maintainer

- The email address for "Signaler une erreur". The request said "[YOUR EMAIL]", so no address has been used.
- Whether the `.impeccable/` folder is committed or ignored. It is still untracked.
