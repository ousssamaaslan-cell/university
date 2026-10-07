// Read-only checks for the L2 static resource project. No npm packages required.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const errors = [];
const fail = message => errors.push(message);
const exists = relative => fs.existsSync(path.join(root, relative));
const isInside = (base, target) => {
  const relative = path.relative(base, target);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};
const readJson = relative => {
  try { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); }
  catch (error) { fail(`${relative}: missing or invalid JSON (${error.message})`); return null; }
};

for (const relative of [
  'AGENTS.md', '.claude/CLAUDE.md', '.claude/settings.json',
  'docs/project-brief.md', 'docs/design-system.md', 'docs/content-model.md',
  'templates/qa-report.md', 'README.md', 'NOTICE.md',
  'data', 'pdfs/S3', 'pdfs/S4', 'css', 'js', 'assets'
]) if (!exists(relative)) fail(`Missing ${relative}`);

if (exists('package.json')) fail('package.json exists, but this project is specified to have no site npm dependencies or build step.');

let verifiedVendorFiles = 0;
const manifest = readJson('vendor-manifest.json');
if (manifest && !Array.isArray(manifest.files)) fail('vendor-manifest.json: files must be an array');
for (const entry of manifest?.files || []) {
  if (typeof entry.local_path !== 'string' || !entry.local_path) { fail('Vendor entry has no local_path'); continue; }
  const target = path.resolve(root, entry.local_path);
  if (!isInside(root, target)) { fail(`Vendor path escapes project: ${entry.local_path}`); continue; }
  try {
    const bytes = fs.readFileSync(target);
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== entry.size_bytes || digest !== entry.sha256) fail(`Vendor file differs: ${entry.local_path}`);
    else verifiedVendorFiles++;
    if (!entry.modified && entry.git_blob_sha1) {
      const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      if (blob !== entry.git_blob_sha1) fail(`Upstream blob differs: ${entry.local_path}`);
    }
  } catch { fail(`Missing vendor file: ${entry.local_path}`); }
}

