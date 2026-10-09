# Sources and authorship

External skills were copied from immutable upstream commits. Their source paths,
URLs, licenses, original Git blob hashes, current locations, current sizes and
SHA-256 hashes are recorded in `vendor-manifest.json`. Entries marked `modified`
have small project-specific documentation or frontmatter corrections; the other
entries remain byte-for-byte copies. The license beside each Anthropic skill
applies to that skill. Marketing Skills and Web Quality Skills carry the MIT
licenses in `licenses/`. Vercel Agent Skills declares MIT in its upstream README;
an unchanged copy is in `licenses/` because the pinned repository has no
standalone license file.

Anthropic skills: Anthropic, PBC, Apache-2.0.
Marketing Skills: Corey Haines, MIT.
Web Quality Skills: Addy Osmani, MIT.
Vercel Agent Skills: Vercel, MIT as declared in the upstream README.
Decap CMS: Netlify and the Decap CMS contributors, MIT.

The admin form runs Decap CMS 3.16.3. `admin/decap-cms.js` is the browser bundle
from the npm package `decap-cms@3.16.3`, unchanged; the package's checksum, the
file's hash, and the release commit are in `vendor-manifest.json`. Its licence is
`admin/decap-cms.LICENSE.txt`, and the notices of the libraries built into the
bundle are in `admin/decap-cms.js.LICENSE.txt`. Both are published beside it.

The `lp-*` workflows, reviewer definitions, rules, hooks, doctor script, project
documents, and templates are adapted for this university project. Marketing and
conversion skill files are archived under `.claude/_unused/`. Upstream licenses
continue to govern their content.

Avoid formatting copied upstream material as a side effect of unrelated work.
Document deliberate changes and update the current hashes in the vendor manifest.
