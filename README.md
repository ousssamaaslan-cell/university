# L2 study resources

A public resource library for Licence 2 Informatique students at Université Mohammed Seddik Benyahia – Jijel. Students pick a semester and a module, then view or download its Cours, TD, TP, and Examens as PDFs.

**The site is under construction.** Built so far: the home page with both semesters, module pages with Cours, TD, TP, and Examens tabs, the year and session filters on Examens, search across modules and documents, a title that opens each PDF and a "Télécharger" button that saves it, empty and missing-file states, the report form, the 404 page, and an admin dashboard at `/admin` for the maintainer. The quality pass is done; `docs/qa-report.md` records what was tested, found, and fixed. Netlify deploys the `main` branch at `https://admirable-concha-bbf7df.netlify.app`. The sample records and placeholder PDFs were removed on 2026-10-10; the catalogue holds one document, added by the maintainer through the admin. See "Sample data" below.

## What is confirmed

- Public student site, no login: S3/S4 → module → Cours, TD, TP, Examens.
- Seven S3 modules: ASD3, AO, SI, MN, POO1, PS1, GP. S4 is shown empty until its modules are supplied.
- French only: the interface, the module names, and the document titles. The Arabic version built earlier was removed on 2026-10-10; the Git tag `before-french-only` marks the last commit that had it.
- Plain HTML, CSS, and browser JavaScript for the student pages, with no framework, compilation, or npm dependencies. Netlify uses a Node copy step to make its publish folder.
- Files: `index.html`, `module.html?id=<module-id>`, `search.html?q=<words>`, `report.html`, `404.html`, and `data/resources.json`; PDFs under `pdfs/<semester>/<module-id>/`; the admin dashboard in `admin/`.
- One maintainer adds, changes, or removes documents, either in the admin dashboard at `/admin` or by editing the catalogue and PDFs in the repository. Both end in a commit on `main`, which Netlify republishes. There is no server of our own, no database, and no Google Drive integration: the dashboard is a static page that writes to GitHub with the maintainer's own GitHub login.
- The site is run by students and is not an official university site; the footer says so. "Signaler une erreur" opens a Netlify form. The maintainer's email address is configured in Netlify notifications, outside the website source. The footer's date of the last update comes from the server, so nobody types it.
- Netlify is the host. It builds the `main` branch of the GitHub repository `ousssamaaslan-cell/university`. The site uses relative page and PDF links.

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

The 53 build-phase sample records and their placeholder PDFs were removed on 2026-10-10, at the maintainer's request. The catalogue now holds only documents the maintainer adds.

- A record whose `id` starts with `sample-` is still treated as a sample: the site shows a notice while one exists, and the doctor counts them. None should be added again.
- `node scripts/make-sample-pdfs.cjs` writes a placeholder PDF for each `sample-` record. With none in the catalogue it writes nothing.

## The admin dashboard

The dashboard is at `https://admirable-concha-bbf7df.netlify.app/admin/`. Its interface is in French, and it works on a phone and on a computer. It has two tabs: **Ajouter un document** and **Mes documents**. The header shows the logged-in GitHub account, **Voir le site**, and **Se déconnecter**.

To log in, open `/admin/` and choose **Se connecter avec GitHub**. A small GitHub window opens; if nothing opens, allow pop-up windows for the site. Only a GitHub account with write access to the repository gets in. The login lasts until the browser tab is closed.

### Add a document in 3 steps

1. In **Ajouter un document**, choose the semester, the module, and the type: Cours, TD, TP, or Examen. The last choice is remembered for the next visit.
2. Fill in what that type asks for (chapter or sheet number; for an exam the year, the kind, and the session), the title, and drop the PDF on the dashed zone or use **Choisir un fichier**. Turn on "Le PDF contient le corrigé" only when the file does.
3. Check the preview, which shows the ID, the PDF's path, and the row as the module page will draw it. Then choose **Publier**.

The page answers "Publié. Visible sur le site dans environ une minute." and that sentence becomes "En ligne ✓" once the public site shows the document. **Ajouter un autre document dans ce module** keeps the semester, the module, and the type.

**Publier** stays disabled while something is missing; the list above it says what, and each line leads to its field. If a document already exists at the same place (same module, type, and number; for an exam the same year, session, and kind), the page shows its title and asks you to tick a box before publishing beside it.

