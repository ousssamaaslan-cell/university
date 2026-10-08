# L2 resource library — design system

## Direction

Use a calm academic style that makes the semester, module, resource type, and PDF action immediately clear. Prioritize reading and finding files over decoration. No university logo, colours, or fonts were supplied, so the style is neutral; do not invent a logo or crest.

The one distinctive element is the **module code**: the abbreviation students already use (ASD3, AO, POO1) set as a solid block in the text colour beside the full name, like a shelf mark in a library catalogue. It is the only solid dark shape on a page. Everything around it stays quiet: white page, dark text, one blue used only for things a student can act on.

## Layout and navigation

- Design mobile-first. Use one readable content column on narrow screens and expand only when the content benefits from it.
- The homepage should make S3 and S4 easy to scan. Module pages should expose the module code and title, semester, breadcrumb back to the semester, search/filter controls, and the four resource groups.
- Keep navigation and PDF actions visible, clearly labeled, and reachable by keyboard. Avoid horizontal scrolling at 320 CSS pixels and test at 200% zoom.
- Align content to the start edge (left in French, right in Arabic). Do not centre body content.
- Separate list rows with a rule, not with boxes and shadows. Use a filled surface only for notices and status messages.
- **An outline means "you can tap this".** Only the search field, the selects, the buttons, and the tabs have an outlined box. Facts about a document are plain text, the module code is a solid block, and messages are marked by a fill or by a rule above and below.
- **The first phone screen shows a document.** On a 375 by 812 screen the first row of a module page starts at about 450px in French and 480px in Arabic (it was 867 and 933 before the design critique). Keep it there: anything added above the list on a phone must take its height from something else.
- **Header.** Site name, language switch, and search field. On a phone they make two rows: the name beside the language switch, then the search field. From 60rem they share one row. The university name sits under the site name from 40rem; on a phone it is in the footer only.
- **Breadcrumb.** It lists the pages above the current one, each as a link ("Accueil / Semestre 3"). The current page is not repeated, because its name is the title just below. The home page has no breadcrumb.
- **Footer.** It answers who runs the site and whether it can be trusted: the site name, one sentence saying it is run by students and is not an official site of the university, the date of the last update, and "Signaler une erreur" after the question "Un fichier manquant ou incorrect ?". The date is the day, in Algeria, on which the server says `data/resources.json` last changed; nobody types it, and the line is left out when the server gives no date (and on the 404 page, which does not load the catalogue). "Signaler une erreur" opens an email to the maintainer that already names the page the reader was on.
- Semester navigation is the home page itself plus the breadcrumb.

## Tokens

The values live as CSS custom properties at the top of `css/styles.css`. Change them there; this section records what was chosen and why. The maintainer agreed on 2026-10-07 that Claude chooses the neutral values.

### Color

The site follows the reader's system setting for light or dark. Every pair below meets WCAG AA: at least 4.5:1 for text and 3:1 for control borders and the focus ring. The lowest measured text pair is muted text on the surface colour, 5.85:1.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#14181e` | Page background |
| `--color-surface` | `#f3f5f8` | `#1c222b` | Footer, quiet panels |
| `--color-text` | `#1b2430` | `#e7eaee` | Body text, headings, fill of the module code |
| `--color-text-muted` | `#55606e` | `#aab3bf` | Secondary text, counts, metadata |
| `--color-link` | `#1b4f9c` | `#9cc2ff` | Links, focus ring, current tab or filter |
| `--color-link-hover` | `#123a75` | `#c3daff` | Hovered and pressed links |
| `--color-link-visited` | `#70359c` | `#cdb0ff` | Title of a document the reader has already opened |
| `--color-border` | `#d3d9e0` | `#313a46` | Rules between rows, decorative edges |
| `--color-border-strong` | `#737d89` | `#7d8896` | Borders of the search field, selects, buttons, and tabs |
| `--color-accent-surface` | `#e7eef9` | `#1f2f47` | Background of the current or selected item |
| `--color-notice-bg` / `-text` / `-border` | `#fdf3d1` / `#4d3a00` / `#a37800` | `#3a2f0b` / `#f6e3a1` / `#c79a1c` | Sample-data notice, warnings |
| `--color-ok-bg` / `-text` | `#e4f3ea` / `#17603a` | `#153223` / `#86d6a5` | "Correction available" |
| `--color-error-bg` / `-text` | `#fdeaea` / `#9b1c1c` | `#3d1a1a` / `#ffb1b1` | Load and file errors |

Never rely on color alone to distinguish Cours, TD, TP, Examens, or correction availability. Each always has a text label.

### Typography

System fonts only, so nothing is downloaded and Arabic renders with the device's own Arabic face.

