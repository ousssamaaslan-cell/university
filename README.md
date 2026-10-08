# L2 study resources

A public resource library for Licence 2 Informatique students at Université Mohammed Seddik Benyahia – Jijel. Students pick a semester and a module, then view or download its Cours, TD, TP, and Examens as PDFs.

**The site is under construction.** Built so far: the home page with both semesters, module pages with Cours, TD, TP, and Examens tabs, the year and session filters on Examens, empty and missing-file states, and the 404 page. Not built yet: search, and the View and Download actions for PDFs. The catalogue holds sample records and placeholder PDFs only; see "Sample data" below.

## What is confirmed

- Public student site, no login: S3/S4 → module → Cours, TD, TP, Examens.
- Seven S3 modules: ASD3, AO, SI, MN, POO1, PS1, GP. S4 is shown empty until its modules are supplied.
- French by default and Arabic with RTL, with a language switch on every page. The Arabic text is a draft awaiting the maintainer's review.
- Plain HTML, CSS, and browser JavaScript, with no framework, site build step, or npm dependencies.
- Files: `index.html`, `module.html?id=<module-id>`, `404.html`, and `data/resources.json`; PDFs under `pdfs/<semester>/<module-id>/`.
- One maintainer adds or removes catalogue entries and local PDFs, then republishes the static site. There is no admin dashboard, backend, or Google Drive integration.
- GitHub Pages is the selected future host. The repository is connected to the GitHub remote `origin`; Pages is not enabled yet. The site uses relative paths so it works at a project subpath.

See `docs/project-brief.md`, `docs/content-model.md`, and `docs/design-system.md` for the full decisions.

## Preview the site locally

From this folder:

```
python -m http.server 8000
```

Then open `http://localhost:8000/`. Do not open the HTML files directly with `file://`; the pages fetch the catalogue and the browser blocks that.

## Sample data

Until the real PDFs are added, every resource in `data/resources.json` has an `id` starting with `sample-` and points to a generated placeholder PDF. The site shows a notice while any sample record exists.

- `node scripts/make-sample-pdfs.cjs` regenerates the placeholder PDFs from the catalogue.
- Remove every `sample-` record and placeholder PDF before the site is announced to students.

## Checks

`node scripts/doctor.cjs` validates the setup, the catalogue records, the fields each resource type needs, and that every PDF path exists. It reports how many sample records remain. It installs nothing. There is no `npm install`, `npm run build`, lint, or type-check command for the site.

## Claude Code workflow

Open Claude Code in this folder. It reads `.claude/CLAUDE.md`, active rules, agents, hooks, and skills. Marketing and conversion material from the source template is preserved under `.claude/_unused/`, outside the active skill/rule locations. Historical command names retain `lp-` for compatibility, but their instructions describe the resource library.

- `/add-resource` adds or removes a module or a PDF in the catalogue.
- `/lp-check` and `templates/qa-report.md` cover browser and content validation.

For Codex, `AGENTS.md` points to the same source of truth.

`vendor-manifest.json` records the origin and current hashes of copied external skill files. `NOTICE.md` records attribution. The optional hooks in `.claude/settings.optional.json` are not active.
