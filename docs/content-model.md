# Content model for the L2 resource library

The later site build will create `data/resources.json` with one top-level object containing `semesters`, `modules`, and `resources` arrays. `data/` is intentionally empty during setup. Only L2, S3, and S4 are in scope; the `level` field lets a future project extend the model without building other levels now.

## JSON Schema

The schema below describes the catalogue format. Localized labels and titles require both French (`fr`) and Arabic (`ar`) strings so the later language switch has real content. It does not verify that a module ID is referenced correctly or that a PDF exists; `/add-resource` must check those relationships and paths before publication. Keep an S4 semester record even while it has no modules.

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
    }
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
        "required": ["id", "level", "semester", "title", "order"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "level": { "const": "L2" },
          "semester": { "enum": ["S3", "S4"] },
          "title": { "$ref": "#/$defs/localizedText" },
          "order": { "type": "integer", "minimum": 0 }
        }
      }
    },
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "level", "semester", "module", "title", "type", "academicYear", "session", "pdfPath", "hasSolution", "order"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "level": { "const": "L2" },
          "semester": { "enum": ["S3", "S4"] },
          "module": { "type": "string", "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
          "title": { "$ref": "#/$defs/localizedText" },
          "type": { "enum": ["exam", "tutorial", "exercise"] },
          "academicYear": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{4}$" },
          "session": { "enum": ["normal", "rattrapage", null] },
          "pdfPath": { "type": "string", "pattern": "^pdfs/(S3|S4)/[a-z0-9-]+/[a-z0-9-]+\\.pdf$" },
          "hasSolution": { "type": "boolean" },
          "order": { "type": "integer", "minimum": 0 }
        }
      }
    }
  }
}
```

## Illustrative records only

These names and paths are examples, **not confirmed university content**. Do not copy them into the published catalogue without replacing them with real modules and existing PDFs.

```json
{
  "semesters": [
    { "id": "S3", "level": "L2", "label": { "fr": "Semestre 3", "ar": "السداسي الثالث" }, "order": 1 },
    { "id": "S4", "level": "L2", "label": { "fr": "Semestre 4", "ar": "السداسي الرابع" }, "order": 2 }
  ],
  "modules": [
    { "id": "sample-module", "level": "L2", "semester": "S3", "title": { "fr": "Module exemple", "ar": "مقياس تجريبي" }, "order": 1 }
  ],
  "resources": [
    { "id": "sample-exam-2024-normal", "level": "L2", "semester": "S3", "module": "sample-module", "title": { "fr": "Examen exemple", "ar": "امتحان تجريبي" }, "type": "exam", "academicYear": "2024-2025", "session": "normal", "pdfPath": "pdfs/S3/sample-module/sample-exam-2024-normal.pdf", "hasSolution": false, "order": 1 },
    { "id": "sample-tutorial-2024", "level": "L2", "semester": "S3", "module": "sample-module", "title": { "fr": "Travaux dirigés exemple", "ar": "أعمال موجهة تجريبية" }, "type": "tutorial", "academicYear": "2024-2025", "session": null, "pdfPath": "pdfs/S3/sample-module/sample-tutorial-2024.pdf", "hasSolution": true, "order": 2 },
    { "id": "sample-exercise-2024", "level": "L2", "semester": "S3", "module": "sample-module", "title": { "fr": "Exercice exemple", "ar": "تمرين تجريبي" }, "type": "exercise", "academicYear": "2024-2025", "session": null, "pdfPath": "pdfs/S3/sample-module/sample-exercise-2024.pdf", "hasSolution": false, "order": 3 }
  ]
}
```

## Relationship and publication rules

- `id` values are stable and unique within their array. Never derive links from display titles.
- Keep both `fr` and `ar` text for every semester label and module/resource title. Do not add a real record with guessed or placeholder translations.
- Every module's `semester` refers to one listed semester. Every resource's `module` refers to one listed module, and its `level` and `semester` match that module.
- Resource `type` uses the singular machine values above; the UI may label them Exams, Tutorials, and Exercises in the confirmed language.
- Use `session: null` when a tutorial or exercise has no exam session. Exams use `normal` or `rattrapage` when known; do not guess a session.
- `academicYear` uses `YYYY-YYYY` for the teaching year; check that the second year follows the first.
- `pdfPath` is a relative, case-sensitive site path. Its semester and module directory must match the record, and the file must exist before the record is published. Do not start it with `/`, so it works under a GitHub Pages project path as well as at a domain root.
- `hasSolution` means the linked PDF includes a solution. If a solution is a separate PDF, add a separate resource record or extend the model deliberately before publishing it.
- Sort semesters, modules, and resources by `order`, then title as a stable tie-breaker.
- Keep unverified or missing PDFs out of `resources.json`; do not publish broken View or Download links.
