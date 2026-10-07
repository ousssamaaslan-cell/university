# L2 resource library — design system

## Direction

Use a calm academic style that makes the semester, module, resource type, and PDF action immediately clear. Prioritize reading and finding files over decoration. Use the university's official identity only after its name, branding, and permission to use assets are confirmed. Until then, use neutral typography and color; do not invent a logo or crest.

## Layout and navigation

- Design mobile-first. Use one readable content column on narrow screens and expand only when the content benefits from it.
- The homepage should make S3 and S4 easy to scan. Module pages should expose the module title, semester, breadcrumb back to the semester, search/filter controls, and the three resource groups.
- Keep navigation and PDF actions visible, clearly labeled, and reachable by keyboard. Avoid horizontal scrolling at 320 CSS pixels and test at 200% zoom.
- Use a restrained spacing scale, consistent alignment, adequate tap targets, and a maximum reading width for text. Resource lists may use more horizontal space on large screens.

## Typography and color

- Use a legible system font stack until approved university fonts are supplied. Maintain a clear heading hierarchy and readable body size and line height.
- Define reusable semantic colors for page background, text, muted text, links, borders, focus, and status messages. Meet WCAG AA contrast for text and controls.
- Never rely on color alone to distinguish Exams, Tutorials, Exercises, or solution availability.

## Components and states for the later build

- Semester and module navigation; resource list/item; type label; year/session/solution metadata; search and filter controls; View PDF and Download PDF actions; breadcrumb; empty, loading, and error states.
- Use text labels with icons where icons help. Do not use icons as the only identifier for an action.
- Show a visible focus indicator and clear hover/active states. Respect `prefers-reduced-motion`; avoid nonessential animation.

## Language and direction

The site will support French and Arabic. The exact Arabic translations and approved spelling of the university name in Arabic are still needed; do not invent them or publish mixed-language placeholders.

Set the appropriate `lang` for each language view and `dir="rtl"` for Arabic. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`) and test breadcrumb direction, icons, search fields, numerals, filenames, and mixed French/Arabic text. Provide a consistent language switch and translated navigation, labels, metadata, empty states, and resource-type names. Preserve a sensible direction for each language.

## Assets

Keep approved logos/icons under `assets/` with source and usage information. Do not hotlink or invent university assets. PDF files live under `pdfs/S3/` and `pdfs/S4/` as specified in `docs/content-model.md`.
