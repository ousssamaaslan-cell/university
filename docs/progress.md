# Progress

State on 2026-10-10.

- Sample data: removed on 2026-10-10 at the maintainer's request. The catalogue holds one document, the one the maintainer added through the admin form; see "Sample data removed" below.
- Phases 0 to 4 and the eight critique fixes: done and committed on `main`.
- Phase 4 review decisions: the normal empty-tab edge, click-only language memory, Netlify report form, and static French social previews are implemented in four separate commits. The purple visited-title colour is unchanged; no S4 jump links were added.
- Phase 5 repository setup: Netlify configuration, a restricted publish copy, documentation, and an exact file manifest. The maintainer has since connected the repository; Netlify deploys `main` at `https://admirable-concha-bbf7df.netlify.app`.
- Phase 6: an admin form at `/admin` (Decap CMS, GitHub login through Netlify). Built, tested locally, and pushed. The maintainer made the first real save on 2026-10-09 (commit `1f9efb9`); see "Phase 6" below.
- Phase 7: a custom admin dashboard at `/admin`, in plain HTML, CSS, and JavaScript, with the Decap form moved to `/admin/decap` as a temporary backup. Built and tested on this computer, in seven commits. The GitHub login and a real save on the published site are the maintainer's test; see "Phase 7" below.

## Phase 7 — admin dashboard — 2026-10-10

What was built:

- **`admin/`**, eleven files of our own, no library: the page and its stylesheet, `admin.js` (session, login screen, header, tabs), `form.js` (add and edit), `documents.js` (the list, the confirmation), `ui.js` (labels and messages), `local-preview.js`, and four files that run without a browser so the tests can run them: `catalogue-rules.js` (what a change may write), `github-commit.js` (the commit), `admin-flow.js` (read, apply, commit, retry; the watch on the public site), and `netlify-auth.js` (the login).
- **Login.** The same exchange as Decap's: the same Netlify address, `site_id`, and scope `public_repo`. Nothing changes on GitHub or Netlify. Checked against Netlify's current documentation, which names the `netlify-auth-providers` library, and against the copy of that library inside the Decap bundle. The token is kept in the tab's session storage only.
- **Ajouter un document.** Seven steps on one page: semester (S4 disabled, with a note), module buttons with code, name and count, four type buttons, the fields of the type, the two titles, the PDF zone, and a preview with the ID, the PDF path, and the row in French and Arabic. A document already at the same place is shown with its title and a box to tick. "Publier" stays disabled while anything is missing, and says what. After a publication: "Publié. Visible sur le site dans environ une minute.", a link to the module page, and "Ajouter un autre document dans ce module". The last semester, module, and type are remembered in the browser.
- **Mes documents.** Every document read from GitHub, by semester, module (each one folds), and type with counts, in the site's order. A search box (title in either language, module, number, year), a type filter, "Rafraîchir". Each row: both titles, the facts, the size, the ID, and "Voir", "Modifier", "Supprimer". Ticked rows are deleted together. A module without documents offers to add one.
- **Saving.** Each action is one commit with the catalogue and the PDF change: `Admin: add …`, `Admin: edit …`, `Admin: delete …`. The catalogue is read from GitHub again before every save. If `main` moved during the save, one more read and one more try; then it stops and asks to refresh. Never forced. Only `data/resources.json` and `pdfs/<semester>/<module>/<id>.pdf` can be written or removed.
- **After a commit.** The public `data/resources.json` is asked every 15 seconds for up to 5 minutes. The message becomes "En ligne ✓", or "Toujours en cours de déploiement" with a link to the project's Deploys page on Netlify.
- **Decap backup.** The Phase 6 form is at `/admin/decap/`, its bundle moved byte for byte (`vendor-manifest.json` and `.gitattributes` follow). It uses the same login and the same save rules. The dashboard's footer links to it. `README.md` says it is temporary.
- **Publication.** `scripts/publish.cjs` names the sixteen admin files one by one: 40 published files in all, listed in `docs/published-files.md`. No student page was changed in this phase.
- **Checks.** The doctor now reads every page, script, and stylesheet under `admin/` for credentials, and fails if a student page mentions the admin or if `/admin` loses its `noindex`. `node scripts/test-admin.cjs` has 42 tests (17 before). `docs/qa-report.md` has the browser checks.
- **Documents.** `README.md` (add in three steps, delete in three steps, the Decap backup), the `add-resource` skill, `docs/project-brief.md`, `docs/content-model.md`, `docs/design-system.md`, `docs/published-files.md`, `NOTICE.md`, `.claude/CLAUDE.md`, four rules, `lp-plan`, `lp-build`, and `docs/qa-report.md`.

Choices made while building. Say so if you prefer otherwise.

