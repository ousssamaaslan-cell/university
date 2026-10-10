# QA report — L2 study resources

## Sample data removal — 2026-10-10

The 53 `sample-` records and their placeholder PDFs were removed from the repository. One document stays: `poo1-tp-02-2026-2027`, added by the maintainer through the admin form. The sections below this one describe the site while it still held the samples.

Environment: Windows 10, the browser driven by Playwright, at 375 by 812 and 1280 by 812. The pages were served from `.netlify-publish` by a small local static server, stopped afterward. The check scripts were temporary and are not in the repository.

| Check | Status | Evidence and limit |
| --- | --- | --- |
| Only the samples left the catalogue | Passed | The new `data/resources.json` is byte for byte the committed one without the records whose `id` starts with `sample-`: 54 records before, 53 removed, 1 kept. The 53 removed `pdfPath` values match the 53 tracked `sample-` PDFs one to one. |
| Catalogue and project doctor | Passed | `node scripts/doctor.cjs` returned `ok: true`: 2 semesters, 7 modules, 1 resource, 0 samples, 48 vendored files verified. |
| Admin save rules | Passed | `node scripts/test-admin.cjs`: 17 tests pass. No file in `admin/` changed. |
| Publish boundary | Passed | `node scripts/publish.cjs` makes 31 files: the 30 site and admin files and one PDF. `docs/published-files.md` lists them. |
| Pages without the samples | Passed | 21 addresses, each in French and Arabic at both widths: the home page, the seven modules, the four tabs of POO1, the Examens tab of ASD3, six searches, and the report page. Every page had the right language and direction, no sample notice, no "Exemple" mark, no link to a `sample-` PDF, no horizontal overflow, and nothing left loading. No console error or warning. |
| Empty states | Passed | The home page shows "Aucun document" for six modules and "1 document" for POO1. A module without documents says "Ce module n'a pas encore de document." The three empty tabs of POO1 each say so. Searches for "asd3 td 3" and "sample" answer "Aucun résultat". |
| The kept document | Passed | POO1, TP tab: "TP 2, programmation oriente objet, 2026-2027, Sans corrigé, PDF, 210 ko". The title link comes before "Télécharger". The PDF answers 200 as `application/pdf`, 210,089 bytes, starting `%PDF-` and ending `%%EOF`. A click on "Télécharger" saved `poo1-tp-02-2026-2027.pdf`. Searches for "poo1", "programmation", and "tp 2" find it. |
| Removed files | Passed | Locally, `pdfs/S3/asd3/sample-asd3-cours-ch01.pdf` answers 404, and an unknown address shows the 404 page. |
| Request log | Passed, with a note | The only entries were the header requests for the kept PDF. Playwright logs each one as `net::ERR_ABORTED` one millisecond after its 200 response; the page's own request succeeded and the row shows the size, not "Fichier indisponible". Whether the same log line appears against Netlify was not looked at. |
| Screenshots | Viewed | The home page in French at 1280px and in Arabic at 375px, and the TP tab of POO1 at 1280px. Nothing clipped or misplaced. |
| Exam filters | Not applicable | No exam is left in the catalogue, so there is no filter to show. |
| Admin form with the shortened catalogue | Not checked | The form was not opened after the change. It reads the same catalogue the doctor and the 17 tests accept. |
| Keyboard walk-through, screen reader, phone, Safari, Firefox | Not checked | No student page changed; the Phase 4 results were not repeated. |
| Live site after the push | Not checked at the time of this commit | Before the change, on 2026-10-10, the live catalogue held 54 records (53 samples and the maintainer's document) and the document's PDF answered 200 with 210,089 bytes. |

## Phase 6 verification — 2026-10-09 (admin form)

Environment: Windows 10, Node 24.11, Chrome driven by Playwright at 1280 by 800. The pages were served by a small local static server; the published copy was served from `.netlify-publish`. The test scripts were temporary and are not in the repository, except `scripts/test-admin.cjs`.

| Check | Status | Evidence and limit |
| --- | --- | --- |
| Catalogue and project doctor | Passed | `node scripts/doctor.cjs` returned `ok: true`: 53 resources, 53 samples, 48 vendored files verified, including the three Decap files. |
| Save rules and GitHub commit, without a browser | Passed | `node scripts/test-admin.cjs`: 17 tests pass. They cover what a save writes for each type, what it refuses, the commit against a stand-in for GitHub's API, and the doctor checks below. |
| The doctor accepts what the admin commits | Passed | In a throwaway copy of the project: four documents added through the save rules (one of each type), then one PDF replaced, one title changed, and one document removed. The doctor returned no error after each round. |
| The doctor stops a bad entry made through the admin | Passed | In the same copy, 16 kinds of bad entry each made the doctor fail with its own message: the form as Decap alone would save it, a PDF left in the staging folder, a record without its PDF, a file that is not a PDF, an empty PDF, a wrong file name, a wrong folder, a wrong semester, an ID without its module, a number typed as text, a field of another type, an optional field written empty, a title in one language, a rattrapage exam in the normal session, the form's own field carried into the file, and the module list dropped. It also fails on a GitHub token or an OAuth secret in a published file, on a publish folder other than `.netlify-publish`, and on a missing Decap bundle. |
| Admin form in the local preview | Passed | Six scripted scenarios in the browser: add a TD with a PDF named `Série TD N°7 (Corrigé).PDF` (saved as `pdfs/S3/asd3/asd3-td-07.pdf`, record between TD 6 and TP 1, rest of the file byte for byte unchanged); change it in the same session; a second TD 7 (`asd3-td-07-2`); an exam refused for three reasons, corrected, and accepted; a PDF replaced at the same path; a module change refused; a document removed; a form made stale by another change, refused; two documents in one save; an upload from the media library, refused. No request failed and no console error appeared beyond the logged refusals. The local preview writes to a copy in the browser tab, never to GitHub. |
| Admin form as it runs on Netlify, against a stand-in for GitHub | Passed, with the limit stated | The page was opened under the site's own address inside the test browser, with the site answered from local files and `api.github.com` answered by an in-memory stand-in. With a stored session: the form loaded 53 documents through Decap's GitHub backend; a TD with a PDF went into one commit on the previous head, with the PDF's bytes identical to the chosen file and the message `Admin: add asd3-td-07`; a second change in the same session and a removal each made one commit, the removed PDF leaving the tree in that commit; a branch moved by somebody else and an expired session were both refused with a clear message and left the branch alone. No request went to an unknown API route. This proves the code path, not GitHub: the stand-in was written from GitHub's API documentation and is not GitHub. |
| Reading from the real GitHub API | Passed | The admin's own read code, run without a token against the public repository, returned the same head commit as `origin/main` and a catalogue identical to it. Nothing was written. |
| Publish boundary | Passed | `node scripts/publish.cjs` exits 0 and makes 83 files: the 76 of Phase 5 and the seven admin files. `docs/published-files.md` matches the folder exactly. Served from that folder, `/docs/project-brief.md`, `/README.md`, `/scripts/doctor.cjs`, `/scripts/test-admin.cjs`, `/.claude/CLAUDE.md`, `/netlify.toml`, and `/vendor-manifest.json` answer 404. The published text files hold no local path, email address, token, or secret (the Decap bundle and its notices were not scanned; their hashes are verified instead). |
| Student pages after the change | Passed, smoke check only | From the publish folder: the home page lists the seven modules and has no link to the admin; the ASD3 page shows its four tabs with 5, 6, 4, and 7 documents; a search returns results; a PDF answers 200 as `application/pdf`; no console error. No student file was changed in this phase, so the Phase 4 checks were not repeated. |
| GitHub login through Netlify | Blocked | It needs the maintainer's GitHub OAuth app, installed in Netlify. On the live address the page shows Decap's "Se connecter avec GitHub" screen; the button was not pressed. |
| A real save from the published site | Blocked | Same reason. The first real save is the maintainer's test: add one document through `/admin`, then check the commit on GitHub, the Netlify build, and the document on the site. |
| `/admin` on the live site after the push | Passed | Checked on `https://admirable-concha-bbf7df.netlify.app` on 2026-10-09 with GET and HEAD requests, about a minute after commit `43c45a0` was pushed. `/admin/` answers 200 with `X-Robots-Tag: noindex, nofollow` and the four site-wide security headers; `/admin` redirects (301) to `/admin/`; the six admin scripts and licence files and `data/resources.json` are byte for byte the repository's, the 5,167,389-byte Decap bundle included; thirteen repository paths (`docs/`, `scripts/`, `.claude/`, `README.md`, `netlify.toml`, `vendor-manifest.json`, and others) answer 404; the home, module, search, and report pages and a PDF still answer 200 without the `noindex` header; the home page does not mention the admin. In Chrome the page loads its four scripts and the catalogue and shows the login screen. |
| Admin form on a phone | Failed, not fixed | Decap's editor has a minimum width of 800 pixels: at 390 pixels the page scrolls sideways. The form is a computer tool; the README says so. |
| Keyboard, screen reader, and contrast of Decap's interface | Not checked | The scripted runs chose list values with the keyboard, which is not an audit. The notes added by this project use `role="alert"` or `role="status"` and a focusable "Fermer" button. |
| Browsers | Chrome only | Safari and Firefox were not used. |

Found and fixed while testing:

1. **A second save in the same session was refused.** Decap keeps showing what was typed after a save, while the catalogue now held the new ID and PDF path. The form is now reopened after each save, so it shows what was saved.
2. **Reopening the form asked "leave this page?" after a save with a PDF on the GitHub path.** Decap marks the form as saved a moment later there. The form is now reopened only once Decap reports no unsaved change.
3. **The form and the save could have read the catalogue in two different ways.** Both now use the same read, so the stale-form check cannot fire on a difference between two readers.
4. **Decap's own error message disappears after eight seconds.** Refusals, and each successful save, now leave a note at the bottom of the window until it is closed.
5. **Netlify's badge would have covered the notes' "Fermer" button.** The live site shows a "Powered by Netlify" badge in the bottom right corner. The notes now sit at the bottom left and leave that corner free: 448 pixels at a 1280-pixel window, 224 at 820. Checked locally by measurement; the badge itself only exists on the live site.

Limits to know:

- **Netlify adds two things to every HTML page it serves,** the student pages and `/admin/` alike: a comment saying the site is hosted on Netlify, and a script, `/.netlify/scripts/hud`, that draws the "Powered by Netlify" badge. Neither is in this repository, so the served HTML differs from the repository's by those lines. Whether the badge can be turned off is a Netlify setting, not checked here.
- **Test requests that left this computer.** In an early run of the stand-in check, the test script answered `/admin` with a redirect, and the browser followed it to the real address: one `GET /admin/`, answered by the site's 404 page. The script was corrected and the later runs stayed on this computer. Later, when the live page was opened in the same test browser, Decap found the made-up session the stand-in check had stored for that address and sent two requests to GitHub with the made-up token `test-token`; GitHub answered 401 and Decap showed the login screen. No real token existed at any point, and nothing was written anywhere.
- **Only the main Decap file is vendored.** The npm package also has 94 small files and two WebAssembly files that Decap loads on demand for features this form does not use. None was requested in any run.
- **Saving two changes at once from two tabs** is refused for the second one (stale form), which is the intended behaviour, but the maintainer then has to redo that change.

## Phase 5 verification — 2026-10-08

The detailed Phase 4 report below is a historical baseline. After the four review decisions and Netlify preparation, these checks were run against the new code:

| Check | Status | Evidence and limit |
| --- | --- | --- |
| Catalogue and project doctor | Passed | `node scripts/doctor.cjs` returned `ok: true`, with 53 resources and 53 visibly labelled samples. |
| Publish boundary | Passed | `node scripts/publish.cjs` made 76 files in `.netlify-publish`: five HTML pages, one CSS file, 14 browser JS files, one JSON catalogue, two image assets, and 53 catalogue-linked sample PDFs. `docs/published-files.md` lists every file. The manifest matched the generated folder, and text files contained neither the maintainer address nor a local machine path. No docs, templates, scripts, tests, project instructions, or `assets/README.md` appeared. |
| Static form and social metadata | Passed | All five HTML pages have French Open Graph and Twitter title, description, and image tags. `report.html` contains a Netlify-detectable form with `form-name`, module, document, required problem, optional email, and a honeypot. JavaScript syntax checks passed. |
| Language memory | Passed in an isolated script check | A `?lang=ar` URL selects Arabic without writing local storage; a saved Arabic switch choice is read; an invalid query falls back to French. An interactive browser click on the switch was unavailable. |
| Local HTTP paths | Passed | A local server rooted at `.netlify-publish` returned 200 with the expected content types for the home, module, search, report and direct 404 pages, CSS, report JS, catalogue, preview PNG, and a sample PDF. The server was stopped afterward. |
| Browser interaction and responsive layout | Blocked | No browser control surface was available in this session. The form, language switch click, missing-file prefill, 404 at an unknown Netlify path, keyboard use, RTL layout, and phone appearance were not rechecked in a browser after the changes. |
| Live Netlify deployment | Blocked | The GitHub repository has not been connected to a Netlify project here. Form detection, POST handling, email notifications, security and cache headers, custom 404 response, and public link previews need checks on the deployed URL. |

Date / revision: 2026-10-08. The site as it is in the Phase 4 commit that contains this file (it follows `3826c85`). Every result below was obtained on that final code, after the fixes.
URL / environment (local or published): local only, `python -m http.server` on `http://127.0.0.1:8000/`. A project subpath was emulated inside the test browser, with every request answered from the local files. Nothing was published at the time of this Phase 4 report.
Browser / viewport / device: Chrome 155 on Windows 10, driven by Playwright. Phone checks at 375 by 812, desktop at 1280 by 800, layout also at 320, 640 and 768. This is desktop Chrome resized, not a real phone. No real screen reader.
Language and direction tested: French (left to right) and Arabic (right to left), every check in both.
Catalogue revision / sample module and PDF: 2 semesters, 7 modules, 53 sample records and 53 placeholder PDFs. Most detailed checks use ASD3 (22 documents); MN has an empty Examens tab, GP has no document.

Use Passed, Failed, Blocked, or Not applicable. A source inspection alone is not a browser pass.

| Check | Status | Evidence or command | Limitation / action |
| --- | --- | --- | --- |
| `node scripts/doctor.cjs` and catalogue validation | Passed | `ok: true`, 53 resources, 53 samples. In a throwaway copy, 19 deliberate mistakes in the catalogue and 7 more for the new checks each made it fail with a clear message. | The doctor gained five checks in this phase; see finding 9. |
| S3 and S4 navigation and confirmed module links | Passed | Home page compared with the catalogue: 7 S3 rows with code, name, count and link; "Examens" shortcut on the 5 modules that have exams and on no other; S4 shows "Bientôt disponible"; `#s3` and `#s4` scroll to their section. Crawl of 272 different links: 206 internal, all answer 200. | |
| `module.html?id=` valid, missing, and unknown IDs; `404.html` | Passed | All 7 modules open; `?id=ASD3` in capitals opens ASD3; missing and unknown IDs show "Module introuvable" with a link home and `noindex`; `404.html` opened directly shows its message with styles. | On the real host, unknown addresses were only emulated. |
| Cours, TD, TP, Examens tabs: grouping and ordering per type | Passed | For every module and tab: labels, counts, rows in the documented order, number or year marker, facts, link and download address; exams under year headings, newest first; default tab is the first type with documents; `type=` in the address opens that tab; an unknown `type` is dropped. | |
| Search: module name and abbreviation, resource titles, no results, accents and Arabic | Passed | 478 checks: abbreviation in both cases, full French and Arabic names whatever the page language, no accents, Arabic letter variants, academic year, "examen 2024-2025", type names, "td 3", "asd3 td 3", "chapitre 2", Arabic-Indic digits, pasted direction marks, no result, one character, nothing typed, text that looks like markup, cap at 30 documents, live typing, Enter, header search from three other pages. | "2024" finds both 2023-2024 and 2024-2025 by design. |
| Examens filters: academic year and session; combinations and reset | Passed | Options are built from each module's exams; every year by session combination gives the right rows; no-match message; address parameters; reset clears both and returns focus to the year filter; filters survive a visit to another tab, a reload and the language switch; values that are not on offer are dropped. | |
| PDF View opens the correct existing file | Passed | All 53 PDFs answer 200 as `application/pdf`, start with `%PDF-`, and sit at `pdfs/<semester>/<module>/<id>.pdf`. Clicking a title opens that file; Back returns to the same tab. No PDF is fetched before a click (only header requests). | The files are placeholders. What a phone does with a PDF link was not seen. |
| PDF Download retrieves the correct file | Passed | "Télécharger" saves `<id>.pdf` for one document of each type, by mouse and by keyboard. | Same limitation. |
| Add one sample confirmed resource using `/add-resource`; validate and remove test content before release | Passed | In a throwaway copy of the repository: one TD and one exam added to MN with `scripts/make-sample-pdfs.cjs`; doctor OK with 55; the TD is third in its tab with its badge; MN gains its Examens tab content and its home-page shortcut; search finds both; PDFs open and download. The copy was deleted. | The skill itself cannot be called by Claude (`disable-model-invocation`); its written steps were followed by hand. |
| Mobile, tablet, desktop, long titles, and 200% zoom | Passed | No horizontal overflow at 320, 375, 640, 768 and 1280 on every page and state; every control at least 44px tall; tabs on one row down to 320; the long TP title wraps cleanly; "Chapitre 10" does not break; with wider text spacing (WCAG 1.4.12) nothing is clipped. | 200% zoom was checked as the 640px layout and 400% as the 320px layout, which give the same page width as real zoom on a 1280px window. Real browser zoom was not used. |
| Keyboard, focus, labels, contrast, and screen-reader basics | Passed | 212 keyboard checks: Tab visits every control once in page order with a visible ring that is on screen and uncovered; skip link; arrow keys, Home and End on the tabs, mirrored in Arabic; filters and reset; Enter opens and downloads a PDF; Alt+Left is left to the browser. 132 structure and contrast checks: one h1 per page, no skipped heading level, labelled landmarks, labels on every field, unique link names, valid ARIA references; lowest text contrast measured 5.48:1. axe-core 4.10.2 on 128 page states (16 states, 2 languages, 2 widths, light and dark): 0 violations, 0 items needing review. | No real screen reader was used, so how names and live regions are read aloud is not verified. |
| French and Arabic language switch, `lang`, RTL, and mixed text | Passed | The switch keeps the page, tab, filters and query in both directions, by mouse and keyboard; it follows a tab or filter chosen without reload; `lang` and `dir` are right on every page; the language is remembered; every internal link carries `lang=ar` in Arabic; module codes, sheet numbers and years are isolated inside Arabic text; a typed year is echoed in the right order. | The Arabic text itself is a draft awaiting the maintainer's review. |
| Empty/loading/file-error states | Passed | Empty tab, empty module, no exam for the filters, no search result, nothing typed; "Chargement…" appears after a short wait on a slow catalogue; catalogue HTTP 500, 404, not JSON, JSON without its lists, empty file and offline each give one alert with a working reload link; a missing PDF shows "Fichier indisponible" and the report link; a failed file check (offline, HTTP 500) leaves the row usable. | Failures were simulated in the browser. |
| Console errors and failed requests | Passed | No script error or warning on any page, language, width or state in the runs above. | Expected entries only: the browser logs the document's own 404 on an unknown address, and the site logs one warning per missing PDF. |
| Performance lab baseline, if tooling exists | Passed | Chrome at 375 by 812, network shaped to about slow 4G (150 ms delay, 1.6 Mbit/s). Home: 10 requests, 89 kB. Module page: 18 to 20 requests, about 108 kB (10 scripts, 55 kB). Search: 34 to 42 requests (one header request per listed PDF). List on screen about 1.7 s after navigation. Layout shift about 0.04 with the sample notice and 0 to 0.03 without it; it was 0.46 to 0.96 before the fixes. | Lab figures from localhost with an uncompressed test server; a real host and phone will differ. Lighthouse is not installed and was not run. Largest-contentful-paint was not captured. |
| Titles, metadata, sitemap, and static-host paths | Passed, except sitemap: Blocked | Static HTML of the four Phase 4 pages: doctype, `lang`, `dir`, charset, viewport, title, description where indexable, `noindex` on search and 404, no address starting at the domain root, no external address. At runtime: title per page in the page language, a description per module, Arabic descriptions. Emulated project path: home, shortcut, PDF address, search, breadcrumb and five unknown addresses stayed under `/university/`. | Sitemap and canonical links need the public URL, which is not confirmed. |
| Published deployment and public PDF links, if released | Not applicable | Nothing is published. | Phase 5. |

Total: about 4,800 automated checks in seven test scripts, plus the axe-core scan, all passing on the final code. The scripts were temporary and are not in the repository.

## Prioritized findings

All were found in this phase and fixed. "Source" says who found it: T (the browser tests), A (axe-core), D (design-reviewer agent), Q (quality-reviewer agent). Every reviewer finding was reproduced in the browser before it was fixed.

1. **Medium. The page jumped while loading.** Before the list arrived the page was almost empty, so the footer sat in view and was then thrown down the page; the layout-shift score was 0.46 to 0.96 (0.1 is the usual limit). Fixed: the footer is drawn together with the content, and the scrollbar's place is kept on computers. Now 0.04 with the sample notice. Source: T, Q.
2. **Medium. "Recharger la page" did nothing when the address ended in `#s3`.** That is the address the breadcrumb of every module page leads to. Fixed: the link reloads from an address without the fragment. Source: D, Q.
3. **Medium. `index.html#%` replaced the module list with the load-error message.** Fixed: the jump to a section no longer runs inside the load's error handling. Source: Q.
4. **Medium. A number in a search did not narrow it.** "asd3 td 3" listed all six TDs of ASD3, because "3" is also in "ASD3". Fixed: a number typed after "td", "tp", "chapitre" or "الفصل" must be the document's own number. Source: D, Q.
5. **Medium. Alt+Left on the tabs changed tab instead of going back.** Fixed: the tabs ignore arrow keys pressed with Alt, Ctrl, Shift or the Windows key. Source: Q.
6. **Medium. In search results, exams with the same title in different modules had the same name for screen readers.** Fixed: the module's code is part of the name read aloud. Source: T.
7. **Medium. On an Arabic page a typed year was echoed reversed ("2025-2024").** Fixed: the typed words are isolated from the sentence around them. Source: D, Q.
8. **Medium. The module page had no heading, and a French title in Arabic, when the catalogue failed to load.** Fixed: it is headed "Chargement impossible" in the page language. Source: T, A, D.
9. **Medium. The doctor said OK while PDFs that no record uses stayed in `pdfs/`.** After the sample records are removed, the 53 placeholder PDFs could have stayed on the public site unnoticed. Fixed: the doctor fails on any file under `pdfs/` without a record, on a PDF not named after its ID, on an ID that does not start with its module, on an unknown top-level key, and on a label present in one language only. Source: Q.
10. **Low. The sample notice was outside every page region.** Fixed: it is a labelled region. Source: A, Q.
11. **Low. Search edge cases.** A query of stretch marks only matched everything; Arabic-Indic digits and pasted direction marks found nothing; the field had no length limit. Fixed. Source: Q.
12. **Low. `module.html?id=ASD3` in capitals showed "Module introuvable".** Fixed. Source: Q.
13. **Low. Bad values stayed in the address** (`type=xyz`, a year on another tab) and were carried by the language switch. Fixed: the address is tidied on arrival. Source: Q.
14. **Low. Every module had the same French description, and an unknown module could be indexed.** Fixed: a description per module in the page language; `noindex` on an unknown module. Source: Q.
15. **Low. Module rows on a computer.** The focus ring cut through the document count, and nothing kept a long name clear of the count. Fixed: a gap, and the ring is drawn inside the link. Source: T, D.
16. **Low. With a filter set, the exam list started about 85px lower.** Fixed: the count and the reset button share one line, which gives back about 30px. Source: D.
17. **Low. The list of a tab was an extra Tab stop with a ring around the whole list.** Fixed: only an empty list is a Tab stop. Source: D.
18. **Low. In search results the module name and the titles under it started 24px apart; "Chapitre 10" could break in two.** Fixed. Source: D.
19. **Low. Narrow screens and line breaks.** The search example was cut at 320px; "Jijel." could be left alone on the last line of the footer. Fixed. Source: D.
20. **Low. In Windows high-contrast mode the open tab and the current language lost their mark.** Fixed. Source: D.
21. **Low. A browser too old for the scripts showed a blank page.** Fixed: a short message in French and Arabic. Source: Q.
22. **Low. Robustness.** A label missing in one language could break the search page; Safari can refuse frequent address updates; an unknown address ending in `/404` lost its styles on a project site; the 404 page drew nothing if `js/lang.js` failed; a very long address made the report email too long; the screen-reader text of a tab used a Latin comma in Arabic; the count of exams was announced twice on opening the tab. Fixed. Source: Q.
23. **Low. The design system described four things differently from the stylesheet** (weights, year heading size, line heights, pressed state). Fixed in `docs/design-system.md`; the "Examens" shortcut also got its pressed state. Source: D.

## Remaining blockers

None for this phase. Before the site is announced: the open decisions in `docs/project-brief.md` (Arabic review, S4 modules, real PDFs, public URL) and the checks listed as not verified below.

## For the maintainer to decide

Nothing here was changed. The first two are points where a reviewer disagrees with a design decision already made.

- **Muted tabs (resolved after Phase 4).** An empty tab now keeps the normal edge; only its label and weight are muted.
- **Purple for opened titles.** In light mode the purple and the link blue are equally dark (7.8:1 and 7.9:1), so only the hue differs. A clearly lighter or darker purple would hold up better in sunlight and for colour-blind readers.
- **A jump to Semestre 4 on the phone home page.** S4 is two screens down. Once it has modules, two small links ("Semestre 3", "Semestre 4") under the introduction would save that scroll.
- **"Signaler une erreur" (resolved after Phase 4).** It now opens a Netlify report form, with the module and document filled in for a missing PDF. The maintainer address is absent from site source.
- **Language memory (resolved after Phase 4).** Only clicking the language switch saves the choice.
- **Link previews (partly resolved after Phase 4).** Static French Open Graph and Twitter defaults and an image are on every page. A distinct preview per module would still need one static HTML page per module.
- **Search by a bare number.** "2024" finds both academic years that contain it, and a number without its word ("asd3 3") still matches the 3 of "ASD3".
- **A module code longer than about seven characters** would misalign its row. None exists.

## For Phase 5 (deployment)

- **What gets published.** Netlify uses an allowlisted copy of five HTML files and the website's CSS, JavaScript, catalogue, images, and catalogue-linked PDFs. `docs/published-files.md` lists the exact current files. Repository documents, templates, instructions, and scripts are excluded.
- **Needs the public URL:** sitemap, canonical links, language alternates. A `robots.txt` inside `/university/` has no effect.
- **Faster first load on slow connections:** the scripts load in three steps before the catalogue is asked for. `<link rel="modulepreload">` lines in the three pages would make that one step.
- **Icon:** the favicon is SVG only, which Safari and iPhone home-screen bookmarks do not use. A PNG and an `apple-touch-icon` are needed.
- **After a release,** the configured browser cache is five minutes for CSS and JavaScript, one hour for PDFs, and revalidation on each visit for HTML and the catalogue. These header rules still need a live Netlify check.

## Checks not applicable or unavailable

- **A real phone:** touch, the pressed state, what a title or "Télécharger" does on a phone that downloads PDFs or in an in-app browser, the scroll position after Back, the look of the search field on iOS, Arabic fonts on Android and iOS.
- **A real screen reader:** how tab names, the facts list, the two status lines and Latin codes inside Arabic are read.
- **Safari and Firefox.** Only Chrome was used.
- **The mail app:** that "Signaler une erreur" opens with the prepared email.
- **Netlify itself:** that it sends the size of a PDF and a `Last-Modified` date, and what date that is. The footer date and the file sizes depend on them. Form detection, submissions, and notifications also need live verification.
- **Real browser zoom, Lighthouse, field performance data.**
- **Real documents.** All 53 PDFs are placeholders of about 1.5 kB.
- **`webapp-testing` with Python Playwright:** not installed on this computer. The Playwright browser tool of Claude Code was used instead.
