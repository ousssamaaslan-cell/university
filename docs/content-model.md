# Content model for the L2 resource library

`data/resources.json` is the single catalogue. It holds one top-level object with three arrays: `semesters`, `modules`, and `resources`. Only L2, S3, and S4 are in scope; the `level` field lets a future project extend the model without building other levels now.

Adding a document means two things only: drop the PDF in `pdfs/<semester>/<module-id>/` and add one record to `resources`. The pages render from the catalogue, so no HTML is edited.

The admin dashboard at `/admin` does those two things for the maintainer. It asks for the semester, the module, the type, the fields of the type, both titles, and the PDF; on save it fills in `id`, `level`, `order`, and `pdfPath`, and commits the record and the file together. It also changes a document, replaces its PDF at the same path, and deletes a document with its PDF. Its rules are `admin/catalogue-rules.js`, which follows this document: when the model changes here, change that file, `scripts/doctor.cjs`, and `scripts/test-admin.cjs` with it. Semesters and modules are not in the dashboard.

An ID assigned by the dashboard is `<module>-cours-ch<NN>`, `<module>-td-<NN>`, `<module>-tp-<NN>`, or `<module>-examen-<academicYear>-<examKind>`, with two digits for the number. A Cours, TD, or TP that has an `academicYear` gets `-<academicYear>` at the end, and a second document with the same facts gets `-2`, then `-3`. `order` is the chapter or sheet number, and for an exam 1 for a contrôle, 2 for an EMD, 3 for an examen final, and 4 for a rattrapage. An edit keeps the `id` and the `pdfPath` even when the number or the year changes; `order` follows the new number unless it had been set by hand.

Before adding a document, the dashboard looks for one already at the same place: the same module, type, and chapter or sheet number, whatever the academic year, or for an exam the same academic year, session, and exam kind. It shows that document's title and asks before publishing beside it.

## Modules

| Field | Value |
| --- | --- |
| `id` | Lowercase abbreviation, for example `asd3`. It is the public `module.html?id=` value and the PDF folder name, so it never changes once published. |
| `level` | Always `"L2"`. |
| `semester` | `"S3"` or `"S4"`. |
| `abbr` | The abbreviation students use, in capitals, for example `"ASD3"`. It is shown next to the name everywhere and is searchable. `id` is `abbr` in lowercase. |
| `title` | `{ "fr": "...", "ar": "..." }`, the full module name. |
| `order` | Integer position inside the semester. |

## Resources

There are exactly four resource types. Module pages show them in this order.

| `type` | Label (fr) | What it holds |
| --- | --- | --- |
| `cours` | Cours | Course notes and lecture slides, usually one PDF per chapter. |
| `td` | TD | Travaux dirigés sheets, with the correction when available. |
| `tp` | TP | Lab work sheets, with the correction or code when available. |
| `examen` | Examens | Past exams by academic year and session, with the correction when available. |

Every resource has the same base fields:

| Field | Value |
| --- | --- |
| `id` | Unique, stable, lowercase with hyphens. Start it with the module ID, for example `asd3-td-03`. |
| `level` | Always `"L2"`. |
| `semester` | Same as the module's semester. |
| `module` | The module `id`. |
| `type` | `cours`, `td`, `tp`, or `examen`. |
| `title` | `{ "fr": "...", "ar": "..." }`. The topic of the chapter or sheet, or a short name for the exam. Do not repeat "TD 3" or "Chapitre 2" in it; the page adds that from the number. |
| `pdfPath` | Relative path `pdfs/<semester>/<module-id>/<file>.pdf`, with no leading slash. |
| `order` | Integer tie-breaker inside the same module and type. |

Each type then adds its own fields. A field that does not belong to the type is left out, not set to `null`.

| Field | `cours` | `td` and `tp` | `examen` | Value |
| --- | --- | --- | --- | --- |
| `chapter` | required | — | — | Chapter number, integer from 0. |
| `number` | — | required | — | Sheet number, integer from 1 (TD 3, TP 2). |
| `hasCorrection` | — | required | required | `true` only when the linked PDF contains the correction (or, for a TP, the code). |
| `academicYear` | optional | optional | required | `YYYY-YYYY`; the second year follows the first. |
| `session` | — | — | required | `normal` or `rattrapage`. |
| `examKind` | — | — | required | `emd`, `final`, `rattrapage`, or `controle`. |

