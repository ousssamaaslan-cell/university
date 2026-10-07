# L2 study resources — setup

This separate `university` project is prepared for Claude Code to build a public resource library for Licence 2 Informatique students at Mohammed seddik benyahia. **No site pages, JavaScript, CSS, catalogue entries, or PDFs have been built yet.** The original `landing-page-template` folder is untouched.

## Confirmed plan

- Public student site, no student login: S3/S4 → module → Exams, Tutorials, Exercises.
- French and Arabic with RTL for Arabic. Exact translations and official name styling need confirmation before publication.
- Plain HTML, CSS, and browser JavaScript, with no framework, site build step, or npm dependencies.
- Planned files: `index.html`, `module.html?id=<module-id>`, and `data/resources.json`; PDFs under `pdfs/<semester>/<module-id>/`.
- One maintainer adds or removes catalogue entries and local PDFs, then republishes the static site. `/add-resource` documents the steps. There is no admin dashboard, backend, or Google Drive integration in this setup.
- GitHub Pages is the selected future host. This setup creates a local Git repository only; publishing will require a GitHub remote repository later. Use relative paths so the site works at a project subpath.

Seven S3 module names have been supplied; S4 has no declared modules yet. Official spellings, Arabic translations, and the initial PDFs are still needed. See `docs/project-brief.md`, `docs/content-model.md`, and `docs/design-system.md` before building.

## Claude Code workflow

Open Claude Code in this folder. It reads `.claude/CLAUDE.md`, active rules, agents, hooks, and skills. Marketing and conversion material from the source template is preserved under `.claude/_unused/`, outside the active skill/rule locations. Historical command names retain `lp-` for compatibility, but their instructions now describe the resource library.

1. Confirm the open facts in `docs/project-brief.md` and the real module/PDF inventory.
2. Use `/lp-plan` to prepare an implementation plan; use `/lp-build` only when authorized to build the site.
3. Use `/add-resource` for catalogue and PDF maintenance once `data/resources.json` exists.
4. Use `/lp-check` and the QA template for browser and content validation.

For Codex, `AGENTS.md` points to the same source of truth.

## Checks and later preview

`node scripts/doctor.cjs` validates the setup now and will also validate catalogue records and PDF paths when `data/resources.json` is added. It installs nothing. There is no `npm install`, `npm run build`, lint, or type-check command for the site.

After pages exist, preview them through a local HTTP server, for example `python -m http.server 8000` from this project root, then open `http://localhost:8000/`. Do not rely on `file://` for pages that fetch JSON. Browser automation is optional and requires Python Playwright; `.claude/skills/webapp-testing/scripts/with_server.py --help` describes its helper.

`vendor-manifest.json` records the origin and current hashes of copied external skill files. `NOTICE.md` records attribution. The optional hooks in `.claude/settings.optional.json` are not active.
