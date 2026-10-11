# Netlify publish manifest

Snapshot of the allowlisted output on 2026-10-10, after the admin dashboard of Phase 7 was added and the site became French only (`js/lang.js` became `js/old-browser.js`; the number of files is unchanged). Run `node scripts/publish.cjs` to rebuild it. The Netlify publish directory is `.netlify-publish`.

These 40 files are the entire publish output. The one PDF is the document the maintainer added through the admin on 2026-10-09. No docs, templates, scripts, tests, project instructions, readme files, local paths, or maintainer email address are included.

The sixteen `admin/` files are the maintainer's dashboard (eleven files) and the former Decap form kept as a temporary backup in `admin/decap/` (five files). They hold no credential: the GitHub login goes through Netlify, which keeps the OAuth secret, and the repository name in `admin/admin.js` is public. A document added through the admin adds its PDF to this list at the next publication; this snapshot is not rewritten for each one.

- `404.html`
- `admin/admin-flow.js`
- `admin/admin.css`
- `admin/admin.js`
- `admin/catalogue-rules.js`
- `admin/decap/admin.js`
- `admin/decap/decap-cms.LICENSE.txt`
- `admin/decap/decap-cms.js`
- `admin/decap/decap-cms.js.LICENSE.txt`
- `admin/decap/index.html`
- `admin/documents.js`
- `admin/form.js`
- `admin/github-commit.js`
- `admin/index.html`
- `admin/local-preview.js`
- `admin/netlify-auth.js`
- `admin/ui.js`
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
- `js/layout.js`
- `js/module.js`
- `js/not-found.js`
- `js/old-browser.js`
- `js/report.js`
- `js/resource-list.js`
- `js/search.js`
- `js/tabs.js`
- `module.html`
- `pdfs/S3/poo1/poo1-tp-02-2026-2027.pdf`
- `report.html`
- `search.html`
