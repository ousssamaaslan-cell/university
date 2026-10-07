// Template-authored PostToolUse hook. Only uses an already installed local Prettier.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {input, root, localFile, context} = require('./lib.cjs');
(async () => {
  const data = await input();
  if (!['Write', 'Edit'].includes(data.tool_name)) return;
  const project = root(data);
  let target;
  try { target = localFile(project, data.tool_input?.file_path); } catch { return; }
  if (!target || !fs.statSync(target.file).isFile()) return;
  const rel = target.relative;
  if (/^(\.claude|\.agents|licenses|node_modules|dist|\.next|\.astro)(\/|$)/.test(rel)) return;
  if (!/\.(astro|html|css|scss|sass|less|js|jsx|ts|tsx|mjs|cjs|json|md|mdx|yaml|yml|vue|svelte)$/.test(rel)) return;
  const candidates = ['node_modules/prettier/bin/prettier.cjs', 'node_modules/prettier/bin-prettier.js'];
  const bin = candidates.map(p => path.join(project, p)).find(p => fs.existsSync(p));
  if (!bin) return;
  const args = [bin, '--write', '--ignore-unknown'];
  if (fs.existsSync(path.join(project, '.prettierignore'))) args.push('--ignore-path', path.join(project, '.prettierignore'));
  args.push('--', target.file);
  const result = spawnSync(process.execPath, args, {cwd: project, encoding: 'utf8', timeout: 20000, maxBuffer: 1048576, shell: false});
  if (result.error || result.status !== 0) {
    context('PostToolUse', 'Local Prettier did not finish successfully for ' + rel + '. Run the project formatter manually and inspect its output.');
  }
})().catch(() => { console.error('Formatter hook could not inspect this edit. Run the project formatter manually if needed.'); });
