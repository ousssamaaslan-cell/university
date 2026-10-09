---
name: lp-plan
description: "Plan the small static L2 resource library from its academic brief and content model."
disable-model-invocation: true
---

# lp-plan

Read `docs/project-brief.md`, `docs/content-model.md`, `docs/design-system.md`, the repository, and $ARGUMENTS. Create or update `docs/implementation-plan.md` using `templates/implementation-plan.md`. Plan only plain HTML, CSS, and JavaScript with no build step or npm dependencies. Specify `index.html`, `module.html?id=<module-id>`, `data/resources.json`, semester/module navigation, search, filters, PDF view/download, responsive behavior, accessibility, localization when confirmed, and static hosting with relative paths. Identify confirmed module/PDF inputs and unresolved facts. Include content validation and browser QA. The maintainer's admin form in `admin/` already exists (Decap CMS with GitHub login, described in `docs/project-brief.md`); do not plan another dashboard, a backend, Google Drive integration, or extra levels unless the user explicitly changes scope.

Template-authored workflow; upstream source skills remain unchanged.
