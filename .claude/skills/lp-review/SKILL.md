---
name: lp-review
description: "Review the L2 resource library for findability, design, and engineering quality."
disable-model-invocation: true
---

# lp-review

Read the brief, content model, design system, page files, runtime URL, evidence, and $ARGUMENTS. Review whether students can find the right semester, module, resource type, year, and PDF quickly. Use `design-reviewer` and `quality-reviewer` with explicit task context when subagents are available; otherwise perform those passes directly. Report file or screenshot locations, severity, student impact, and concrete fixes. Distinguish browser findings from source-only observations. Consolidate findings in `docs/qa-report.md`; do not claim a pass for an unrun check.

Template-authored workflow; upstream source skills remain unchanged.
