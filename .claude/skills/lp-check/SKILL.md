---
name: lp-check
description: "Validate the L2 resource library's navigation, catalogue, PDFs, and accessibility."
disable-model-invocation: true
---

# lp-check

Read the project documents and inspect available commands; this site has no npm build, lint, or type-check by default. Run `node scripts/doctor.cjs` and validate `data/resources.json` when present. Serve the site through a local HTTP server and use `webapp-testing` with `.claude/skills/webapp-testing/scripts/with_server.py --help` if Python Playwright is available; otherwise record browser automation as blocked. Use the relevant `web-quality-audit` references. Verify S3/S4 browsing, module links, search by module name and abbreviation, the Cours/TD/TP/Examens tabs, the year and session filters on Examens, empty results, missing/unknown module IDs, the 404 page, PDF view and download, a sample add-resource workflow, mobile/tablet/desktop layout, keyboard/focus/zoom, language direction where applicable, console errors, and failed requests. Create or update `docs/qa-report.md` from `templates/qa-report.md` with evidence. Mark unavailable checks as blocked, never passed. $ARGUMENTS

Template-authored workflow; upstream source skills remain unchanged.
