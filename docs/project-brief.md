# L2 study resources — project brief

## Confirmed scope

- Audience: Licence 2 (L2) Informatique students at **Université Mohammed Seddik Benyahia – Jijel**. The maintainer confirmed this name and styling on 2026-10-07.
- Goal: help students find, view, and download the right course, TD, TP, or exam quickly.
- Scope: L2 only. Show semesters S3 and S4, their confirmed modules, and resources grouped as Cours, TD, TP, and Examens, in that order. Keep `level` in the data model for future expansion; do not create other levels now.
- Language: French and Arabic, both complete: every interface label, module name, and resource title. French is the default. A visible language switch is on every page, and Arabic views use RTL layout. Claude drafts the Arabic text; see "Arabic text awaiting review".
- Hosting: GitHub Pages for the later static site. The local Git repository is connected to the GitHub remote `origin` (`https://github.com/ousssamaaslan-cell/university.git`), which implies a project path of `/university/`. GitHub Pages itself is not enabled or verified yet; deployment is a later phase.
- Stack: plain HTML, CSS, and JavaScript. No site framework, build step, or npm dependencies.
- Public access: students browse without accounts or login.
- Content files: `data/resources.json` and PDFs in `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`. See `docs/content-model.md`.
- Pages: `index.html` lists S3/S4 and modules; `module.html?id=<module-id>` lists one module's resources under Cours, TD, TP, and Examens tabs; `404.html` handles unknown addresses on the static host. One script injects the shared header and footer, and every page has a breadcrumb.
- Search: matches a module's full name and its abbreviation, and resource titles, in both languages.
- Filters: the Examens tab filters by academic year and session (normal or rattrapage). Cours, TD, and TP have no session filter.
- Shareable views: the module page keeps the open tab and the exam filters in its address (`type=`, `year=`, `session=`), so a link opens the same view.
- PDF behavior: provide a working view link and download link for each published resource. Missing PDFs must not appear as working links: the module page asks the server whether each listed PDF exists, without downloading it, and marks a missing one "Fichier indisponible".

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
- Every interface label, including the type labels, session and exam-kind names, breadcrumbs, and empty and error messages: the `ar` block of `js/i18n.js`.
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
- GitHub Pages has not been enabled, and no public URL is confirmed.
- No university logo, colours, or fonts were supplied, and no style reference site. The style stays neutral; `docs/design-system.md` records the values chosen.

**[ARABIC DRAFTS, S4 MODULES, REAL PDFS, AND PUBLIC URL — TO CONFIRM]**
