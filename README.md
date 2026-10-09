# L2 study resources

A public resource library for Licence 2 Informatique students at Université Mohammed Seddik Benyahia – Jijel. Students pick a semester and a module, then view or download its Cours, TD, TP, and Examens as PDFs.

**The site is under construction.** Built so far: the home page with both semesters, module pages with Cours, TD, TP, and Examens tabs, the year and session filters on Examens, search across modules and documents, a title that opens each PDF and a "Télécharger" button that saves it, empty and missing-file states, the report form, the 404 page, and an admin form at `/admin` for the maintainer. The quality pass is done; `docs/qa-report.md` records what was tested, found, and fixed. Netlify deploys the `main` branch at `https://admirable-concha-bbf7df.netlify.app`. The catalogue holds sample records and placeholder PDFs only; see "Sample data" below.

## What is confirmed

- Public student site, no login: S3/S4 → module → Cours, TD, TP, Examens.
- Seven S3 modules: ASD3, AO, SI, MN, POO1, PS1, GP. S4 is shown empty until its modules are supplied.
- French by default and Arabic with RTL, with a language switch on every page. The Arabic text is a draft awaiting the maintainer's review.
- Plain HTML, CSS, and browser JavaScript for the student pages, with no framework, compilation, or npm dependencies. Netlify uses a Node copy step to make its publish folder.
- Files: `index.html`, `module.html?id=<module-id>`, `search.html?q=<words>`, `report.html`, `404.html`, and `data/resources.json`; PDFs under `pdfs/<semester>/<module-id>/`; the admin form in `admin/`.
- One maintainer adds, changes, or removes documents, either in the admin form at `/admin` or by editing the catalogue and PDFs in the repository. Both end in a commit on `main`, which Netlify republishes. There is no server of our own, no database, and no Google Drive integration: the admin form is a static page that writes to GitHub with the maintainer's own GitHub login.
- The site is run by students and is not an official university site; the footer says so. "Signaler une erreur" opens a French or Arabic Netlify form. The maintainer's email address is configured in Netlify notifications, outside the website source. The footer's date of the last update comes from the server, so nobody types it.
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

Until the real PDFs are added, every resource in `data/resources.json` has an `id` starting with `sample-` and points to a generated placeholder PDF. The site shows a notice while any sample record exists.

- `node scripts/make-sample-pdfs.cjs` regenerates the placeholder PDFs from the catalogue.
- Remove every `sample-` record and placeholder PDF before the site is announced to students.

## Add a document with the admin form

The admin form is at `https://admirable-concha-bbf7df.netlify.app/admin/`. It is a computer tool: its editor needs a window at least 800 pixels wide.

1. Open `/admin/` and choose **Se connecter avec GitHub**. Only a GitHub account with write access to the repository gets in.
2. Open **Catalogue**, then **Documents : Cours, TD, TP et Examens**. The list shows every document, by module and type.
3. Choose **Ajouter une entrée de type document**, then the type: Cours, TD, TP, or Examen. A form opens at the top of the list.
4. Fill it in. Semestre, Module, Année universitaire, Session, and Nature de l'examen are lists; the numbers are number fields; both titles are required. Turn on "Le PDF contient le corrigé" only when the file does.
5. Under **Fichier PDF**, choose **Choisir un fichier**, then **Téléverser une nouvelle ressource**, pick the PDF on your computer (50 MB at most), and confirm with **Choisir les éléments sélectionnés**. The file's own name does not matter.
6. Choose **Publier**, then **Publier maintenant**. A green note at the bottom of the window gives the document's ID and where its PDF was stored. Netlify republishes the site in a minute or two.

To change a document, open it in the list, edit it, and publish. To replace its PDF, use **Choisir un fichier différent**. To remove a document, use the cross on its row and publish; its PDF is removed with it. A document's module and type cannot be changed once published: remove it and add it again.

What a save does (`admin/catalogue-rules.js`):

- It gives a new document its `id` (`asd3-td-03`, `asd3-cours-ch02`, `asd3-examen-2024-2025-emd`; a second document with the same facts ends in `-2`), its `level`, and its `order` when the field was left empty.
- It stores the PDF as `pdfs/<semester>/<module-id>/<id>.pdf`, whatever the file was called.
- It adds the record to `data/resources.json` where the site would list it, with the fields of its type only, and leaves the rest of the file untouched.
- It refuses, with the reasons listed at the bottom of the window: a module that is not in the chosen semester, a rattrapage exam in the normal session, a file that is not a PDF, a missing title, and a form opened before somebody else changed the catalogue.
- The catalogue, the new PDFs, and the removed PDFs go to GitHub in one commit (`admin/github-commit.js`), so the repository never holds a record without its file.