`academicYear` is optional on Cours, TD, and TP so that two versions of the same sheet from different years can be told apart. Leave it out when there is only one version.

## Arabic terminology

Use these preferred terms when drafting future Arabic module and resource titles. Keep Arabic titles subject to the maintainer's review as described in `docs/project-brief.md`.

| French term | Preferred Arabic term |
| --- | --- |
| graphes | الرسوم البيانية |
| données | البيانات |
| parcours | الاجتياز |
| constructeurs | المنشئات |
| interpolation | الاستيفاء |
| dénombrement | مبادئ العدّ |
| cartes de Karnaugh | خرائط كارنو |
| modèle entité-relation | نموذج الكيان-العلاقة |
| conceptuel | مفاهيمي |
| implémentation | تنفيذ |
| contrôle | اختبار |

For a rattrapage exam title, use `امتحان استدراكي – جوان YYYY`, replacing `YYYY` with the exam year.

### Display order and filters

| Type | Order | Filters on the module page |
| --- | --- | --- |
| Cours | `chapter` ascending, then `order`, then title | None |
| TD, TP | `number` ascending, then newest `academicYear` first, then `order`, then title | None |
| Examens | Newest `academicYear` first, then `order`, then title | Academic year and session |

Semesters and modules sort by `order`, then title.

## JSON Schema