- French: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif`
- Arabic: `system-ui, "Segoe UI", "Noto Sans Arabic", "Geeza Pro", Tahoma, Arial, sans-serif`

| Token | Size | Use |
| --- | --- | --- |
| `--text-sm` | 0.875rem | Metadata, footer, breadcrumb |
| `--text-base` | 1rem | Body |
| `--text-md` | 1.125rem | Row titles, lead paragraph |
| `--text-lg` | 1.375rem | Section headings (h2) |
| `--text-xl` | 1.5rem to 2.25rem, fluid | Page heading (h1) |

Body line height is 1.55 in French and 1.8 in Arabic; headings use 1.2 and 1.45. Headings are weight 700, the module code 700, everything else 400 or 600. Text lines stay under about 65 characters. Use sentence case; no all-capitals labels.

### Spacing, shape, and size

- Spacing scale: 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4 rem (`--space-1` to `--space-8`).
- Page width: up to 56rem, with a side gutter between 1rem and 2rem. A document count stays close to the name it belongs to.
- Corners: 4px on controls and the module code, 8px on notices. No shadows.
- Tap targets: at least 44 by 44 CSS pixels for links in lists, tabs, and buttons.
- Focus: a 3px ring in `--color-link`, offset 2px, on every focusable element.
- Motion: none on load. Transitions are limited to colour changes under 150ms and are removed under `prefers-reduced-motion`.

## Components and states

- Site header with language switch; site footer; breadcrumb; sample-data notice.
- Module code; module row; semester section with its empty state.
- **Module row.** The code and the full name are one link to the module page. After them come the number of documents and an "Examens" link that opens the module page directly on its exams. A module with no exam has no such link, so nobody taps through to an empty tab. On a phone the count and the link share the line under the name; from 40rem the row is one line and the counts line up. The same row lists modules in search results.
- Resource list and item; type label; chapter or sheet number; year, session, exam-kind, and correction facts; the title link that opens the PDF and the "Télécharger" button.
- Tabs for Cours, TD, TP, Examens; year and session filters on Examens; search.
- Empty, loading, and error states. Say what is missing and what the student can do next.
- Use text labels with icons where icons help. Do not use icons as the only identifier for an action.
- Show a visible focus indicator and clear hover/active states.

### Module page

- **Title.** The module code and the module name share one heading. The code stays on the first line and the name runs on after it. Nothing sits under the title: the semester is in the breadcrumb and each tab shows its own count.
- **Tabs.** Cours, TD, TP, Examens in one row at every width: on a phone each tab is as wide as its label needs, from 40rem they are four equal columns. Each shows its document count. The Arabic tabs keep "TD" and "TP", which students say aloud and which fit. The open tab is marked by a fill, a heavier edge, and a bar. A tab whose type has no document yet is muted (lighter edge, regular weight, grey label) until it is chosen; it still opens and says that nothing is there yet. The page opens on the tab named in the address, otherwise on the first type that has documents. The arrow keys move between tabs and follow the reading direction.
- **Resource rows.** One row per PDF. The chapter or sheet number ("Chapitre 2", "TD 3") and the title are one link that opens the PDF in the browser's own viewer. On a phone the number runs on before the title; from 36rem it has its own column. Under the title, the facts about the document make one quiet line of plain text with a dot between two facts: exam kind, session, year, "Sans corrigé", then the file type and size. "Avec corrigé" is the only fact drawn as a badge, filled green, so it is the one a student spots first. A line of facts never starts or ends with a dot. The title of a document the reader has already opened in this browser turns from blue to purple (`--color-link-visited`).
- **Exams.** Listed under one heading per academic year, newest first. Two native selects filter by year and session, side by side even on a phone. The label above each says what it filters, so the choices are short ("Toutes", "Normale", "Rattrapage"). Each filter lists only the years or sessions the module's exams really have, and a filter with nothing to choose between is not shown. While a filter is set, the number of exams shown appears with the reset button; with no filter the tab already shows that number, so it is only announced to screen readers.
- **Actions.** Two per document. The title opens the PDF, and one outlined "Télécharger" button saves it. On a phone the button shares the second line with the facts; from 36rem it sits at the end of the row. Screen readers hear what each one does and which document it acts on. The file size is the last fact ("PDF, 1,4 Mo"). Its place is in the row from the start, at a width that fits the longest size, so the row does not move when the size arrives. In Arabic, "PDF" and the size are isolated from each other so the number stays beside its unit.
- **Sample and missing files.** A sample record carries the fact "Exemple". A document whose PDF is not on the server keeps its title, which is then plain text and not a link, and shows "Fichier indisponible" in place of the facts and the button. "Signaler une erreur" sits beside that message; its email also names the missing file.
- **Empty states.** An empty tab says which type has nothing yet. A module with no documents at all shows one message and no tabs. Filters with no match explain how to widen them. Each state says its message once.

### Search

- **Header field.** On every page, after the language switch: its own row on a phone, the end of the first row from 60rem. It is a plain form with a "Rechercher" button, so Enter works and the result address can be shared.
- **Results page.** A line under the heading states the outcome ("1 module, 22 documents pour « asd3 »") and is announced to screen readers. Modules come first, in the same rows as the home page. Documents follow, grouped under a link to their module, in the same rows as the module page; an exam is marked with its academic year ("2024-2025") where a TD has "TD 3", since it is no longer under a year heading. When a search finds one module and only that module's documents, as typing "asd3" does, the module is named once: its row under Modules, then its documents with no second heading.
- **While typing.** On the results page the list updates after a short pause in typing.
- **States.** Nothing typed, fewer than two characters, no match (with ways to widen the search and a link to all modules), and a load error are four different messages. At most 30 documents are listed; beyond that the page asks for one more word.

## Language and direction

The site is complete in French and Arabic. French is the default. The language switch is in the header on every page and names each language in its own script ("Français", "العربية"). The choice is kept in the URL (`?lang=ar`) and remembered in the browser.

The Arabic text is drafted by Claude and awaits the maintainer's review; `docs/project-brief.md` lists what is pending.

Set `lang` and `dir="rtl"` on the document for Arabic. Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`) so one stylesheet serves both directions. Module abbreviations, file names, and academic years stay in Latin letters and Western digits in the Arabic view and are isolated so they do not reorder the surrounding text. Test breadcrumb direction, icons, search fields, numerals, filenames, and mixed French/Arabic text.

## Assets

Keep approved logos/icons under `assets/` with source and usage information. Do not hotlink or invent university assets. PDF files live under `pdfs/S3/` and `pdfs/S4/` as specified in `docs/content-model.md`.
