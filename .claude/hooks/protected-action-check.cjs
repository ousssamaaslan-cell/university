// Template-authored optional PreToolUse check: protects listed vendor files from Write/Edit only.
const fs = require('node:fs');
const path = require('node:path');
const {input, root, localFile} = require('./lib.cjs');
(async () => {
  const data = await input();
  if (!['Write', 'Edit'].includes(data.tool_name)) return;
  const project = root(data);
  let target;
  try { target = localFile(project, data.tool_input?.file_path); } catch { return; }
  if (!target) return;
  const manifest = JSON.parse(fs.readFileSync(path.join(project, 'vendor-manifest.json'), 'utf8'));
  if (manifest.files.some(f => f.local_path === target.relative)) {
    process.stdout.write(JSON.stringify({hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny',
      permissionDecisionReason: 'This is an unchanged upstream source file. Put project changes in a separate adapter or project instruction file.'
    }}) + '\n');
  }
})().catch(() => {});
