# Netlify publish manifest

Snapshot of the allowlisted output on 2026-10-10, after the sample data was removed. Run `node scripts/publish.cjs` to rebuild it. The Netlify publish directory is `.netlify-publish`.

These 31 files are the entire publish output. The one PDF is the document the maintainer added through the admin form on 2026-10-09; the 53 sample placeholder PDFs are gone. No docs, templates, scripts, tests, project instructions, readme files, local paths, or maintainer email address are included.

The seven `admin/` files are the maintainer's form. They hold no credential: the GitHub login goes through Netlify, which keeps the OAuth secret, and the repository name in `admin/admin.js` is public. A document added through the form adds its PDF to this list at the next publication; this snapshot is not rewritten for each one.

- `404.html`
- `admin/admin.js`
- `admin/catalogue-rules.js`
- `admin/decap-cms.LICENSE.txt`
- `admin/decap-cms.js`
- `admin/decap-cms.js.LICENSE.txt`
- `admin/github-commit.js`
- `admin/index.html`
- `assets/favicon.svg`
- `assets/social-preview.png`
- `css/styles.css`
- `data/resources.json`
- `index.html`
- `js/catalogue.js`
- `js/components.js`
- `js/dom.js`
- `js/files.js`
- `js/home.js`
- `js/i18n.js`
- `js/lang.js`
- `js/layout.js`
- `js/module.js`
- `js/not-found.js`
- `js/report.js`
- `js/resource-list.js`
- `js/search.js`
- `js/tabs.js`
- `module.html`
- `pdfs/S3/poo1/poo1-tp-02-2026-2027.pdf`
- `report.html`
- `search.html`