### Delete a document in 3 steps

1. Open **Mes documents** and find the document: by module, with the search box (title, module code, number, or year), or with the type filter.
2. Choose **Supprimer** on its row. To delete several at once, tick their boxes and choose **Supprimer la sélection**.
3. Read the confirmation, which names each document, then choose **Supprimer définitivement**.

The PDF and its entry in the catalogue are removed together, in one commit. A deletion cannot be undone from the dashboard; the file remains in the repository's Git history.

### Change a document or replace its PDF

In **Mes documents**, choose **Modifier** on the document's row. The same form opens, filled in. The title, the fields of the type, the correction switch, and the PDF can change; a replaced PDF keeps its name and address. The semester, the module, and the type are locked, because the ID and the file name depend on them: to change one, delete the document and add it again. **Voir** opens the PDF as the repository holds it now, which is useful just after a replacement.

### What a save does

- A new document gets its `id` (`asd3-td-03`, `asd3-cours-ch02`, `asd3-examen-2024-2025-emd`; a second document at the same place ends in `-2`), its `level`, and its `order`. An edited document keeps its `id` and its place in the file.
- The PDF is stored as `pdfs/<semester>/<module-id>/<id>.pdf`, whatever the file was called. Its name must end in `.pdf` and its content must start with `%PDF`. A file over 50 MB is refused; over 10 MB the page suggests compressing it and lets you publish.
- The record is added to `data/resources.json` where the site would list it, with the fields of its type only. Every other record stays exactly as it is.
- Each action is one commit holding the catalogue and the PDF change together, named `Admin: add …`, `Admin: edit …`, or `Admin: delete …`. The repository never holds a record without its file.
- Before writing, the dashboard reads the catalogue from GitHub again, never from the published site. If `main` moved while it was saving, it reads again and retries once; if that fails too, it stops and asks you to choose **Rafraîchir**. It never forces the branch.
- It writes only `data/resources.json` and PDFs in their module folder. Any other path is refused.

The rules are in `admin/catalogue-rules.js`, the commit in `admin/admin-flow.js` and `admin/github-commit.js`. Then `node scripts/doctor.cjs` runs on Netlify before every publication. If a commit holds a bad record or a stray PDF, the build fails and the public site stays as it was; the dashboard then says "Toujours en cours de déploiement" after five minutes, with a link to Netlify's Deploys page.

Modules and semesters are not in the dashboard: they are changed in the repository (see below). A new module appears in the dashboard as soon as it is in the repository.

Opened from a local preview (`http://localhost:8000/admin/`), the dashboard works on a copy kept in the browser tab: there is no login, nothing is sent to GitHub, and a reload starts again from the files on disk. It is a safe place to try it.

### The Decap backup (temporary)

The former admin form, built with Decap CMS, is kept at `/admin/decap/` for a while in case the new dashboard gets in the way of adding a document. It uses the same GitHub login and saves through the same rules, and it is a computer tool: its editor needs a window at least 800 pixels wide. It is temporary and will be removed once the dashboard has been used for a while.

Decap keeps its login in the browser's local storage, which outlasts the tab. **Se déconnecter** in the dashboard also ends that login.

### One-time setup of the GitHub login

Netlify is the go-between for the GitHub login; it keeps the OAuth secret, which is never in this repository.

1. On GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**. Homepage URL: the site's address. Authorization callback URL: `https://api.netlify.com/auth/done`. Register, note the **Client ID**, and generate a **Client secret**.
2. On Netlify, in the project: **Project configuration → Security → OAuth → Authentication Providers → Install Provider**. Choose GitHub and paste the Client ID and the Client secret.
3. Open `/admin/` and log in.

The dashboard and the Decap backup share this setup: both open Netlify's login window for this site (`admin/netlify-auth.js` in the dashboard), and Netlify returns a GitHub access token to the page. The dashboard keeps that token in the browser tab's session storage only; it is gone when the tab closes or after **Se déconnecter**.

The login asks GitHub for access to public repositories only (`SCOPE` in `admin/admin.js`, `auth_scope` in `admin/decap/admin.js`: `public_repo`). If the repository becomes private, change both to `repo`. Netlify Identity and Git Gateway are not used; Netlify lists Git Gateway as deprecated.

