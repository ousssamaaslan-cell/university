---
name: lp-build
description: "Build the public static L2 resource library from confirmed content and its plan."
disable-model-invocation: true
---

# lp-build

Read `docs/project-brief.md`, `docs/content-model.md`, `docs/design-system.md`, the implementation plan, existing code, and $ARGUMENTS. Build only the confirmed public L2 scope with plain HTML, CSS, and JavaScript. Render `data/resources.json` into `index.html` and `module.html?id=<module-id>`; keep S3/S4, module IDs and abbreviations, the four resource types (Cours, TD, TP, Examens), search, filters, PDF view/download, empty/error states, and accessible navigation consistent with the model. Use relative page and PDF URLs on Netlify. Do not invent modules or PDF links. Do not add a framework, compilation, npm dependencies, login, admin dashboard, backend, or other levels. Run available checks and inspect the site through a local HTTP server. Keep unmodified vendored files unchanged.

Template-authored workflow; upstream source skills remain unchanged.
