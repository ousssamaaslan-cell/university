# Progress

State on 2026-10-08.

- Phases 0 to 4 and the eight critique fixes: done and committed on `main`.
- Phase 4 review decisions: the normal empty-tab edge, click-only language memory, Netlify report form, and static French social previews are implemented in four separate commits. The purple visited-title colour is unchanged; no S4 jump links were added.
- Phase 5 repository setup: Netlify configuration, a restricted publish copy, documentation, and an exact file manifest are ready. The maintainer still needs to connect the GitHub repository in Netlify and enable form notifications. No public deployment has been verified.

## Phase 5 — Netlify preparation

- `netlify.toml` runs `node scripts/doctor.cjs && node scripts/publish.cjs` and publishes `.netlify-publish` only. The copy contains 76 files: five HTML pages, one stylesheet, 14 browser scripts, the catalogue, two image assets, and 53 catalogue-linked placeholder PDFs. `docs/published-files.md` lists each file. It excludes project docs, templates, scripts, tests, instructions, and `assets/README.md`.
- The root `404.html` works for unknown Netlify paths with `<base href="/">`. Security headers and short browser cache times are configured; PDFs cache for one hour. Forms need Netlify form detection and an email notification after connection.
- The 53 PDFs are still visibly marked samples. Arabic review, S4 modules, real PDFs, and the public URL remain open decisions. No live host, form submission, or notification has been verified yet.

## Phase 4 — quality

`docs/qa-report.md` is the full record: what was tested, each finding, and what is not verified. In short:

- **Reviews.** The `design-reviewer` and `quality-reviewer` agents read the whole site with 35 screenshots and the test results. Neither found a high-severity problem. Each of their findings was reproduced in the browser before it was fixed. `/lp-check` cannot be called by Claude, so its written steps were followed by hand, with `templates/qa-report.md`.
- **Tests.** About 4,800 automated browser checks in French and Arabic at 375 and 1280px (layout also at 320, 640 and 768): home, every module and tab, filters, search, PDFs, the former email report link, the language switch, the 404 page, an emulated project subpath, a crawl of 272 links, keyboard only, headings, labels, names and contrast, loading and error states, metadata, and the add-a-document workflow in a throwaway copy. axe-core 4.10.2 on 128 page states. All passed on the Phase 4 code, before the review decisions above.
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

The Phase 4 review left these decisions. The maintainer has now chosen the empty-tab edge, report form, language memory, and social previews, as recorded above. The following stay unchanged:

- The purple of opened titles, which is as dark as the link blue.
- A jump to Semestre 4 on the phone home page, once S4 has modules.
- Individual module names in chat previews still require separate static module pages; the current tags provide a shared French default.

Not verified: a real phone, a real screen reader, Safari and Firefox, Netlify's live file headers and form handling, real browser zoom, Lighthouse.

After the public URL is known: sitemap and canonical links; `modulepreload` lines for a faster first load and a PNG icon for Safari and iPhone remain outside this request.

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
- The date of the last update on the future public host. Locally it is the day `data/resources.json` was last saved.

### Choices made while building

Say so if you prefer otherwise.

- **"Examens" shortcut.** A module with no exam (MN, GP) has no shortcut, so nobody taps through to an empty tab.
- **Date of the last update.** It comes from the server (the `Last-Modified` header of the catalogue), shown as the day in Algeria. Nobody types it. The 404 page does not load the catalogue, so it shows no date.
- **"Signaler une erreur" at that stage.** It opened a prepared email. Phase 4 review replaced it with the Netlify form described above.
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

Push the repository changes, then connect the repository in Netlify, enable form detection and email notifications, and verify the public site. Do not announce it as real study material while the sample PDFs remain.
