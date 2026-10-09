# L2 study resources — project brief

## Confirmed scope

- Audience: Licence 2 (L2) Informatique students at **Université Mohammed Seddik Benyahia – Jijel**. The maintainer confirmed this name and styling on 2026-10-07.
- Status: the site is run by students and is not an official university site (maintainer decision, 2026-10-07). The footer says so. It must not claim to speak for the university or the department.
- Contact: a student reports a wrong or missing file with "Signaler une erreur", in the footer of every page and beside "Fichier indisponible". It opens a French or Arabic Netlify form with module, document, problem description, and optional reply email. A missing-file link fills in the module and document. The form has a spam honeypot; the maintainer's address is configured only in Netlify notifications, not in the site source.
- Last update: the footer shows the date on which the server says the catalogue last changed. It is not typed by hand and is left out when the server gives no date.
- Goal: help students find, view, and download the right course, TD, TP, or exam quickly.
- Scope: L2 only. Show semesters S3 and S4, their confirmed modules, and resources grouped as Cours, TD, TP, and Examens, in that order. Keep `level` in the data model for future expansion; do not create other levels now.
- Language: French and Arabic, both complete: every interface label, module name, and resource title. French is the default. A visible language switch is on every page, and Arabic views use RTL layout. Claude drafts the Arabic text; see "Arabic text awaiting review".
- Hosting: Netlify, connected to the GitHub repository `ousssamaaslan-cell/university`. `netlify.toml` runs the doctor and copies allowlisted website files into `.netlify-publish`; that folder alone is deployed. The Netlify project and public URL are not connected or verified yet.
- Stack: plain HTML, CSS, and JavaScript. No site framework, compilation, or npm dependencies; the Netlify copy step only prepares the publish folder.
- Public access: students browse without accounts or login.
- Content files: `data/resources.json` and PDFs in `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`. See `docs/content-model.md`.
- Pages: `index.html` lists S3/S4 and modules; `module.html?id=<module-id>` lists one module's resources under Cours, TD, TP, and Examens tabs; `search.html?q=<words>` shows search results; `report.html` holds the report form; `404.html` handles unknown addresses on the static host. One script injects the shared header and footer. Every page below the home page has a breadcrumb that leads back up to the home page and the semester when known. The home page and each module page set their own title and description in the page language; the results page, report page, the 404 page, and an unknown module are marked `noindex`.
- Search: a field in the header of every page opens `search.html?q=<words>`. It matches a module's full name and its abbreviation, and a document's type, number, title, year, and session, in both languages whatever the page language. Every word typed must match; accents and Arabic letter variants are ignored. A sheet or chapter number typed after its word ("td 3", "chapitre 2") must be the document's own number. Matching modules are listed first, then documents grouped by module.
- Filters: the Examens tab filters by academic year and session (normal or rattrapage). Cours, TD, and TP have no session filter.
- Shareable views: the module page keeps the open tab and the exam filters in its address (`type=`, `year=`, `session=`), so a link opens the same view.
- PDF behavior: in each document row the title is a link that opens the PDF in the browser's own viewer, and a "Télécharger" button saves it (maintainer decision after the design critique, 2026-10-07; there is no separate "Voir" button). Both are plain links to the same file, so nothing is loaded before a click. Missing PDFs must not appear as working links: the page asks the server whether each listed PDF exists, without downloading it, shows the file size when it does, and when it does not, shows the title as plain text with "Fichier indisponible" in place of the button.

## Content administration

One maintainer adds, changes, or removes content by updating the JSON catalogue and PDFs, then publishes the static site. The `/add-resource` skill documents this workflow. There is no admin dashboard, login backend, Google Drive integration, or automatic upload in this setup. If live in-browser administration is chosen later, it requires separate architecture and authorization.

## Semester modules

All seven modules belong to S3. The French names and abbreviations come from the official timetable, as supplied by the maintainer on 2026-10-07. The module ID is the lowercase abbreviation, so students recognise the URL.

| Order | Abbreviation | ID | French name | Arabic name (draft) |
| --- | --- | --- | --- | --- |
| 1 | ASD3 | `asd3` | Algorithmique et Structures de Données 3 | الخوارزميات وهياكل المعطيات 3 |
| 2 | AO | `ao` | Architecture des Ordinateurs | بنية الحواسيب |
| 3 | SI | `si` | Systèmes d'Information | أنظمة المعلومات |
| 4 | MN | `mn` | Méthodes Numériques | الطرق العددية |
| 5 | POO1 | `poo1` | Programmation Orientée Objet 1 | البرمجة كائنية التوجه 1 |
| 6 | PS1 | `ps1` | Probabilités et Statistique 1 | الاحتمالات والإحصاء 1 |
| 7 | GP | `gp` | Gestion de Projets | تسيير المشاريع |

