# L2 study resources

A public resource library for Licence 2 Informatique students at Université Mohammed Seddik Benyahia – Jijel. Students pick a semester and a module, then view or download its Cours, TD, TP, and Examens as PDFs.

**The site is under construction.** Built so far: the home page with both semesters, module pages with Cours, TD, TP, and Examens tabs, the year and session filters on Examens, search across modules and documents, a title that opens each PDF and a "Télécharger" button that saves it, empty and missing-file states, the report form, and the 404 page. The quality pass is done; `docs/qa-report.md` records what was tested, found, and fixed. Netlify configuration is ready, but the Netlify project has not yet been connected. The catalogue holds sample records and placeholder PDFs only; see "Sample data" below.

## What is confirmed

- Public student site, no login: S3/S4 → module → Cours, TD, TP, Examens.
- Seven S3 modules: ASD3, AO, SI, MN, POO1, PS1, GP. S4 is shown empty until its modules are supplied.
- French by default and Arabic with RTL, with a language switch on every page. The Arabic text is a draft awaiting the maintainer's review.
- Plain HTML, CSS, and browser JavaScript, with no framework, compilation, or npm dependencies. Netlify uses a Node copy step to make its publish folder.
- Files: `index.html`, `module.html?id=<module-id>`, `search.html?q=<words>`, `report.html`, `404.html`, and `data/resources.json`; PDFs under `pdfs/<semester>/<module-id>/`.
- One maintainer adds or removes catalogue entries and local PDFs, then republishes the static site. There is no admin dashboard, backend, or Google Drive integration.
- The site is run by students and is not an official university site; the footer says so. "Signaler une erreur" opens a French or Arabic Netlify form. The maintainer's email address is configured in Netlify notifications, outside the website source. The footer's date of the last update comes from the server, so nobody types it.
- Netlify is the selected host. The repository is connected to the GitHub remote `origin`; the Netlify project is not connected yet. The site uses relative page and PDF links.

See `docs/project-brief.md`, `docs/content-model.md`, and `docs/design-system.md` for the full decisions.

## Preview the site locally

From this folder:

```
python -m http.server 8000
```

Then open `http://localhost:8000/`. Do not open the HTML files directly with `file://`; the pages fetch the catalogue and the browser blocks that.

The report form submits only after Netlify form detection is enabled on a deployed site. A local static server cannot receive its POST request.

To open the site on a phone that is on the same network as the computer, start the server on every network interface instead:

```
python -m http.server 8000 --bind 0.0.0.0
```

Then open `http://<the computer's IP address>:8000/` on the phone (`ipconfig` shows the address under "IPv4"). Windows Firewall must allow incoming connections on TCP port 8000. The server shows the whole project folder to that network, so stop it when the check is done.

## Sample data

Until the real PDFs are added, every resource in `data/resources.json` has an `id` starting with `sample-` and points to a generated placeholder PDF. The site shows a notice while any sample record exists.

- `node scripts/make-sample-pdfs.cjs` regenerates the placeholder PDFs from the catalogue.
- Remove every `sample-` record and placeholder PDF before the site is announced to students.

## How to add a new exam in 3 steps

1. Put the verified PDF at `pdfs/<semester>/<module-id>/<resource-id>.pdf`. Use the confirmed S3 or S4 module ID, and a stable lowercase resource ID beginning with that module ID. Make sure the PDF itself matches the title and contains a correction only if you will mark one.
2. Add one record to `resources` in `data/resources.json` with `id`, `level: "L2"`, `semester`, `module`, `type: "examen"`, French and Arabic `title`, `pdfPath`, `order`, `academicYear`, `session`, `examKind`, and `hasCorrection`. Use the values and relationships in `docs/content-model.md`; do not guess a year, session, or exam kind.
3. Run `node scripts/doctor.cjs`, open the exam and download it through a local HTTP preview, then commit and push the JSON and PDF together. The connected Netlify site will rebuild from the push.

## Deploy to Netlify

Import `ousssamaaslan-cell/university` from GitHub with `main` as the production branch. Set the base directory to the repository root, the build command to `node scripts/doctor.cjs && node scripts/publish.cjs`, and the publish directory to `.netlify-publish`. These values are also in `netlify.toml`.

The copy step contains only the five HTML pages, `css/styles.css`, `data/resources.json`, browser JavaScript, supported image assets, and PDFs named in the catalogue. It excludes `assets/README.md` and every repository document, template, test, project instruction, and script. `docs/published-files.md` records the exact current 76-file output.

After the first deploy, open **Forms**, enable form detection if needed, and verify that `report-error` appears. In **Forms → Submission notifications**, add an email notification for `report-error` and enter the maintainer address there. Test one submission on the live site. The address is never embedded in the published files.

## Checks

`node scripts/doctor.cjs` validates the setup, the catalogue records, the fields each resource type needs, and that every PDF path exists. It also fails when a file under `pdfs/` belongs to no record, when a PDF is not named after its resource ID, and when a label in `js/i18n.js` exists in one language only. It reports how many sample records remain. It installs nothing. There is no `npm install`, compilation, lint, or type-check command for the site.

## Claude Code workflow

Open Claude Code in this folder. It reads `.claude/CLAUDE.md`, active rules, agents, hooks, and skills. Marketing and conversion material from the source template is preserved under `.claude/_unused/`, outside the active skill/rule locations. Historical command names retain `lp-` for compatibility, but their instructions describe the resource library.

- `/add-resource` adds or removes a module or a PDF in the catalogue.
- `/lp-check` and `templates/qa-report.md` cover browser and content validation.

For Codex, `AGENTS.md` points to the same source of truth.

`vendor-manifest.json` records the origin and current hashes of copied external skill files. `NOTICE.md` records attribution. The optional hooks in `.claude/settings.optional.json` are not active.
