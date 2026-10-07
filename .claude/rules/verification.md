# Verification

There is no site build, lint, or type-check command by default. Run `node scripts/doctor.cjs`, validate catalogue JSON and every PDF path when content exists, then inspect the site through a local HTTP server. Test S3/S4 browsing, module IDs, search, filters, PDF view/download, mobile/desktop, keyboard navigation, language direction, console errors, and failed requests. Record passed, failed, blocked, and not-applicable checks in `docs/qa-report.md`. Do not infer runtime success from code inspection.
