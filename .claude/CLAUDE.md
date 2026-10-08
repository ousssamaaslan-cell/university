# L2 study resource library — Claude Code instructions

This is an academic PDF resource library for Licence 2 students. It is **not** a marketing landing page. Read `docs/project-brief.md`, `docs/content-model.md`, and `docs/design-system.md` before planning or building. The field is Informatique, the university is Université Mohammed Seddik Benyahia – Jijel, the languages are French (default) and Arabic, and the future host is GitHub Pages. The seven confirmed modules (ASD3, AO, SI, MN, POO1, PS1, GP) belong to S3; show S4 as an empty semester until its modules are provided. Keep unknown facts explicit; never invent modules, PDFs, branding, or university claims. Two exceptions are recorded in `docs/project-brief.md`: Claude drafts the Arabic text, which stays listed there as awaiting the maintainer's review, and the build-phase `sample-` data, which stays visibly marked and is removed before publication.

## Scope and stack

- Build L2 only: Semester S3 or S4 → Module → Cours, TD, TP, Examens, in that order. Show each module's abbreviation next to its name everywhere. Retain `level: "L2"` in records for future extension without adding routes for other levels.
- Use plain HTML, CSS, and browser JavaScript. No framework, site build step, npm dependency, server rendering, or student login.
- The site uses `index.html`, `module.html?id=<module-id>`, `search.html?q=<words>`, `404.html`, `data/resources.json`, `css/`, `js/`, `assets/`, and PDFs under `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`.
- Student pages must work on static hosting, including a GitHub Pages project subpath. Use relative URLs, stable module IDs, and no assumed domain root.
- One maintainer edits the catalogue and PDFs and republishes. Use `/add-resource` for the exact content workflow. No admin dashboard, API, database, Google Drive, or in-browser upload is part of this static setup. Treat those as a separate architecture decision if later requested.

## Workflows

Use `/lp-plan`, `/lp-build`, `/lp-check`, `/lp-review`, `/lp-polish`, `/lp-performance`, `/lp-seo`, `/lp-handoff`, and `/lp-release` only when relevant to the resource library. The historical `lp-` names are retained as command names, but their active instructions are project-specific. `/lp-brief` updates project facts; `/add-resource` adds catalogue entries and PDFs. Keep the unconfirmed fields visible in the brief until the user supplies or reviews them.

Use `design-reviewer` and `quality-reviewer` for relevant reviews. Marketing and conversion files are archived in `.claude/_unused/`; do not invoke or load them for this project. Other vendored quality skills remain available. Some vendored reference examples use other frameworks or platforms; follow this project's stack and paths instead.

## Content and verification

- Follow `docs/content-model.md` and `.claude/rules/content-structure.md` for IDs, relationships, ordering, and file paths. Validate that every published PDF path exists and that no removed PDF remains linked.
- Use clear academic labels and navigation. Search and filters must remain keyboard-usable. Distinguish missing results from a loading or file error.
- Test browsing S3/S4, each module, search, filters, PDF viewing and downloading, mobile layout, keyboard navigation, and language direction where applicable. Record results in `docs/qa-report.md` using `templates/qa-report.md`; mark unavailable checks as blocked.
- Start a local static HTTP server for browser checks; do not rely on opening pages with `file://` because browser fetch rules may differ.
- State build, deployment, browser, and PDF results only when actually verified. Do not claim an admin dashboard or live backend exists.

## Configuration

`SessionStart` checks project documents. `PostToolUse` formats supported site files only if local Prettier is already installed; it does not download packages. Optional hooks in `.claude/settings.optional.json` are inactive. Hook scripts are invoked with Node and must remain cross-platform. Keep archived and unmodified vendored skill content intact except for the documented frontmatter and script-path corrections; `vendor-manifest.json` records copied files and hashes.
