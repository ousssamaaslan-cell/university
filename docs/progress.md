# Progress

State on 2026-10-09.

- Phases 0 to 4 and the eight critique fixes: done and committed on `main`.
- Phase 4 review decisions: the normal empty-tab edge, click-only language memory, Netlify report form, and static French social previews are implemented in four separate commits. The purple visited-title colour is unchanged; no S4 jump links were added.
- Phase 5 repository setup: Netlify configuration, a restricted publish copy, documentation, and an exact file manifest. The maintainer has since connected the repository; Netlify deploys `main` at `https://admirable-concha-bbf7df.netlify.app`.
- Phase 6: an admin form at `/admin` (Decap CMS, GitHub login through Netlify). Built, tested locally, and pushed. The GitHub login and the first real save wait for the maintainer's OAuth app; see "Phase 6" below.

## Phase 6 — admin form

What was built:

- **`admin/`**, seven files: the page, `admin.js` (the form and the wiring to Decap), `catalogue-rules.js` (what a save writes and refuses), `github-commit.js` (one commit for the catalogue and the PDFs), the Decap CMS 3.16.3 bundle, and its two licence files. The bundle is kept in the repository, with its hash in `vendor-manifest.json`, so the page loads no script from another site.
- **Login.** Decap's GitHub backend with Netlify as the OAuth provider, as the current Decap and Netlify documentation describe. Git Gateway is marked deprecated in Netlify's documentation and is not used; Netlify Identity is not needed and is not used. The login asks for public repositories only, since the repository is public.
- **The form.** A list of documents; "add" asks for the type (Cours, TD, TP, Examen) and opens that type's fields. Semestre, Module, Année universitaire, Session, and Nature de l'examen are lists built from the catalogue and the content model; chapter, sheet number, and order are number fields; "contient le corrigé" is a switch; both titles are required.
- **On save.** The ID, `level`, an empty `order`, and the PDF's folder and name are filled in; the record goes where the site would list it and the rest of `data/resources.json` stays byte for byte the same; the catalogue and the PDFs go to GitHub in one commit. What the lists cannot prevent is refused with the reasons shown until closed: a module outside the chosen semester, a rattrapage exam in the normal session, a file that is not a PDF, a changed module or type on a published document, and a form opened before the catalogue changed elsewhere.
- **Publication.** `scripts/publish.cjs` names the seven admin files one by one: 83 published files in all, listed in `docs/published-files.md`. `netlify.toml` sends `X-Robots-Tag: noindex, nofollow` for `/admin/`. No student page links to it.
- **Checks.** The doctor also fails on a token or OAuth secret in a published file, on a publish folder other than the allowlisted copy, and on a missing admin file. `node scripts/test-admin.cjs` (17 tests) checks the save rules, the commit, and that the doctor accepts what the admin commits and stops 16 kinds of bad entry.
- **Documents.** `README.md` (how to use the form, the one-time login setup), the `add-resource` skill, `docs/project-brief.md`, `docs/content-model.md`, `.claude/CLAUDE.md`, four rules, `lp-plan`, `lp-build`, `NOTICE.md`, and `docs/qa-report.md`.

Three things Decap does not do by itself, and how they are done here:

- It saves an uploaded file under its own name in one shared folder. The save is taken over to rename and place the PDF.
- It keeps showing what was typed after a save. The form is reopened after each save so it shows the saved IDs and paths.
- It removes a list item without removing its file. The save removes the PDF in the same commit, because the doctor fails on a PDF that no record uses.

Choices made while building. Say so if you prefer otherwise.

- **French interface.** Decap's own labels and the form's are in French, like the site's default.
- **Documents only.** Modules and semesters stay in the repository route (`/add-resource`).
- **50 MB per PDF.** Students download these on phones; GitHub accepts more.
- **IDs.** `asd3-cours-ch02`, `asd3-td-03`, `asd3-tp-02`, `asd3-examen-2024-2025-emd`, with the year added to a Cours, TD, or TP that has one, and `-2` for a second document with the same facts.
- **Order of exams inside a year, when left empty:** contrôle 1, EMD 2, examen final 3, rattrapage 4.
- **Année universitaire list:** this year and the 24 before it, plus any year a document already uses.
- **A published document keeps its module and type.** To move one, remove it and add it again; its address and file name come from both.
- **The local preview does not touch GitHub.** On `localhost` the form works on a copy in the browser tab, to try it safely.

Verified on the published site after the push (commit `43c45a0`): `/admin/` answers with `X-Robots-Tag: noindex, nofollow` and shows Decap's "Se connecter avec GitHub" screen, `/admin` redirects to it, every admin file is byte for byte the repository's, and the repository's documents, scripts, and instructions answer 404. `docs/qa-report.md` has the details.

Not verified, because they need the maintainer:

- The GitHub login on the published site.
- A real save: the commit on GitHub, the Netlify build, and the document on the site.

Seen on the published site, not changed: Netlify adds a "Powered by Netlify" badge, through a script of its own, to every page it serves. The admin's notes were moved to the bottom left so the badge does not cover them.

Known and left as is:

- The form needs a window at least 800 pixels wide. That is Decap's layout; on a phone it scrolls sideways.
- Decap's "Media" button stays in the header. An upload or a deletion from there is refused with a message, because a PDF belongs to a document.
- Each save is one commit and one Netlify build. Adding ten documents one by one makes ten builds; several documents can be added in one save.
- The sample documents appear in the form like any other and can be removed there.
- Decap offers to restore a local backup when a form was left with unsaved changes. If the catalogue changed meanwhile, the restored form is refused on save and must be redone.

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

For the maintainer: create the GitHub OAuth app, install it in Netlify (`README.md`, "One-time setup of the GitHub login"), log in at `/admin/`, and add one document as a test. Then check the commit on GitHub, the Netlify build, and the document on the site.

Still open from Phase 5: form detection and email notifications for "Signaler une erreur" on Netlify. Do not announce the site as real study material while the sample PDFs remain.
