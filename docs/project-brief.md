# L2 study resources — project brief

## Confirmed scope

- Audience: Licence 2 (L2) Informatique students at **Mohammed seddik benyahia** (name supplied by the user; confirm official styling before publication).
- Goal: help students find, view, and download the right exam, tutorial, or exercise quickly.
- Scope: L2 only. Show semesters S3 and S4, their confirmed modules, and resources grouped as Exams, Tutorials, and Exercises. Keep `level` in the data model for future expansion; do not create other levels now.
- Language: French and Arabic. Arabic views need RTL layout. Exact Arabic translations and the university's preferred Arabic name remain to be supplied; do not invent them.
- Hosting: GitHub Pages for the later static site. This setup creates only a local Git repository; a GitHub account name, remote repository, and deployment are not needed yet.
- Stack: plain HTML, CSS, and JavaScript. No site framework, build step, or npm dependencies.
- Public access: students browse without accounts or login.
- Content files: `data/resources.json` and PDFs in `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`. See `docs/content-model.md`.
- Planned pages for the later build: `index.html` lists S3/S4 and modules; `module.html?id=<module-id>` lists one module's resources. These pages do not exist during setup.
- Search and filters: students should be able to find resources by title/module and filter by semester, academic year, and type. Treat search/filter behavior as a later implementation task.
- PDF behavior: provide a working view link and download link for each published resource. Missing PDFs must not appear as working links.

## Content administration

One maintainer adds, changes, or removes content by updating the JSON catalogue and PDFs, then publishes the static site. The `/add-resource` skill documents this workflow. There is no admin dashboard, login backend, Google Drive integration, or automatic upload in this setup. If live in-browser administration is chosen later, it requires separate architecture and authorization.

## Semester modules

- S3 (names supplied by the user; official spellings still to confirm):
  - algorithmes &&starructures des donnes 3
  - systemes informatiques
  - gestion des projets
  - methodes numeriques
  - programmation oriente objet
  - probabilte et statistique
  - arhitecture des ordinateurs
- S4: show the semester section, with no modules declared yet. Do not invent or publish S4 module names.

Preserve the S3 names as supplied for now; confirm their official French spellings and Arabic translations before publishing them. Do not publish example modules from `docs/content-model.md` as real university modules.

## Success criteria for the later build

- A student can reach a module from its semester, distinguish the three resource types, find a resource, and open or download its PDF on mobile and desktop.
- Every published resource maps to an existing PDF with correct semester and module metadata.
- The maintainer can add a module or resource using a documented, repeatable content workflow.
- Navigation, search, filters, and file links remain usable by keyboard and assistive technology.

## Open decisions

Confirm official module spellings, initial PDFs, approved university name styling, and Arabic translations before publishing real page content. S4 has no declared modules yet. GitHub Pages is the selected host, but no online repository has been created.

**[OFFICIAL SPELLINGS, ARABIC TITLES, INITIAL PDFS, AND UNIVERSITY STYLING — TO CONFIRM]**
