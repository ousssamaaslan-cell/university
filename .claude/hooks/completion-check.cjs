// Template-authored optional Stop hook. One reminder; no blocking decision.
const fs = require('node:fs');
const path = require('node:path');
const {input, root, context} = require('./lib.cjs');
(async () => {
  const data = await input();
  if (data.stop_hook_active) return;
  const project = root(data);
  const hasSite = ['package.json', 'index.html', 'src', 'app'].some(p => fs.existsSync(path.join(project, p)));
  if (hasSite && !fs.existsSync(path.join(project, 'docs/qa-report.md'))) {
    context('Stop', 'A site exists but docs/qa-report.md is missing. If implementation was completed, record checks performed and unavailable checks; a report alone does not prove they passed.');
  }
})().catch(() => {});
