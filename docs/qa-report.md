# QA report — L2 study resources

Date / revision: 2026-10-08. The site as it is in the Phase 4 commit that contains this file (it follows `3826c85`). Every result below was obtained on that final code, after the fixes.
URL / environment (local or published): local only, `python -m http.server` on `http://127.0.0.1:8000/`. A GitHub Pages project site (`https://<user>.github.io/university/`) was emulated inside the test browser, with every request answered from the local files. Nothing is published yet.
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
| Titles, metadata, sitemap, and static-host paths | Passed, except sitemap: Blocked | Static HTML of the four pages: doctype, `lang`, `dir`, charset, viewport, title, description where indexable, `noindex` on search and 404, no address starting at the domain root, no external address. At runtime: title per page in the page language, a description per module, Arabic descriptions. Emulated project path: home, shortcut, PDF address, search, breadcrumb and five unknown addresses all stay under `/university/`. | Sitemap, canonical links and `robots.txt` need the public URL, which is not confirmed. They belong to Phase 5. |
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

- **Muted tabs.** The edge of a tab with no document is 1.42:1 against the page (1.55:1 in dark mode), below the 3:1 the design system gives for control borders. Its label is 6.4:1. The design reviewer suggests keeping the grey label and regular weight but the normal edge, so the tab still looks tappable.
- **Purple for opened titles.** In light mode the purple and the link blue are equally dark (7.8:1 and 7.9:1), so only the hue differs. A clearly lighter or darker purple would hold up better in sunlight and for colour-blind readers.
- **A jump to Semestre 4 on the phone home page.** S4 is two screens down. Once it has modules, two small links ("Semestre 3", "Semestre 4") under the introduction would save that scroll.
- **"Signaler une erreur" without a mail app.** The link does nothing on a computer with no mail app, and the address is not printed. The address is also readable in the page source, so address harvesters will find it; a dedicated address would avoid that.
- **Language memory.** Opening any link with `?lang=ar` makes Arabic the remembered language, not only a click on the switch.
- **Link previews.** WhatsApp, Messenger and Telegram do not run scripts, so every shared module link previews as "Module | Ressources L2 Informatique". Fixing that needs one static HTML page per module.
- **Search by a bare number.** "2024" finds both academic years that contain it, and a number without its word ("asd3 3") still matches the 3 of "ASD3".
- **A module code longer than about seven characters** would misalign its row. None exists.

## For Phase 5 (deployment)

- **What gets published.** With a plain branch deployment, GitHub Pages would also publish `docs/`, `templates/`, `README.md`, `AGENTS.md` and `scripts/`. Publish only the four HTML files and `css/`, `js/`, `data/`, `assets/`, `pdfs/`.
- **Needs the public URL:** sitemap, canonical links, language alternates. A `robots.txt` inside `/university/` has no effect.
- **Faster first load on slow connections:** the scripts load in three steps before the catalogue is asked for. `<link rel="modulepreload">` lines in the three pages would make that one step.
- **Icon:** the favicon is SVG only, which Safari and iPhone home-screen bookmarks do not use. A PNG and an `apple-touch-icon` are needed.
- **After a release,** pages, styles and scripts expire separately for up to about 10 minutes on GitHub Pages, so a reader can briefly run old and new files together. Content updates are not affected: the catalogue is checked on every visit.

## Checks not applicable or unavailable

- **A real phone:** touch, the pressed state, what a title or "Télécharger" does on a phone that downloads PDFs or in an in-app browser, the scroll position after Back, the look of the search field on iOS, Arabic fonts on Android and iOS.
- **A real screen reader:** how tab names, the facts list, the two status lines and Latin codes inside Arabic are read.
- **Safari and Firefox.** Only Chrome was used.
- **The mail app:** that "Signaler une erreur" opens with the prepared email.
- **GitHub Pages itself:** that it sends the size of a PDF and a `Last-Modified` date, and what date that is. The footer date and the file sizes depend on them.
- **Real browser zoom, Lighthouse, field performance data.**
- **Real documents.** All 53 PDFs are placeholders of about 1.5 kB.
- **`webapp-testing` with Python Playwright:** not installed on this computer. The Playwright browser tool of Claude Code was used instead.