The schema describes the catalogue format. It does not verify that a module ID is referenced correctly or that a PDF exists; `node scripts/doctor.cjs` checks those. The doctor also fails when a file under `pdfs/` is used by no record (a PDF left behind after its record was removed would still be published), when a PDF is not named after its resource ID, when a resource ID does not start with its module ID, and when the catalogue has a top-level key other than the three arrays. Keep the S4 semester record even while it has no modules.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "L2 study resource catalogue",
  "type": "object",
  "required": ["semesters", "modules", "resources"],
  "additionalProperties": false,
  "$defs": {
    "localizedText": {
      "type": "object",
      "required": ["fr", "ar"],
      "additionalProperties": false,
      "properties": {
        "fr": { "type": "string", "minLength": 1 },
        "ar": { "type": "string", "minLength": 1 }
      }
    },
    "slug": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" }
  },
  "properties": {
    "semesters": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "label", "order"],
        "additionalProperties": false,
        "properties": {
          "id": { "enum": ["S3", "S4"] },
          "level": { "const": "L2" },
          "label": { "$ref": "#/$defs/localizedText" },
          "order": { "type": "integer", "minimum": 0 }
        }
      }
    },
    "modules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "semester", "abbr", "title", "order"],
        "additionalProperties": false,
        "properties": {
          "id": { "$ref": "#/$defs/slug" },
          "level": { "const": "L2" },
          "semester": { "enum": ["S3", "S4"] },
          "abbr": { "type": "string", "pattern": "^[A-Z][A-Z0-9]*$" },
          "title": { "$ref": "#/$defs/localizedText" },
          "order": { "type": "integer", "minimum": 0 }
        }
      }
    },
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "semester", "module", "type", "title", "pdfPath", "order"],
        "additionalProperties": false,
        "properties": {
          "id": { "$ref": "#/$defs/slug" },
          "level": { "const": "L2" },
          "semester": { "enum": ["S3", "S4"] },
          "module": { "$ref": "#/$defs/slug" },
          "type": { "enum": ["cours", "td", "tp", "examen"] },
          "title": { "$ref": "#/$defs/localizedText" },
          "pdfPath": { "type": "string", "pattern": "^pdfs/(S3|S4)/[a-z0-9-]+/[a-z0-9-]+\\.pdf$" },
          "order": { "type": "integer", "minimum": 0 },
          "chapter": { "type": "integer", "minimum": 0 },
          "number": { "type": "integer", "minimum": 1 },
          "hasCorrection": { "type": "boolean" },
          "academicYear": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{4}$" },
          "session": { "enum": ["normal", "rattrapage"] },
          "examKind": { "enum": ["emd", "final", "rattrapage", "controle"] }
        },
        "oneOf": [
          {
            "properties": { "type": { "const": "cours" } },
            "required": ["chapter"],
            "not": { "anyOf": [{ "required": ["number"] }, { "required": ["hasCorrection"] }, { "required": ["session"] }, { "required": ["examKind"] }] }
          },
          {
            "properties": { "type": { "enum": ["td", "tp"] } },
            "required": ["number", "hasCorrection"],
            "not": { "anyOf": [{ "required": ["chapter"] }, { "required": ["session"] }, { "required": ["examKind"] }] }
          },
          {
            "properties": { "type": { "const": "examen" } },
            "required": ["academicYear", "session", "examKind", "hasCorrection"],
            "not": { "anyOf": [{ "required": ["chapter"] }, { "required": ["number"] }] }
          }
        ]
      }
    }
  }
}
```

## Format examples

These four records show the shape of each type. The titles and files are examples of the format, **not real documents**; do not copy them into the catalogue.

```json
[
  {
    "id": "asd3-cours-ch02",
    "level": "L2",
    "semester": "S3",
    "module": "asd3",
    "type": "cours",
    "chapter": 2,
    "title": { "fr": "Titre du chapitre", "ar": "عنوان الفصل" },
    "pdfPath": "pdfs/S3/asd3/asd3-cours-ch02.pdf",
    "order": 2
  },
  {
    "id": "asd3-td-03",
    "level": "L2",
    "semester": "S3",
    "module": "asd3",
    "type": "td",
    "number": 3,
    "title": { "fr": "Sujet de la série", "ar": "موضوع السلسلة" },
    "hasCorrection": true,
    "pdfPath": "pdfs/S3/asd3/asd3-td-03.pdf",
    "order": 3
  },
  {
    "id": "asd3-tp-02",
    "level": "L2",
    "semester": "S3",
    "module": "asd3",
    "type": "tp",
    "number": 2,
    "title": { "fr": "Sujet du TP", "ar": "موضوع العمل التطبيقي" },
    "hasCorrection": false,
    "pdfPath": "pdfs/S3/asd3/asd3-tp-02.pdf",
    "order": 2
  },
  {
    "id": "asd3-examen-2024-2025-emd",
    "level": "L2",
    "semester": "S3",
    "module": "asd3",
    "type": "examen",
    "academicYear": "2024-2025",
    "session": "normal",
    "examKind": "emd",
    "title": { "fr": "Examen de janvier 2025", "ar": "امتحان جانفي 2025" },
    "hasCorrection": true,
    "pdfPath": "pdfs/S3/asd3/asd3-examen-2024-2025-emd.pdf",
    "order": 1
  }
]
```

## Relationship and publication rules

- `id` values are stable and unique within their array. Never derive links from display titles.
- Name each PDF after its resource `id` (`asd3-td-03` → `asd3-td-03.pdf`). The downloaded file then tells the student what it is.
- Keep both `fr` and `ar` text for every semester label, module title, and resource title. Arabic text drafted by Claude is allowed; it is listed in `docs/project-brief.md` as awaiting the maintainer's review.
- Every module's `semester` refers to one listed semester. Every resource's `module` refers to one listed module, and its `level` and `semester` match that module.
- An exam whose `examKind` is `rattrapage` belongs to the `rattrapage` session. Do not guess a session or an exam kind.
- `pdfPath` is a relative, case-sensitive site path. Its semester and module directory must match the record, and the file must exist before the record is published. Do not start it with `/`, so links resolve from the site's pages.
- If a correction is a separate PDF, add a separate resource record for it or extend the model deliberately before publishing it.
- Keep unverified or missing PDFs out of `resources.json`; do not publish broken View or Download links.
- Build-phase sample data is the one exception to the real-content rules above. Records whose `id` and PDF filename start with `sample-` may point to generated placeholder PDFs, as described in `docs/project-brief.md`. They follow the same schema, relationship, and path rules, and are removed before the site is announced to students.
