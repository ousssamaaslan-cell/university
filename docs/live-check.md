# Live Netlify check

Checked: 2026-10-09. Site: https://admirable-concha-bbf7df.netlify.app/

Method: direct HTTP `GET` for pages, assets, private paths, and one complete PDF; `HEAD` for every PDF listed in the deployed `data/resources.json`. The site was public and reachable. The web preview could not render it, and no browser was available for interaction, so HTTP success does not prove that client-side content rendered or that a click worked.

## Pages

| Result | Exact URL | Observation |
| --- | --- | --- |
| Pass | https://admirable-concha-bbf7df.netlify.app/ | `200`, home HTML. |
| Pass | https://admirable-concha-bbf7df.netlify.app/index.html | `200`, same home HTML. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=asd3 | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=ao | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=si | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=mn | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=poo1 | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=ps1 | `200`, module HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=gp | `200`, module HTML shell. These are all seven module IDs in the deployed catalogue. |
| Pass | https://admirable-concha-bbf7df.netlify.app/search.html?q=ASD3 | `200`, search HTML shell. |
| Pass | https://admirable-concha-bbf7df.netlify.app/404.html | `200` when requested as an ordinary file. |
| Pass | https://admirable-concha-bbf7df.netlify.app/this-page-does-not-exist-live-check | `404`; body matches the custom `404.html` page and carries its title. |
| Pass | https://admirable-concha-bbf7df.netlify.app/report.html | `200`, report page HTML. |

The module and search pages populate from JavaScript. Their `200` responses confirm the shell is served; they do not confirm the rendered module lists or search results.

## Headers and caching

The following values were in the **actual responses**, including the custom 404 response:

| Result | Exact URL | Observed response headers |
| --- | --- | --- |
| Pass | https://admirable-concha-bbf7df.netlify.app/index.html | `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: camera=(), microphone=(), geolocation=()`; `Cache-Control: public,max-age=0,must-revalidate`. |
| Pass | https://admirable-concha-bbf7df.netlify.app/data/resources.json | Same four security headers; `Cache-Control: public,max-age=0,must-revalidate`; `200`, JSON. |
| Pass | https://admirable-concha-bbf7df.netlify.app/css/styles.css | Same four security headers; `Cache-Control: public,max-age=300,must-revalidate`; `200`, CSS. |
| Pass | https://admirable-concha-bbf7df.netlify.app/js/lang.js | Same four security headers; `Cache-Control: public,max-age=300,must-revalidate`; `200`, JavaScript. |
| Pass | https://admirable-concha-bbf7df.netlify.app/pdfs/S3/asd3/sample-asd3-cours-ch01.pdf | Same four security headers; `Cache-Control: public,max-age=3600,must-revalidate`; `200`, `application/pdf`. |
| Pass | https://admirable-concha-bbf7df.netlify.app/this-page-does-not-exist-live-check | Same four security headers; `Cache-Control: public,max-age=0,must-revalidate`; `404`. |

Header whitespace is shown as returned by Netlify; the values match `netlify.toml`.

## Private paths

Every tested path returned `404` with the custom 404 HTML, rather than the requested file. A directory `404` alone would not establish that a file inside is inaccessible, so representative direct file URLs were tested too.

| Result | Exact URL | Status |
| --- | --- | --- |
| Pass | https://admirable-concha-bbf7df.netlify.app/docs/ | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/docs/project-brief.md | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/docs/qa-report.md | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/.claude/ | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/.claude/CLAUDE.md | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/scripts/ | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/scripts/doctor.cjs | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/README.md | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/AGENTS.md | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/netlify.toml | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/templates/ | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/tests/ | `404` |
| Pass | https://admirable-concha-bbf7df.netlify.app/.impeccable/ | `404` |

This confirms the listed URLs are inaccessible; it is not a proof about every possible path.

## PDFs, language, and report form

| Result | Exact URL | Observation |
| --- | --- | --- |
| Pass | https://admirable-concha-bbf7df.netlify.app/data/resources.json | The live catalogue lists 53 resources; all 53 distinct `pdfPath` URLs returned `200` to `HEAD`, `Content-Type: application/pdf`, and a positive `Content-Length`. No missing PDF was found. |
| Pass | https://admirable-concha-bbf7df.netlify.app/pdfs/S3/asd3/sample-asd3-cours-ch01.pdf | Complete `GET` returned 1,390 bytes, starting `%PDF-1.4` and ending with a `%%EOF` marker. The response is suitable for a browser PDF viewer. It has no `Content-Disposition` header; the site's download link relies on the HTML `download` attribute. |
| Pass | https://admirable-concha-bbf7df.netlify.app/index.html?lang=ar | `200`. The deployed https://admirable-concha-bbf7df.netlify.app/js/lang.js sets `lang=ar` and `dir=rtl` from this URL in the browser; https://admirable-concha-bbf7df.netlify.app/js/i18n.js and https://admirable-concha-bbf7df.netlify.app/js/layout.js are also served with `200`. |
| Pass | https://admirable-concha-bbf7df.netlify.app/module.html?id=asd3&lang=ar | `200`, Arabic URL variant served. |
| Pass | https://admirable-concha-bbf7df.netlify.app/search.html?q=ASD3&lang=ar | `200`, Arabic URL variant served. |
| Pass | https://admirable-concha-bbf7df.netlify.app/report.html?lang=ar | `200`, Arabic URL variant served; https://admirable-concha-bbf7df.netlify.app/js/report.js is served with `200`. |
| Pass | https://admirable-concha-bbf7df.netlify.app/report.html | Static HTML contains `<form name="report-error" method="POST" data-netlify="true" netlify-honeypot="bot-field">`, a hidden `form-name=report-error`, the `bot-field` honeypot, and the `module`, `document`, `problem`, and optional `email` fields. No email address appears in the HTML. This is the markup Netlify needs to detect the form at deploy time. |
| Pass | https://admirable-concha-bbf7df.netlify.app/report.html?module=ASD3&document=Test | `200`. The static HTML is unchanged by query parameters; the served `js/report.js` reads `module` and `document` to fill the fields in a browser. |

**Unverified, not failed:** An interactive browser was unavailable, so I could not click the language switch, inspect rendered Arabic/search/module content, click Open or Download, or confirm form prefilling and submission. No test report was submitted. Netlify's dashboard registration and email notification settings cannot be inferred from HTML alone.

**Failures observed:** None in the HTTP checks above.
