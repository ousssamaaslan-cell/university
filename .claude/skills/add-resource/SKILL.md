---
name: add-resource
description: "Add or remove a confirmed L2 S3/S4 module or PDF in the static resource catalogue by hand, with path validation; describes the /admin form route too."
disable-model-invocation: true
---

# Add a module or PDF

One maintainer keeps the catalogue, by two routes that both end in a commit on `main`: the admin form at `/admin` (see "The admin form" below), and this workflow, which edits `data/resources.json` and `pdfs/` in the repository. Use this workflow for modules and semesters, for several documents at once, for repairs, and whenever the maintainer asks Claude to make the change. Run `git pull` first: a save in the admin form is a commit too.

Read `docs/project-brief.md`, `docs/content-model.md`, `.claude/rules/content-structure.md`, `.claude/rules/pdf-storage.md`, the current `data/resources.json` (when present), and $ARGUMENTS. Do not use the format examples in the content-model document as real data. Do not create another level or semester. This workflow is for real content; the build-phase `sample-` records and placeholder PDFs described in the brief are the only exception to its real-PDF rule, and they are removed before publication.

When drafting an Arabic module or resource title, use the preferred terms and rattrapage title format in the "Arabic terminology" section of `docs/content-model.md`.

## The admin form

The maintainer can add, change, or remove a document without this workflow: `/admin` on the published site, logged in with a GitHub account that has write access to the repository. `README.md` gives the steps and the one-time login setup.

- The form covers documents only (Cours, TD, TP, Examen). Modules and semesters are changed here, in the repository. The form's Semestre and Module lists are read from the published catalogue, so a new module appears in the form after the next publication.
- A save assigns the ID, `level`, an empty `order`, and the PDF's folder and name; it writes the catalogue and the PDFs in one commit named `Admin: ...`. The rules are in `admin/catalogue-rules.js` and follow `docs/content-model.md`.
- Follow the same ID pattern by hand, so both routes agree: `<module>-cours-ch<NN>`, `<module>-td-<NN>`, `<module>-tp-<NN>`, `<module>-examen-<year>-<kind>`, with `-<year>` added to a Cours, TD, or TP that has an academic year, and `-2`, `-3` for a second document with the same facts.
- `node scripts/doctor.cjs` runs on Netlify before every publication, whichever route made the commit. A failed build leaves the public site as it was; read the build log, repair the catalogue here, and push.
- After changing a file in `admin/` or the doctor, run `node scripts/test-admin.cjs`.

## Add a module

1. Get the confirmed French module name, its abbreviation (for example `ASD3`), and its semester (S3 or S4). If any fact is unknown, ask; do not invent a course.
2. The module `id` is the abbreviation in lowercase (`asd3`). Validate that it is unique among modules and does not change an existing public `module.html?id=` link.
3. Draft the Arabic name if the maintainer did not supply one, and add it to "Arabic text awaiting review" in `docs/project-brief.md`.
4. In `data/resources.json`, ensure the semester record exists, then add one module record with `id`, `level: "L2"`, `semester`, `abbr`, bilingual `title: { "fr": "...", "ar": "..." }`, and integer `order`. Preserve existing records and their IDs.
5. Create `pdfs/<semester>/<module-id>/` only when placing a real PDF there. The pages render from the catalogue; do not hand-edit module lists into HTML.
6. Run `node scripts/doctor.cjs`. Review the displayed order and module link through a local HTTP server.

## Add a PDF resource

1. Confirm its module and its type: `cours`, `td`, `tp`, or `examen`. Then confirm the fields that type needs. Do not guess metadata.
   - `cours`: chapter number and chapter title.
   - `td` or `tp`: sheet number, title, and whether the PDF contains the correction (for a TP, the correction or the code).
   - `examen`: academic year (`YYYY-YYYY`), session (`normal` or `rattrapage`), exam kind (`emd`, `final`, `rattrapage`, or `controle`), a short title, and whether the PDF contains the correction.
2. Confirm the module record exists. Choose a unique, stable resource ID that starts with the module ID, such as `asd3-cours-ch02`, `asd3-td-03`, or `asd3-examen-2024-2025-emd`.
3. Name the PDF after the resource ID (`asd3-td-03.pdf`) and place it in `pdfs/<semester>/<module-id>/`. Keep the original content intact; do not put a placeholder or a Drive URL there.
4. Add one resource record to `data/resources.json` with the base fields and the type's own fields from `docs/content-model.md`. Leave out fields that do not belong to the type. Set `pdfPath` to the relative path such as `pdfs/S3/asd3/asd3-td-03.pdf`, with no leading slash. Use `hasCorrection: true` only when that PDF actually contains the correction. Draft the Arabic title if it was not supplied, and say so.
5. Run `node scripts/doctor.cjs` to check JSON structure, IDs, relationships, per-type fields, path spelling, and PDF existence. Serve the site locally, then verify both View and Download links, the tab the resource appears under, its position in the list, and the search and filter results.
6. Commit the JSON and PDF together and push. Netlify rebuilds `main` and publishes only if the doctor passes; a local change that is not pushed does not update the published site.

## Remove or replace content

For a PDF deletion, remove its resource record and PDF in the same change; check that no other record uses that path. For a replacement, keep the path only if the new file represents the same resource and the metadata remains accurate. For a module deletion, first resolve all of its resources, then remove the module and any empty folder. Run the doctor and recheck affected student links before publishing.

Never claim that content appears live until the deployment has completed and the public PDF link has been verified.
