# Verification

There is no site compilation, lint, or type-check command by default. Netlify runs an allowlisted publish copy after the doctor. Run `node scripts/doctor.cjs`, validate catalogue JSON and every PDF path when content exists, then inspect the site through a local HTTP server. Test S3/S4 browsing, module IDs, search, filters, PDF view/download, mobile/desktop, keyboard navigation, language direction, console errors, and failed requests. Record passed, failed, blocked, and not-applicable checks in `docs/qa-report.md`. Do not infer runtime success from code inspection.

After a change in `admin/` or `scripts/doctor.cjs`, run `node scripts/test-admin.cjs`, then try the dashboard through a local HTTP server, at phone and desktop widths: on `localhost` it works on a copy kept in the browser tab and sends nothing to GitHub. The GitHub login and a save on the published site can only be verified there, by the maintainer; record them as blocked until then.