Then `node scripts/doctor.cjs` runs on Netlify before every publication. If a commit holds a bad record or a stray PDF, the build fails and the public site stays as it was.

The Semestre and Module lists come from the published `data/resources.json`. After adding a module in the repository, wait for Netlify to republish, then reload `/admin/`.

Opened from a local preview (`http://localhost:8000/admin/`), the form works on a copy kept in the browser tab: nothing is sent to GitHub, and a reload starts again. It is a safe place to try the form.

### One-time setup of the GitHub login

Netlify is the go-between for the GitHub login; it keeps the OAuth secret, which is never in this repository.

1. On GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**. Homepage URL: the site's address. Authorization callback URL: `https://api.netlify.com/auth/done`. Register, note the **Client ID**, and generate a **Client secret**.
2. On Netlify, in the project: **Project configuration → Security → OAuth → Authentication Providers → Install Provider**. Choose GitHub and paste the Client ID and the Client secret.
3. Open `/admin/` and log in.

The login asks GitHub for access to public repositories only (`auth_scope: 'public_repo'` in `admin/admin.js`). If the repository becomes private, change it to `'repo'`. Netlify Identity and Git Gateway are not used; Netlify lists Git Gateway as deprecated.

## Add a document by hand: a new exam in 3 steps

The repository route still works, and is the only one for modules and semesters.

1. Put the verified PDF at `pdfs/<semester>/<module-id>/<resource-id>.pdf`. Use the confirmed S3 or S4 module ID, and a stable lowercase resource ID beginning with that module ID. Make sure the PDF itself matches the title and contains a correction only if you will mark one.
2. Add one record to `resources` in `data/resources.json` with `id`, `level: "L2"`, `semester`, `module`, `type: "examen"`, French and Arabic `title`, `pdfPath`, `order`, `academicYear`, `session`, `examKind`, and `hasCorrection`. Use the values and relationships in `docs/content-model.md`; do not guess a year, session, or exam kind.
3. Run `node scripts/doctor.cjs`, open the exam and download it through a local HTTP preview, then commit and push the JSON and PDF together. Netlify rebuilds from the push.

Run `git pull` before editing by hand when the admin form has been used: its saves are commits on `main` too.

## Deploy to Netlify

Import `ousssamaaslan-cell/university` from GitHub with `main` as the production branch. Set the base directory to the repository root, the build command to `node scripts/doctor.cjs && node scripts/publish.cjs`, and the publish directory to `.netlify-publish`. These values are also in `netlify.toml`.

The copy step contains only the five HTML pages, `css/styles.css`, `data/resources.json`, browser JavaScript, supported image assets, PDFs named in the catalogue, and the seven files of the admin form, named one by one. It excludes `assets/README.md` and every repository document, template, test, project instruction, and script. `docs/published-files.md` records the exact current 83-file output. `/admin/` is sent with `X-Robots-Tag: noindex, nofollow`, and no student page links to it.

After the first deploy, open **Forms**, enable form detection if needed, and verify that `report-error` appears. In **Forms → Submission notifications**, add an email notification for `report-error` and enter the maintainer address there. Test one submission on the live site. The address is never embedded in the published files.

## Checks

`node scripts/doctor.cjs` validates the setup, the catalogue records, the fields each resource type needs, and that every PDF path exists. It also fails when a file under `pdfs/` belongs to no record, when a PDF is not named after its resource ID, when a label in `js/i18n.js` exists in one language only, when a published file holds what looks like a token or an OAuth secret, and when `netlify.toml` publishes anything other than the allowlisted copy. It reports how many sample records remain. It installs nothing. There is no `npm install`, compilation, lint, or type-check command for the site.

`node scripts/test-admin.cjs` checks the admin form's save without a browser: what it writes and refuses, the GitHub commit against a stand-in for GitHub, and that the doctor accepts what the admin commits and stops sixteen kinds of bad entry. Run it after changing a file in `admin/` or the doctor.

The admin form uses Decap CMS 3.16.3 (MIT licence), kept in the repository as `admin/decap-cms.js` so the page loads no script from another site. `vendor-manifest.json` records where it came from and its hash, which the doctor verifies.

## Claude Code workflow

Open Claude Code in this folder. It reads `.claude/CLAUDE.md`, active rules, agents, hooks, and skills. Marketing and conversion material from the source template is preserved under `.claude/_unused/`, outside the active skill/rule locations. Historical command names retain `lp-` for compatibility, but their instructions describe the resource library.

- `/add-resource` adds or removes a module or a PDF in the catalogue, by hand in the repository.
- `/lp-check` and `templates/qa-report.md` cover browser and content validation.

For Codex, `AGENTS.md` points to the same source of truth.

`vendor-manifest.json` records the origin and current hashes of copied external skill files. `NOTICE.md` records attribution. The optional hooks in `.claude/settings.optional.json` are not active.
