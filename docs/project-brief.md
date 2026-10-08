# L2 study resources — project brief

## Confirmed scope

- Audience: Licence 2 (L2) Informatique students at **Mohammed seddik benyahia** (name supplied by the user; confirm official styling before publication).
- Goal: help students find, view, and download the right exam, tutorial, or exercise quickly.
- Scope: L2 only. Show semesters S3 and S4, their confirmed modules, and resources grouped as Exams, Tutorials, and Exercises. Keep `level` in the data model for future expansion; do not create other levels now.
- Language: French and Arabic. Arabic views need RTL layout. Exact Arabic translations and the university's preferred Arabic name remain to be supplied; do not invent them.
- Hosting: GitHub Pages for the later static site. The local Git repository is connected to the GitHub remote `origin` (`https://github.com/ousssamaaslan-cell/university.git`), which implies a project path of `/university/`. GitHub Pages itself is not enabled or verified yet; deployment is a later phase.
- Stack: plain HTML, CSS, and JavaScript. No site framework, build step, or npm dependencies.
- Public access: students browse without accounts or login.
- Content files: `data/resources.json` and PDFs in `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`. See `docs/content-model.md`.
- Planned pages for the later build: `index.html` lists S3/S4 and modules; `module.html?id=<module-id>` lists one module's resources under Exams, Tutorials, and Exercises tabs; `404.html` handles unknown addresses on the static host. One script injects the shared header and footer, and every page has a breadcrumb. These pages do not exist during setup.
- Search and filters: students should be able to find resources by title/module and filter by semester, academic year, type, and exam session (normal or rattrapage). Treat search/filter behavior as a later implementation task.
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

## Development sample data (build phase only)

Maintainer decision, 2026-10-07: real PDFs are added only after the site is finished. Until then the catalogue holds sample resources that point to generated placeholder PDFs, so lists, filters, search, and PDF viewing can be built and tested. Do not search for or download real documents.

- Every sample resource `id` and PDF filename starts with `sample-`, and each placeholder PDF states on its page that it is a placeholder.
- Sample records cover long and short titles, one module with many resources, one module with none, exams with and without solutions, both sessions, and several academic years.
- While any `sample-` record exists, the site shows a visible sample-data notice and `node scripts/doctor.cjs` reports the sample count.
- Sample data is never real university content. Remove every `sample-` record and placeholder PDF before the site is announced to students.

## Success criteria for the later build

- A student can reach a module from its semester, distinguish the three resource types, find a resource, and open or download its PDF on mobile and desktop.
- Every published resource maps to an existing PDF with correct semester and module metadata.
- The maintainer can add a module or resource using a documented, repeatable content workflow.
- Navigation, search, filters, and file links remain usable by keyboard and assistive technology.

## Open decisions

Confirm official module spellings, initial PDFs, approved university name styling, and Arabic translations before publishing real page content. S4 has no declared modules yet. GitHub Pages is the selected host and the GitHub repository exists, but Pages has not been enabled and no public URL is confirmed.

Also open: the stable module IDs (they become public `module.html?id=` links and PDF folder names), the French and Arabic labels for the three resource types, who supplies the Arabic interface text, and the concrete colour, type, and spacing values that `docs/design-system.md` describes only as principles. No style reference site was supplied, so the style stays neutral.

**[OFFICIAL SPELLINGS, ARABIC TITLES, INITIAL PDFS, AND UNIVERSITY STYLING — TO CONFIRM]**