for (const relative of ['.claude/settings.json', '.claude/settings.optional.json']) {
  const settings = readJson(relative);
  for (const entries of Object.values(settings?.hooks || {})) {
    if (!Array.isArray(entries)) { fail(`${relative}: hook event must contain an array`); continue; }
    for (const entry of entries) for (const hook of entry.hooks || []) {
      const match = hook.command?.match(/\$\{CLAUDE_PROJECT_DIR\}\/([^"\s]+)/);
      if (!match || !exists(match[1])) fail(`${relative}: missing hook script in ${hook.command || '<empty command>'}`);
    }
  }
}

function frontmatter(relative, expectedName) {
  const text = fs.readFileSync(path.join(root, relative), 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) { fail(`${relative}: missing frontmatter`); return ''; }
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (name !== expectedName || !description) fail(`${relative}: expected name ${expectedName} and description`);
  return match[1];
}

const skillsRoot = path.join(root, '.claude/skills');
const skills = fs.readdirSync(skillsRoot, {withFileTypes: true})
  .filter(item => item.isDirectory() && fs.existsSync(path.join(skillsRoot, item.name, 'SKILL.md')))
  .map(item => item.name);
const expectedSkills = [
  'accessibility', 'add-resource', 'best-practices', 'core-web-vitals',
  'frontend-design', 'lp-brief', 'lp-build', 'lp-check', 'lp-handoff',
  'lp-performance', 'lp-plan', 'lp-polish', 'lp-release', 'lp-review',
  'lp-seo', 'performance', 'seo', 'web-design-guidelines',
  'web-quality-audit', 'webapp-testing'
];
for (const name of expectedSkills) if (!skills.includes(name)) fail(`Missing active skill: ${name}`);
for (const name of skills) {
  if (!expectedSkills.includes(name)) fail(`Unexpected active skill: ${name}`);
  frontmatter(`.claude/skills/${name}/SKILL.md`, name);
}
const agentsRoot = path.join(root, '.claude/agents');
const agents = fs.readdirSync(agentsRoot).filter(name => name.endsWith('.md'));
for (const name of ['design-reviewer.md', 'quality-reviewer.md']) if (!agents.includes(name)) fail(`Missing agent: ${name}`);
for (const file of agents) {
  if (!['design-reviewer.md', 'quality-reviewer.md'].includes(file)) fail(`Unexpected active agent: ${file}`);
  const meta = frontmatter(`.claude/agents/${file}`, file.slice(0, -3));
  for (const skill of [...meta.matchAll(/^\s+-\s+([a-z][a-z0-9-]+)\s*$/gm)].map(match => match[1])) {
    if (!skills.includes(skill)) fail(`${file}: missing preloaded skill ${skill}`);
  }
}

function checkCatalogue() {
  if (!exists('data/resources.json')) return {semesters: 0, modules: 0, resources: 0, status: 'not created yet'};
  const data = readJson('data/resources.json');
  if (!data) return {semesters: 0, modules: 0, resources: 0, status: 'invalid'};
  for (const key of ['semesters', 'modules', 'resources']) if (!Array.isArray(data[key])) fail(`data/resources.json: ${key} must be an array`);
  if (errors.some(error => error.includes('data/resources.json:') && error.includes('must be an array'))) return {status: 'invalid'};
  const semIds = new Set(), moduleIds = new Set(), resourceIds = new Set(), pdfPaths = new Set();
  const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  const ordered = value => Number.isInteger(value) && value >= 0;
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const localized = value => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 2 && text(value.fr) && text(value.ar);
  for (const item of data.semesters) {
    if (!item || !['S3', 'S4'].includes(item.id) || item.level !== 'L2' || !localized(item.label) || !ordered(item.order)) fail('Invalid semester record');
    if (semIds.has(item?.id)) fail(`Duplicate semester: ${item.id}`);
    semIds.add(item?.id);
  }
  for (const id of ['S3', 'S4']) if (!semIds.has(id)) fail(`Missing semester: ${id}`);
  for (const item of data.modules) {
    if (!item || !slug(item.id) || item.level !== 'L2' || !semIds.has(item.semester) || !localized(item.title) || !ordered(item.order)) fail(`Invalid module: ${item?.id || '<unknown>'}`);
    if (moduleIds.has(item?.id)) fail(`Duplicate module ID: ${item.id}`);
    moduleIds.add(item?.id);
  }
  const modulesById = new Map(data.modules.filter(item => item && typeof item === 'object').map(item => [item.id, item]));
  for (const item of data.resources) {
    const label = item?.id || '<unknown>';
    const module = modulesById.get(item?.module);
    if (!item || !slug(item.id) || item.level !== 'L2' || !module || module.semester !== item.semester || !localized(item.title) || !['exam', 'tutorial', 'exercise'].includes(item.type) || !ordered(item.order) || typeof item.hasSolution !== 'boolean') fail(`Invalid resource metadata: ${label}`);
    if (resourceIds.has(item?.id)) fail(`Duplicate resource ID: ${label}`);
    resourceIds.add(item?.id);
    const year = typeof item?.academicYear === 'string' && item.academicYear.match(/^([0-9]{4})-([0-9]{4})$/);
    if (!year || Number(year[2]) !== Number(year[1]) + 1) fail(`Invalid academic year: ${label}`);
    if (item?.type === 'exam' ? !['normal', 'rattrapage'].includes(item.session) : item?.session !== null) fail(`Invalid session: ${label}`);
    const expected = module ? `pdfs/${item.semester}/${item.module}/` : '';
    if (typeof item?.pdfPath !== 'string' || !item.pdfPath.startsWith(expected) || !/^pdfs\/(S3|S4)\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(item.pdfPath)) {
      fail(`Invalid PDF path: ${label}`);
      continue;
    }
    if (pdfPaths.has(item.pdfPath)) fail(`Duplicate PDF path: ${item.pdfPath}`);
    pdfPaths.add(item.pdfPath);
    const target = path.resolve(root, item.pdfPath);
    const pdfRoot = path.join(root, 'pdfs');
    if (!isInside(pdfRoot, target)) { fail(`PDF path escapes pdfs/: ${label}`); continue; }
    try {
      const real = fs.realpathSync(target);
      if (!isInside(pdfRoot, real) || !fs.statSync(real).isFile() || fs.statSync(real).size === 0) fail(`Missing, empty, or unsafe PDF: ${item.pdfPath}`);
    } catch { fail(`Missing PDF: ${item.pdfPath}`); }
  }
  return {semesters: data.semesters.length, modules: data.modules.length, resources: data.resources.length, status: 'checked'};
}

const catalogue = checkCatalogue();
const result = {ok: errors.length === 0, active_skills: skills.length, agents: agents.length, verified_vendor_files: verifiedVendorFiles, catalogue, errors};
if (require.main === module) {
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
module.exports = {result};
