# Progress

State on 2026-10-08.

- Phases 0 to 3 and the eight critique fixes: done and **pushed**. GitHub `main` is at `3826c85`.
- Phase 4, quality: done and committed on `main`. **Not pushed.**
- Phase 5, deployment: not started.

## Phase 4 — quality

`docs/qa-report.md` is the full record: what was tested, each finding, and what is not verified. In short:

- **Reviews.** The `design-reviewer` and `quality-reviewer` agents read the whole site with 35 screenshots and the test results. Neither found a high-severity problem. Each of their findings was reproduced in the browser before it was fixed. `/lp-check` cannot be called by Claude, so its written steps were followed by hand, with `templates/qa-report.md`.
- **Tests.** About 4,800 automated browser checks in French and Arabic at 375 and 1280px (layout also at 320, 640 and 768): home, every module and tab, filters, search, PDFs, the report link, the language switch, the 404 page, an emulated GitHub Pages project path, a crawl of 272 links, keyboard only, headings, labels, names and contrast, loading and error states, metadata, and the add-a-document workflow in a throwaway copy. axe-core 4.10.2 on 128 page states. All pass on the final code, with no console error.
- **Found and fixed: 23 findings.** Nine medium, fourteen low. The main ones:
  - the page jumped while loading (layout shift 0.46 to 0.96, now about 0.04);
  - "Recharger la page" did nothing on an address ending in `#s3`;
  - "asd3 td 3" listed every TD of ASD3;
  - Alt+Left on the tabs changed tab instead of going back;
  - exams with the same title in two modules had the same screen-reader name;
  - the doctor said OK while PDFs that no record uses stayed in `pdfs/`.
- **The doctor checks more.** It now fails on a file under `pdfs/` without a record, a PDF not named after its ID, an ID that does not start with its module, an unknown top-level key, and a label present in one language only.
- **Design kept.** No decision from the design critique was undone. The measurements below are unchanged, and the Impeccable detector still reports 0 findings in the source files and on eight pages at 1280 by 800 and 390 by 844.
- **Layout changes a reader can see.** The footer appears together with the list instead of before it. With a filter set, the count and the reset button share one line. From the tabs, Tab goes straight to the first document. In search results the module name lines up with the titles under it.

For the maintainer to decide; nothing was changed for these, and `docs/qa-report.md` gives the detail:

- Two points where the design reviewer disagrees with a decision already made: the pale edge of an empty tab (1.42:1), and the purple of opened titles, which is as dark as the link blue.
- A jump to Semestre 4 on the phone home page, once S4 has modules.
- "Signaler une erreur" does nothing without a mail app, and the address can be harvested from the page source.
- Any link with `?lang=ar` changes the remembered language.
- Shared links preview as "Module | Ressources L2 Informatique" in chat apps, because those do not run scripts.

Not verified: a real phone, a real screen reader, Safari and Firefox, the mail app, GitHub Pages itself (file sizes and the date of the last update depend on what it sends), real browser zoom, Lighthouse.

For Phase 5: publish only the site files (a plain branch deployment would also publish `docs/`, `templates/`, `scripts/` and the README); sitemap and canonical links once the public URL is known; `modulepreload` lines for a faster first load; a PNG icon for Safari and iPhone.

No test server is left running, and the temporary test scripts and screenshots were deleted.

## Critique fixes

All pushed. The sections below are the record of that work.

### Done

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

### Measurements

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

### Checks that were run at the time

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

### Choices made while building

Say so if you prefer otherwise.

- **"Examens" shortcut.** A module with no exam (MN, GP) has no shortcut, so nobody taps through to an empty tab.
- **Date of the last update.** It comes from the server (the `Last-Modified` header of the catalogue), shown as the day in Algeria. Nobody types it. The 404 page does not load the catalogue, so it shows no date.
- **"Signaler une erreur".** The address is set once, as `REPORT_EMAIL` in `js/components.js`. The email already names the page the reader was on and, for a missing PDF, the file. The footer asks "Un fichier manquant ou incorrect ?" before the link. The address is not printed on the page.
- **Visited colour.** Purple: `#70359c` in light mode, `#cdb0ff` in dark mode.
- **The Impeccable ignore block.** No official text was found in the installed Impeccable (version 0.1.11) or on the web. The lines between the two markers in `.gitignore` were written to do what was asked: keep `config.json`, `design.json`, `surfaces/*.md` and `critique/*.md`, ignore everything else in `.impeccable/`. Paste the official block over them if you have it.
- **The critique file.** Its header holds the folder path on this computer (`C:\Users\STS\...`). It is in Git now and becomes public with the push.

### Known and left as is

- In Arabic, on a screen narrower than about 340px, the site name takes three lines and the header grows by 23px when it is drawn.
- On a 320px screen the facts of a row can take four or five lines beside "Télécharger".
- Searching "examen 2024" also finds the exams of 2024-2025, because "2024" is in both years.
- A document opens in the same tab. The browser's back button returns to the list.
- All Arabic text is still a draft awaiting the maintainer's review, including the footer and report texts, the two labels changed in step 7, and the texts added in Phase 4 (page descriptions, "Chargement impossible", the old-browser message).

The check on a real phone was skipped at the maintainer's request. Windows Firewall was not changed. `README.md` says how to preview the site locally and, if wanted later, on a phone.

## Next

Waiting for the maintainer. On "continue": push the Phase 4 commit, then Phase 5 (deployment to GitHub Pages). Phase 5 has not been started.
