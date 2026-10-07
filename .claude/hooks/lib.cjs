// Template-authored hook helpers. No external dependencies.
const fs = require('node:fs');
const path = require('node:path');
async function input() {
  let raw = '';
  for await (const chunk of process.stdin) {
    raw += chunk;
    if (raw.length > 1048576) throw new Error('Hook input exceeds 1 MiB');
  }
  return raw.trim() ? JSON.parse(raw) : {};
}
function root(data) {
  return fs.realpathSync(path.resolve(process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd()));
}
function localFile(project, name) {
  if (typeof name !== 'string' || !name) return null;
  const requested = path.resolve(project, name);
  const file = fs.realpathSync(requested);
  const relative = path.relative(project, file);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) return null;
  return { file, relative: relative.split(path.sep).join('/') };
}
function context(event, text) {
  process.stdout.write(JSON.stringify({hookSpecificOutput: {hookEventName: event, additionalContext: text}}) + '\n');
}
module.exports = {input, root, localFile, context};