- **The login is written in project code,** about sixty lines, following the exchange of Netlify's library. That library is a 2017 alpha; vendoring it would have added a second prebuilt script for the same result.
- **An academic year stays possible on a Cours, TD, or TP,** as an optional list, because the content model allows it and the one published document has one. Your list of fields did not name it.
- **The duplicate warning ignores the year** for a Cours, TD, or TP: same module, type, and number is enough, as you wrote it. The warning then suggests choosing the year when it is another year's version.
- **"Voir" opens the PDF from GitHub,** not from the public site, so a file added or replaced a minute ago can be checked at once.
- **"Se déconnecter" also ends Decap's login,** which Decap keeps in the browser's local storage. Otherwise a GitHub token would stay in the browser after logging out.
- **No "ordre d'affichage" field.** A new document's order is its number (for an exam: contrôle 1, EMD 2, examen final 3, rattrapage 4). An order typed by hand in the Decap form is kept on an edit.
- **An edit keeps the ID and the file name** even when the number or the year changes, and the preview says so.
- **An edit of a document that changed elsewhere is refused,** not merged: the form asks to go back to the list.
- **Each row shows the document's ID,** which is also its file name, to match a row with a commit or a file on GitHub.
- **50 MB means 50,000,000 bytes,** as in the Decap form. The warning starts above 10,000,000.
- **Deleting several documents at once** was built: the rules already handled a list.
- **"Termes recommandés" opens `docs/content-model.md` on GitHub,** because the repository's documents are not published on the site.
- **The project instructions were updated** (`.claude/CLAUDE.md` and the rules) where they still described Decap as the admin.

Verified on the published site after the push (commit `0b05e18`), with requests that only read: `/admin/` and `/admin/decap/` answer with `noindex`, the 14 admin scripts, stylesheet, and licence files are byte for byte the repository's, the bundle's old address and the repository's documents answer 404, and the home page does not mention the admin.

That look found one defect, fixed in a follow-up commit (`9b02f33`, also confirmed on the published site): Netlify sends PDFs compressed, so the length a browser is given is not the file's size, and the dashboard would never have said "En ligne ✓" after a replaced PDF. It now goes by the server's mark of the content and by the file itself.

To decide, on the student side (not changed in this phase): on the published site the module page shows "PDF" without a size, for the same reason. On a local preview it shows "PDF, 210 ko".

Not verified, because it can only be done on the published site with your GitHub account: the login, a real addition, edit, replacement and deletion, and "En ligne ✓" against the real Netlify. The checklist is in the last message of the session and in `docs/qa-report.md`.

Known and left as is:

- A 50 MB PDF is sent to GitHub as text about a third larger. On a slow connection this takes minutes; the page says to keep it open. No large file was sent to the real GitHub.
- What a phone does with "Voir" was not seen. A phone browser that cannot show PDFs will offer to download the file.
- Each action is one commit and one Netlify build.
- The Decap backup still keeps its own login in local storage while it is in use.
- The dashboard does not create modules or semesters, and does not move a document to another module or type.

## Sample data removed — 2026-10-10

The maintainer asked for the samples to be deleted and their own document kept. Done in the repository, in one commit:

- **Catalogue.** The 53 `sample-` records are out of `data/resources.json`. What is left is byte for byte the old file without them: 2 semesters, 7 modules, and `poo1-tp-02-2026-2027`.
- **PDFs.** The 53 placeholder PDFs are deleted. `pdfs/` holds `S3/poo1/poo1-tp-02-2026-2027.pdf` and `S4/.gitkeep`.
- **Publish copy.** 31 files, down from 84 (83 plus the maintainer's PDF); `docs/published-files.md` lists them.
- **Documents.** `README.md`, `docs/project-brief.md`, `docs/published-files.md`, `docs/qa-report.md`, and this file.

Checked: the doctor (1 resource, 0 samples), the 17 admin tests, and the pages in a browser through a local server, in French and Arabic at 375 and 1280px. After the push (commit `ee19241`), the published site: its catalogue is the repository's, the kept PDF answers 200, and the 53 sample PDF addresses answer 404. `docs/qa-report.md` has the details.

What a student sees now: six modules say "Aucun document", POO1 has one TP, and the sample notice is gone.

Left in place on purpose: the sample notice and the "Exemple" mark in the scripts, the doctor's sample count, and `scripts/make-sample-pdfs.cjs`. They do nothing without a `sample-` record. The rules and `docs/content-model.md` still describe the sample exception; they can be shortened once the maintainer says samples will not come back.

To decide: the kept document has the French title "programmation oriente objet" and the Arabic title "سيبلاتنم", which is not a word. If it was a test, remove it in the admin form; if it is real, correct both titles there.

## Phase 6 — admin form

This form is now the temporary backup at `/admin/decap/`; Phase 7 above replaced it at `/admin/`. The record below describes it as it was built, when its files were directly in `admin/`.

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

The first real save, by the maintainer on 2026-10-09: commit `1f9efb9`, "Admin: add poo1-tp-02-2026-2027", with the record and a 210,089-byte PDF. On 2026-10-10, before the samples were removed, the published catalogue listed that document and its PDF answered 200 as `application/pdf` with the same size.

Not done yet on the published site: changing a document and removing one through the form.

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

For the maintainer:

1. Test the new dashboard on the published site: log in, add one document of each type, edit one, delete them, and confirm on the site and on GitHub that the PDFs are gone.
2. Decide what `poo1-tp-02-2026-2027` is (a test to remove, or a real document to retitle); both can now be done in **Mes documents**.
3. Add the real documents through `/admin/`.
4. When the dashboard has been used for a while, ask for the Decap backup at `/admin/decap/` to be removed.

Still open: form detection and email notifications for "Signaler une erreur" on Netlify, the review of the Arabic drafts, the S4 modules, and the final public address. Do not announce the site to students before real documents are in it.