## Add a document by hand: a new exam in 3 steps

The repository route still works, and is the only one for modules and semesters.

1. Put the verified PDF at `pdfs/<semester>/<module-id>/<resource-id>.pdf`. Use the confirmed S3 or S4 module ID, and a stable lowercase resource ID beginning with that module ID. Make sure the PDF itself matches the title and contains a correction only if you will mark one.
2. Add one record to `resources` in `data/resources.json` with `id`, `level: "L2"`, `semester`, `module`, `type: "examen"`, `title` (one line of French text), `pdfPath`, `order`, `academicYear`, `session`, `examKind`, and `hasCorrection`. Use the values and relationships in `docs/content-model.md`; do not guess a year, session, or exam kind.
3. Run `node scripts/doctor.cjs`, open the exam and download it through a local HTTP preview, then commit and push the JSON and PDF together. Netlify rebuilds from the push.

Run `git pull` before editing by hand when the admin dashboard has been used: its saves are commits on `main` too.

## Deploy to Netlify

Import `ousssamaaslan-cell/university` from GitHub with `main` as the production branch. Set the base directory to the repository root, the build command to `node scripts/doctor.cjs && node scripts/publish.cjs`, and the publish directory to `.netlify-publish`. These values are also in `netlify.toml`.

The copy step contains only the five HTML pages, `css/styles.css`, `data/resources.json`, browser JavaScript, supported image assets, PDFs named in the catalogue, and the files of the admin, named one by one: eleven for the dashboard and five for the Decap backup. It excludes `assets/README.md` and every repository document, template, test, project instruction, and script. `docs/published-files.md` records the 40-file output of 2026-10-10. `/admin/` and everything under it is sent with `X-Robots-Tag: noindex, nofollow`, and no student page links to it; the doctor fails if either stops being true.

After the first deploy, open **Forms**, enable form detection if needed, and verify that `report-error` appears. In **Forms → Submission notifications**, add an email notification for `report-error` and enter the maintainer address there. Test one submission on the live site. The address is never embedded in the published files.

## Checks

`node scripts/doctor.cjs` validates the setup, the catalogue records, the fields each resource type needs, and that every PDF path exists. It also fails when a file under `pdfs/` belongs to no record, when a PDF is not named after its resource ID, when a published file holds what looks like a token or an OAuth secret (every page, script, and stylesheet under `admin/` is read), when a student page mentions the admin, when `/admin` loses its `noindex`, and when `netlify.toml` publishes anything other than the allowlisted copy. It reports how many sample records remain. It installs nothing. There is no `npm install`, compilation, lint, or type-check command for the site.

`node scripts/test-admin.cjs` checks the admin without a browser, in 42 tests: what a save writes and refuses for each of the four types, an edit, a replaced PDF, a deletion of one or several documents, the duplicate warning, files that are not PDFs or are too large, paths outside `pdfs/`, the commit against a stand-in for GitHub with its one retry, the login exchange against a stand-in for the browser window, the watch on the public site after a commit, and that the doctor accepts everything the admin commits and stops sixteen kinds of bad entry. Run it after changing a file in `admin/` or the doctor.

The dashboard loads no script from another site and uses no library. The Decap backup uses Decap CMS 3.16.3 (MIT licence), kept in the repository as `admin/decap/decap-cms.js`. `vendor-manifest.json` records where it came from and its hash, which the doctor verifies.

## Claude Code workflow

Open Claude Code in this folder. It reads `.claude/CLAUDE.md`, active rules, agents, hooks, and skills. Marketing and conversion material from the source template is preserved under `.claude/_unused/`, outside the active skill/rule locations. Historical command names retain `lp-` for compatibility, but their instructions describe the resource library.

- `/add-resource` adds or removes a module or a PDF in the catalogue, by hand in the repository.
- `/lp-check` and `templates/qa-report.md` cover browser and content validation.

For Codex, `AGENTS.md` points to the same source of truth.

`vendor-manifest.json` records the origin and current hashes of copied external skill files. `NOTICE.md` records attribution. The optional hooks in `.claude/settings.optional.json` are not active.
