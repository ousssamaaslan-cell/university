# L2 study resource library — Claude Code instructions

This is an academic PDF resource library for Licence 2 students. It is **not** a marketing landing page. Read `docs/project-brief.md`, `docs/content-model.md`, and `docs/design-system.md` before planning or building. The field is Informatique, the university is Université Mohammed Seddik Benyahia – Jijel, the site is in French only, and the host is Netlify. The seven confirmed modules (ASD3, AO, SI, MN, POO1, PS1, GP) belong to S3; show S4 as an empty semester until its modules are provided. Keep unknown facts explicit; never invent modules, PDFs, branding, or university claims. One exception is recorded in `docs/project-brief.md`: the build-phase `sample-` data, which stays visibly marked and is removed before publication.

French only is a maintainer decision of 2026-10-10: the Arabic version was removed, and the Git tag `before-french-only` marks the last commit that had it. Every page is `lang="fr"`, and every label, module name, and document title is one plain string of French text. Do not add another language, a language switch, `?lang=` handling, or right-to-left styling unless the maintainer asks.

## Scope and stack

- Build L2 only: Semester S3 or S4 → Module → Cours, TD, TP, Examens, in that order. Show each module's abbreviation next to its name everywhere. Retain `level: "L2"` in records for future extension without adding routes for other levels.
- Use plain HTML, CSS, and browser JavaScript. No framework, compilation, npm dependency, server rendering, or student login. Netlify uses a small allowlisted copy step into its publish folder.
- The site uses `index.html`, `module.html?id=<module-id>`, `search.html?q=<words>`, `report.html`, `404.html`, `data/resources.json`, `css/`, `js/`, `assets/`, and PDFs under `pdfs/S3/<module-id>/` or `pdfs/S4/<module-id>/`. `admin/` holds the maintainer's dashboard.
- Student pages must work on Netlify static hosting. Use relative page and PDF URLs and stable module IDs; Netlify serves this project at its site root.
- One maintainer keeps the catalogue by two routes, both ending in a commit on `main` that Netlify rebuilds: the admin dashboard at `/admin`, and editing the catalogue and PDFs in the repository with `/add-resource`. Run `git pull` before a repository edit, because an admin save is a commit too.
- The admin dashboard (maintainer decision, 2026-10-10, Phase 7) is a static page in plain HTML, CSS, and JavaScript, with a French interface. It logs in with GitHub through Netlify's OAuth provider (`admin/netlify-auth.js`) and keeps the token in sessionStorage only. `admin/catalogue-rules.js` applies `docs/content-model.md` to each change; `admin/admin-flow.js` and `admin/github-commit.js` write it as one commit, catalogue and PDFs together, never forced. It writes only `data/resources.json` and `pdfs/<semester>/<module-id>/<id>.pdf`. Keep it to documents only; modules and semesters stay in the repository route. Do not add Netlify Identity, Git Gateway, another backend, an API, a database, or Google Drive, do not load a script from another site, do not link to `/admin` from student pages, and never put an OAuth secret or token in the repository. After changing `admin/` or the doctor, run `node scripts/test-admin.cjs`.
- The former Decap CMS form (Phase 6) is kept at `/admin/decap` as a temporary backup, with its bundle `admin/decap/decap-cms.js` vendored byte for byte. It saves through the same rules. Remove it only when the maintainer asks.

## Workflows

Use `/lp-plan`, `/lp-build`, `/lp-check`, `/lp-review`, `/lp-polish`, `/lp-performance`, `/lp-seo`, `/lp-handoff`, and `/lp-release` only when relevant to the resource library. The historical `lp-` names are retained as command names, but their active instructions are project-specific. `/lp-brief` updates project facts; `/add-resource` adds catalogue entries and PDFs. Keep the unconfirmed fields visible in the brief until the user supplies or reviews them.

Use `design-reviewer` and `quality-reviewer` for relevant reviews. Marketing and conversion files are archived in `.claude/_unused/`; do not invoke or load them for this project. Other vendored quality skills remain available. Some vendored reference examples use other frameworks or platforms; follow this project's stack and paths instead.

## Content and verification

- Follow `docs/content-model.md` and `.claude/rules/content-structure.md` for IDs, relationships, ordering, and file paths. Validate that every published PDF path exists and that no removed PDF remains linked.
- Use clear academic labels and navigation. Search and filters must remain keyboard-usable. Distinguish missing results from a loading or file error.
- Test browsing S3/S4, each module, search, filters, PDF viewing and downloading, mobile layout, and keyboard navigation. Record results in `docs/qa-report.md` using `templates/qa-report.md`; mark unavailable checks as blocked.
- Start a local static HTTP server for browser checks; do not rely on opening pages with `file://` because browser fetch rules may differ.
- State build, deployment, browser, and PDF results only when actually verified. The admin dashboard's GitHub login and saves on the published site count as verified only once done there; a local preview of `/admin` works on a copy in the browser tab and proves nothing about GitHub.

## Configuration

`SessionStart` checks project documents. `PostToolUse` formats supported site files only if local Prettier is already installed; it does not download packages. Optional hooks in `.claude/settings.optional.json` are inactive. Hook scripts are invoked with Node and must remain cross-platform. Keep archived and unmodified vendored skill content intact except for the documented frontmatter and script-path corrections; `vendor-manifest.json` records copied files and hashes.
