---
name: add-resource
description: "Add or remove a confirmed L2 S3/S4 module or PDF in the static resource catalogue, with path validation."
disable-model-invocation: true
---

# Add a module or PDF

This project has one repository-based maintainer and no admin backend. Read `docs/project-brief.md`, `docs/content-model.md`, `.claude/rules/content-structure.md`, `.claude/rules/pdf-storage.md`, the current `data/resources.json` (when present), and $ARGUMENTS. Do not use the illustrative records in the content-model document as real data. Do not create another level or semester. This workflow is for real content; the build-phase `sample-` records and placeholder PDFs described in the brief are the only exception to its real-PDF rule, and they are removed before publication.

## Add a module

1. Get the confirmed French and Arabic module titles, S3 or S4 semester, and preferred stable ID. If any fact is unknown, ask; do not invent a course or translation.
2. Validate that the ID is lowercase ASCII with hyphens, unique among modules, and does not change an existing public `module.html?id=` link.
3. In `data/resources.json`, ensure the semester record exists, then add one module record with `id`, `level: "L2"`, `semester`, bilingual `title: { "fr": "...", "ar": "..." }`, and integer `order`. Preserve existing records and their IDs.
4. Create `pdfs/<semester>/<module-id>/` only when placing a real PDF there. The later `index.html` and `module.html` should render from the catalogue; do not hand-edit module cards into HTML.
5. Run `node scripts/doctor.cjs`. Review the displayed order and module link through a local HTTP server when pages exist.

## Add a PDF resource

1. Confirm its module, French and Arabic titles, type (`exam`, `tutorial`, or `exercise`), academic year (`YYYY-YYYY`), session (`normal` or `rattrapage` for an exam, otherwise `null`), whether the linked PDF includes a solution, and the real source PDF. Do not guess metadata or translations.
2. Confirm the module record exists and its semester is S3 or S4. Choose a unique, stable resource ID.
3. Name the PDF with a lowercase ASCII hyphenated filename, for example `2024-2025-exam-normal-topic.pdf`. Place it in `pdfs/<semester>/<module-id>/`. Keep the original content intact; do not put a placeholder or a Drive URL there.
4. Add one resource record to `data/resources.json` with all required fields in `docs/content-model.md`. Set `pdfPath` to the relative path such as `pdfs/S3/<module-id>/<filename>.pdf`, with no leading slash. Use `hasSolution: true` only when that PDF actually contains a solution.
5. Run `node scripts/doctor.cjs` to check JSON structure, IDs, relationships, path spelling, and PDF existence. Serve the site locally when built, then verify both View and Download links and the appropriate search/filter results.
6. Commit the JSON and PDF together and redeploy the chosen static host. A repository change alone does not update the published site.

## Remove or replace content

For a PDF deletion, remove its resource record and PDF in the same change; check that no other record uses that path. For a replacement, keep the path only if the new file represents the same resource and the metadata remains accurate. For a module deletion, first resolve all of its resources, then remove the module and any empty folder. Run the doctor and recheck affected student links before publishing.

Never claim that content appears live until the deployment has completed and the public PDF link has been verified.