Show the abbreviation next to the name everywhere: module lists, breadcrumbs, page titles, and search results. Abbreviations stay in Latin letters in the Arabic view.

S4 has no modules yet. Show it on the home page with an empty state ("Bientôt disponible" and its Arabic equivalent). The maintainer will supply its modules later; do not invent them.

## Resource types

Exactly four types, in this order on every module page. Each is its own tab.

| Type | Holds | Fields shown | Order | Filters |
| --- | --- | --- | --- | --- |
| Cours | Course notes and lecture slides, usually by chapter | Chapter number, title | By chapter | None |
| TD | Travaux dirigés sheets | Sheet number, title, correction available or not | By number | None |
| TP | Lab work sheets | Sheet number, title, correction or code available or not | By number | None |
| Examens | Past exams | Academic year, session, exam kind (EMD, examen final, rattrapage, contrôle), correction available or not | Newest first | Academic year, session |

The French labels are exactly "Cours", "TD", "TP", and "Examens". Do not use "Travaux dirigés (TD)" or "Exercices" as labels. `docs/content-model.md` defines the fields.

## Arabic text awaiting review

Maintainer decision, 2026-10-07: Claude drafts all Arabic text, and the maintainer reviews it before the site is announced. Nothing below is confirmed yet.

- University name: جامعة محمد الصديق بن يحيى – جيجل
- Module names: the "Arabic name (draft)" column above, stored in `data/resources.json`.
- Semester labels: السداسي الثالث and السداسي الرابع, stored in `data/resources.json`.
- Every interface label, including the type labels, session and exam-kind names, breadcrumbs, empty and error messages, the footer, the report form, and the page descriptions: the `ar` block of `js/i18n.js`.
- The two short Arabic messages written in each of the four HTML files, for a visitor without JavaScript and for a browser too old to run the site.
- Sample resource titles: drafted only so RTL and mixed-direction text can be tested. They are deleted with the sample data.

When the maintainer has reviewed a group, remove it from this list.

## Development sample data (build phase only)

Maintainer decision, 2026-10-07: real PDFs are added only after the site is finished. Until then the catalogue holds sample resources that point to generated placeholder PDFs, so lists, filters, search, and PDF viewing can be built and tested. Do not search for or download real documents.

- Every sample resource `id` and PDF filename starts with `sample-`, and each placeholder PDF states on its page that it is a placeholder. `node scripts/make-sample-pdfs.cjs` regenerates the placeholder PDFs from the catalogue.
- Sample records cover all four types, long and short titles, several academic years, both sessions, and resources with and without a correction.
- The modules are deliberately uneven so empty and partial states can be tested: ASD3 has many resources of every type; MN has Cours, TD, and TP but no Examens; PS1 has Examens but no Cours; AO and SI have no TP; POO1 has no TD; GP has nothing at all.
- While any `sample-` record exists, the site shows a visible sample-data notice, marks each sample resource, and `node scripts/doctor.cjs` reports the sample count.
- Sample data is never real university content. Remove every `sample-` record and placeholder PDF before the site is announced to students.

## Success criteria

- A student can reach a module from its semester, distinguish the four resource types, find a resource, and open or download its PDF on mobile and desktop.
- A student can find a module by typing either its abbreviation or part of its full name.
- Every published resource maps to an existing PDF with correct semester and module metadata.
- The maintainer can add a module or resource using a documented, repeatable content workflow.
- Navigation, search, filters, and file links remain usable by keyboard and assistive technology, in French and in Arabic.

## Open decisions

- The Arabic text listed above needs the maintainer's review.
- S4 modules have not been supplied.
- Real PDFs replace the sample data after the site is finished.
- The Netlify project has not been connected, and no public URL is confirmed.
- No university logo, colours, or fonts were supplied, and no style reference site. The style stays neutral; `docs/design-system.md` records the values chosen.

**[ARABIC DRAFTS, S4 MODULES, REAL PDFS, AND PUBLIC URL — TO CONFIRM]**
