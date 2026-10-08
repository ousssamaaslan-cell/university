# Critique fixes — progress

State on 2026-10-08. The eight steps are done and committed on `main`. **Nothing has been pushed.**

## Done

| Step | What | Commit |
| --- | --- | --- |
| 1 | Phone layout: header in two rows, breadcrumb stops at the parent page (none on home), module code on the first line of the title, four tabs in one row, the two filters side by side | `5dffe52` |
| 2 | Four defects: Arabic "PDF" and size isolated, space reserved for the size, filters built from the data, duplicate messages removed | `fad9796` |
| 3 | Document rows: the title opens the PDF, one "Télécharger" button, facts as one line of plain text, "Avec corrigé" as the only badge | `4bcb529` (script, unfinished) and `6ecfbfe` |
| 4 | Footer: run by students and not official, date of the last update, "Signaler une erreur". The same link beside "Fichier indisponible" | `fa54693` |
| 5 | "Examens" link on each module row; visited colour on document titles | `e6366a3` |
| 6 | Outlines only on things that can be tapped, module code as a solid block, muted tabs with zero documents | `8dd159c` |
| 7 | "pour ... pour", Arabic correction labels, Arabic for "Contrôle", module shown once for a code search | `5fdef4b` |
| 8 | Polish pass, detector on phone and desktop, final measurements | `b6eb22c` |
| — | `.gitignore`: the Impeccable block and `.playwright-mcp/`; the critique file is now in Git | `cea5c5e` |

One commit message is slightly wrong: step 7 lists "accessible names in Arabic use the Arabic comma", but that change is in the step 4 commit.

## Measurements

Method: a 375 by 812 Chrome window driven by Playwright, the Examens tab of ASD3, sample notice shown. The three versions were measured on 2026-10-08 in the same way: the site before the critique fixes (`b5a8631`), after steps 1 and 2 (`fad9796`), and now.

| | Before | After steps 1 and 2 | Now |
| --- | --- | --- | --- |
| First exam row starts, French | 888px | 453px | 453px |
| First exam row starts, Arabic | 945px | 483px | 483px |
| Whole exam rows on the first screen, French | 0 | 1 | 2 |
| Whole exam rows on the first screen, Arabic | 0 | 1 | 2 |
| Whole Cours rows on the first screen, French | 0 | 2 | 4 |
| Whole TD rows on the first screen, French | 0 | 2 | 4 |
| Height of an exam row, French | 170 to 194px | 170 to 194px | 126 to 150px |
| Height of an exam row, Arabic | 170 to 194px | 170 to 194px | 111 to 137px |
| Height of a Cours row, French | 166 to 191px | 166 to 191px | 105 to 129px |
| Height of a TD row, French | 166 to 215px | 166 to 215px | 105 to 154px |

The earlier version of this file gave 867px and 933px for "before", and 2 and 1 whole rows after step 1. Those were measured in an earlier session by a method that was not written down. The table above replaces them.

With real documents the page will have no sample notice and no "Exemple" mark. Removing both in the browser gives, in French, a first exam row at 415px, three whole exam rows on the first screen, and rows of 105 to 129px. In Arabic: 441px, two whole rows, rows of 111 to 137px. This is a simulation on the sample data, not a measurement of real documents.

## Checks that were run

- **Browser.** Chrome through Playwright at 320, 375, 640, 768 and 1280px, in French and Arabic: home, module (each tab, an empty module, an unknown module, filters with and without a match), search (results, no result, nothing typed) and 404. Result: no horizontal overflow, no script error, every link, button, select and field at least 44px tall, tabs on one row.
- **Documents.** The title opens the PDF (HTTP 200, `application/pdf`), "Télécharger" saves the file, the keyboard reaches both in that order, and rows keep their height when the file sizes arrive.
- **States.** A missing PDF (simulated), a failed catalogue load (simulated), dark mode, the visited colour after opening a document.
- **Impeccable detector.** Before the polish pass: 0 findings in the source files, 0 on eight rendered pages at 1280 by 800, and at 390 by 844 four findings of one rule, all on the sample notice. After a small change to the notice, the detector was run again on the final commit: 0 findings in the source files, 0 on the eight pages at 1280 by 800, and 0 on the eight pages at 390 by 844.
- **`node scripts/doctor.cjs`.** OK, 53 sample records.

Not checked:

- A real phone. Everything above is desktop Chrome at phone sizes.
- A real screen reader.
- That a phone's mail app opens with the prepared email from "Signaler une erreur". On a computer with no mail app the link does nothing.
- The visited colour on a phone that downloads PDFs instead of showing them.
- Real browser zoom at 200%. The 640px layout, which is the same width, was checked.
- The date of the last update on GitHub Pages. Locally it is the day `data/resources.json` was last saved.
- `docs/qa-report.md` is not written. That belongs to Phase 4.

## Choices made while building

Say so if you prefer otherwise.

- **"Examens" shortcut.** A module with no exam (MN, GP) has no shortcut, so nobody taps through to an empty tab.
- **Date of the last update.** It comes from the server (the `Last-Modified` header of the catalogue), shown as the day in Algeria. Nobody types it. The 404 page does not load the catalogue, so it shows no date.
- **"Signaler une erreur".** The address is set once, as `REPORT_EMAIL` in `js/components.js`. The email already names the page the reader was on and, for a missing PDF, the file. The footer asks "Un fichier manquant ou incorrect ?" before the link. The address is not printed on the page.
- **Visited colour.** Purple: `#70359c` in light mode, `#cdb0ff` in dark mode.
- **The Impeccable ignore block.** No official text was found in the installed Impeccable (version 0.1.11) or on the web. The lines between the two markers in `.gitignore` were written to do what was asked: keep `config.json`, `design.json`, `surfaces/*.md` and `critique/*.md`, ignore everything else in `.impeccable/`. Paste the official block over them if you have it.
- **The critique file.** Its header holds the folder path on this computer (`C:\Users\STS\...`). It is in Git now and becomes public with the push.

## Known and left as is

- In Arabic, on a screen narrower than about 340px, the site name takes three lines and the header grows by 23px when it is drawn.
- On a 320px screen the facts of a row can take four or five lines beside "Télécharger".
- Searching "examen 2024" also finds the exams of 2024-2025. The critique noted it; it was not one of the eight steps.
- A document opens in the same tab. The browser's back button returns to the list.
- All Arabic text is still a draft awaiting the maintainer's review, including the new footer and report texts and the two labels changed in step 7.

## Test servers

The check on a real phone was skipped at the maintainer's request. No server started for these fixes is left running: nothing listens on port 8000 or 8001, and Windows Firewall was not changed. `README.md` says how to preview the site locally and, if wanted later, on a phone.

## Next

Waiting for the maintainer. On "continue": push, then Phase 4 (quality pass and `docs/qa-report.md`). Phase 4 has not been started.
