// Template-authored SessionStart hook. Reports state; never installs dependencies.
const fs = require('node:fs');
const path = require('node:path');
const {input, root, context} = require('./lib.cjs');
(async () => {
  const data = await input(); const project = root(data);
  const notes = [];
  for (const file of ['docs/project-brief.md', 'docs/design-system.md', 'docs/content-model.md']) {
    const absolute = path.join(project, file);
    if (!fs.existsSync(absolute)) notes.push(`${file} is missing.`);
    else if (/\[.*TO CONFIRM.*\]/i.test(fs.readFileSync(absolute, 'utf8'))) notes.push(`${file} has facts to confirm.`);
  }
  const packagePath = path.join(project, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = Object.keys(pkg.scripts || {});
      if (scripts.length) notes.push('Available package scripts: ' + scripts.join(', ') + '. Inspect before running.');
    } catch { notes.push('package.json could not be parsed; inspect it before running project commands.'); }
  }
  if (notes.length) context('SessionStart', notes.join(' ') + ' Read the project documents and use /lp-brief when appropriate.');
})().catch(() => { console.error('Session check could not read project state. Inspect the project manually.'); });
