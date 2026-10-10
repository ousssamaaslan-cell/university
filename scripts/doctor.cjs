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

// The admin dashboard at /admin, and the former Decap form kept at /admin/decap as a temporary backup.
const adminFiles = [
  'admin/index.html', 'admin/admin.css', 'admin/admin.js', 'admin/ui.js', 'admin/form.js', 'admin/documents.js', 'admin/local-preview.js',
  'admin/catalogue-rules.js', 'admin/github-commit.js', 'admin/netlify-auth.js', 'admin/admin-flow.js',
  'admin/decap/index.html', 'admin/decap/admin.js', 'admin/decap/decap-cms.js'
];
for (const relative of [
  'AGENTS.md', '.claude/CLAUDE.md', '.claude/settings.json',
  'docs/project-brief.md', 'docs/design-system.md', 'docs/content-model.md',
  'templates/qa-report.md', 'README.md', 'NOTICE.md',
  'data', 'pdfs/S3', 'pdfs/S4', 'css', 'js', 'assets',
  ...adminFiles
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
  if (!exists('data/resources.json')) return {semesters: 0, modules: 0, resources: 0, samples: 0, status: 'not created yet'};
  const data = readJson('data/resources.json');
  if (!data) return {semesters: 0, modules: 0, resources: 0, samples: 0, status: 'invalid'};
  for (const key of ['semesters', 'modules', 'resources']) if (!Array.isArray(data[key])) fail(`data/resources.json: ${key} must be an array`);
  if (errors.some(error => error.includes('data/resources.json:') && error.includes('must be an array'))) return {status: 'invalid'};
  for (const key of Object.keys(data)) if (!['semesters', 'modules', 'resources'].includes(key)) fail(`data/resources.json: unknown top-level key "${key}"`);
  const semIds = new Set(), moduleIds = new Set(), resourceIds = new Set(), pdfPaths = new Set();
  // Build-phase sample records (docs/project-brief.md) are counted so they are not forgotten before publication.
  let samples = 0;
  const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  const ordered = value => Number.isInteger(value) && value >= 0;
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const localized = value => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === 2 && text(value.fr) && text(value.ar);
  const extraKeys = (item, allowed) => Object.keys(item || {}).filter(key => !allowed.includes(key));
  // Type-specific resource fields, as tabulated in docs/content-model.md.
  const baseFields = ['id', 'level', 'semester', 'module', 'type', 'title', 'pdfPath', 'order'];
  const typeFields = {
    cours: {required: ['chapter'], optional: ['academicYear']},
    td: {required: ['number', 'hasCorrection'], optional: ['academicYear']},
    tp: {required: ['number', 'hasCorrection'], optional: ['academicYear']},
    examen: {required: ['academicYear', 'session', 'examKind', 'hasCorrection'], optional: []}
  };
  const fieldChecks = {
    chapter: value => Number.isInteger(value) && value >= 0,
    number: value => Number.isInteger(value) && value >= 1,
    hasCorrection: value => typeof value === 'boolean',
    academicYear: value => {
      const year = typeof value === 'string' && value.match(/^([0-9]{4})-([0-9]{4})$/);
      return Boolean(year) && Number(year[2]) === Number(year[1]) + 1;
    },
    session: value => ['normal', 'rattrapage'].includes(value),
    examKind: value => ['emd', 'final', 'rattrapage', 'controle'].includes(value)
  };
  for (const item of data.semesters) {
    if (!item || !['S3', 'S4'].includes(item.id) || item.level !== 'L2' || !localized(item.label) || !ordered(item.order) || extraKeys(item, ['id', 'level', 'label', 'order']).length) fail('Invalid semester record');
    if (semIds.has(item?.id)) fail(`Duplicate semester: ${item.id}`);
    semIds.add(item?.id);
  }
  for (const id of ['S3', 'S4']) if (!semIds.has(id)) fail(`Missing semester: ${id}`);
  for (const item of data.modules) {
    if (!item || !slug(item.id) || item.level !== 'L2' || !semIds.has(item.semester) || !localized(item.title) || !ordered(item.order) || extraKeys(item, ['id', 'level', 'semester', 'abbr', 'title', 'order']).length) fail(`Invalid module: ${item?.id || '<unknown>'}`);
    if (typeof item?.abbr !== 'string' || !/^[A-Z][A-Z0-9]*$/.test(item.abbr) || item.abbr.toLowerCase() !== item.id) fail(`Module abbr must be capitals and match its lowercase ID: ${item?.id || '<unknown>'}`);
    if (moduleIds.has(item?.id)) fail(`Duplicate module ID: ${item.id}`);
    moduleIds.add(item?.id);
  }
  const modulesById = new Map(data.modules.filter(item => item && typeof item === 'object').map(item => [item.id, item]));
  for (const item of data.resources) {
    const label = item?.id || '<unknown>';
    const module = modulesById.get(item?.module);
    const fields = typeFields[item?.type];
    if (!item || !slug(item.id) || item.level !== 'L2' || !module || module.semester !== item.semester || !localized(item.title) || !fields || !ordered(item.order)) fail(`Invalid resource metadata: ${label}`);
    if (resourceIds.has(item?.id)) fail(`Duplicate resource ID: ${label}`);
    resourceIds.add(item?.id);
    if (fields) {
      for (const key of fields.required) if (!fieldChecks[key](item[key])) fail(`Missing or invalid ${key} for a ${item.type} resource: ${label}`);
      for (const key of fields.optional) if (key in item && !fieldChecks[key](item[key])) fail(`Invalid ${key}: ${label}`);
      for (const key of extraKeys(item, [...baseFields, ...fields.required, ...fields.optional])) fail(`Field ${key} does not belong to a ${item.type} resource: ${label}`);
      if (item.examKind === 'rattrapage' && item.session !== 'rattrapage') fail(`A rattrapage exam must be in the rattrapage session: ${label}`);
    }
    const expected = module ? `pdfs/${item.semester}/${item.module}/` : '';
    if (typeof item?.pdfPath !== 'string' || !item.pdfPath.startsWith(expected) || !/^pdfs\/(S3|S4)\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(item.pdfPath)) {
      fail(`Invalid PDF path: ${label}`);
      continue;
    }
    if (pdfPaths.has(item.pdfPath)) fail(`Duplicate PDF path: ${item.pdfPath}`);
    pdfPaths.add(item.pdfPath);
    const sampleId = typeof item.id === 'string' && item.id.startsWith('sample-');
    if (sampleId !== path.basename(item.pdfPath).startsWith('sample-')) fail(`Sample ID and PDF filename must both start with sample-: ${label}`);
    if (sampleId) samples++;
    // docs/content-model.md: an ID starts with its module's ID, and the PDF is named after the ID.
    if (typeof item.id === 'string' && !item.id.replace(/^sample-/, '').startsWith(`${item.module}-`)) fail(`Resource ID must start with its module ID (${item.module}-): ${label}`);
    if (path.basename(item.pdfPath) !== `${item.id}.pdf`) fail(`PDF must be named after its resource ID (${item.id}.pdf): ${item.pdfPath}`);
    const target = path.resolve(root, item.pdfPath);
    const pdfRoot = path.join(root, 'pdfs');
    if (!isInside(pdfRoot, target)) { fail(`PDF path escapes pdfs/: ${label}`); continue; }
    try {
      const real = fs.realpathSync(target);
      if (!isInside(pdfRoot, real) || !fs.statSync(real).isFile() || fs.statSync(real).size === 0) fail(`Missing, empty, or unsafe PDF: ${item.pdfPath}`);
      else if (fs.readFileSync(real).subarray(0, 5).toString('latin1') !== '%PDF-') fail(`Not a PDF file: ${item.pdfPath}`);
      // Windows ignores letter case in file names; Netlify's Linux host does not. Compare every folder and file name exactly.
      let folder = root;
      for (const name of item.pdfPath.split('/')) {
        if (!fs.readdirSync(folder).includes(name)) { fail(`Letter case differs between the catalogue and the disk: ${item.pdfPath}`); break; }
        folder = path.join(folder, name);
      }
    } catch { fail(`Missing PDF: ${item.pdfPath}`); }
  }
  // A PDF that no record uses would still be published with the site. This catches a file left
  // behind when its record is removed, including the placeholder PDFs of the sample data.
  const walk = folder => fs.readdirSync(folder, {withFileTypes: true}).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)]
  );
  if (exists('pdfs')) for (const file of walk(path.join(root, 'pdfs'))) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    if (path.basename(file) !== '.gitkeep' && !pdfPaths.has(relative)) fail(`File under pdfs/ that no catalogue record uses: ${relative}`);
  }
  return {semesters: data.semesters.length, modules: data.modules.length, resources: data.resources.length, samples, status: 'checked'};
}

// js/i18n.js asks for the same keys in French and in Arabic. A key missing from one language
// shows the other language's text, or the bare key, to students.
function checkLabels() {
  if (!exists('js/i18n.js')) return;
  const text = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
  const start = text.search(/^ {2}fr: \{$/m), middle = text.search(/^ {2}ar: \{$/m), end = text.search(/^const pluralRules/m);
  if (start === -1 || middle === -1 || end === -1) { fail('js/i18n.js: could not find the fr and ar blocks to compare their keys'); return; }
  const keysOf = block => new Set([...block.matchAll(/^ {4}'([^']+)':/gm)].map(match => match[1]));
  const fr = keysOf(text.slice(start, middle)), ar = keysOf(text.slice(middle, end));
  for (const key of fr) if (!ar.has(key)) fail(`js/i18n.js: label "${key}" has no Arabic text`);
  for (const key of ar) if (!fr.has(key)) fail(`js/i18n.js: label "${key}" has no French text`);
}

// Netlify publishes the allowlisted copy made by scripts/publish.cjs, never the repository root,
// which also holds project documents and instructions. The admin form logs in through Netlify,
// which keeps the GitHub OAuth secret; a secret or token pasted into a published file would be public.
function checkPublication() {
  const config = exists('netlify.toml') ? fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8') : '';
  if (!/^publish\s*=\s*"\.netlify-publish"\s*$/m.test(config)) fail('netlify.toml: publish must be ".netlify-publish", the allowlisted copy');
  if (!/^command\s*=\s*"node scripts\/doctor\.cjs && node scripts\/publish\.cjs"\s*$/m.test(config)) fail('netlify.toml: the build command must run the doctor, then the publish copy');
  const scripts = exists('js') ? fs.readdirSync(path.join(root, 'js')).filter(name => name.endsWith('.js')).map(name => `js/${name}`) : [];
  // Every page, script and stylesheet under admin/, so a file added there later is read too.
  // The vendored admin/decap/decap-cms.js is not read here: its hash is verified against vendor-manifest.json above.
  const filesUnder = folder => fs.readdirSync(path.join(root, folder), {withFileTypes: true}).flatMap(entry =>
    entry.isDirectory() ? filesUnder(`${folder}/${entry.name}`) : [`${folder}/${entry.name}`]
  );
  const admin = exists('admin') ? filesUnder('admin').filter(file => /\.(html|js|css)$/.test(file) && file !== 'admin/decap/decap-cms.js') : [];
  const published = [
    'netlify.toml', 'index.html', 'module.html', 'search.html', 'report.html', '404.html', 'css/styles.css', 'data/resources.json',
    ...admin, ...scripts
  ];
  const secrets = [
    [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'a GitHub token'],
    [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'a GitHub token'],
    [/\bnfp_[A-Za-z0-9]{20,}/, 'a Netlify token'],
    [/client[_-]?secret/i, 'an OAuth client secret']
  ];
  for (const relative of published) {
    if (!exists(relative)) continue;
    const text = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const [pattern, name] of secrets) if (pattern.test(text)) fail(`${relative}: contains what looks like ${name}; published files must hold no credential`);
  }
  // The admin is for the maintainer: no student page or script mentions it, and search engines are told to leave it out.
  for (const relative of ['index.html', 'module.html', 'search.html', 'report.html', '404.html', ...scripts]) {
    if (exists(relative) && /\badmin\b/i.test(fs.readFileSync(path.join(root, relative), 'utf8'))) fail(`${relative}: student pages must not link to or mention the admin`);
  }
  if (!/^for\s*=\s*"\/admin\/\*"\s*\r?\n\[headers\.values\]\s*\r?\nX-Robots-Tag\s*=\s*"noindex, nofollow"\s*$/m.test(config)) fail('netlify.toml: /admin/* must be sent with X-Robots-Tag "noindex, nofollow"');
  for (const relative of admin.filter(file => file.endsWith('.html'))) {
    if (!/<meta name="robots" content="noindex, nofollow"/.test(fs.readFileSync(path.join(root, relative), 'utf8'))) fail(`${relative}: an admin page must carry <meta name="robots" content="noindex, nofollow">`);
  }
}

const catalogue = checkCatalogue();
checkLabels();
checkPublication();
const result = {ok: errors.length === 0, active_skills: skills.length, agents: agents.length, verified_vendor_files: verifiedVendorFiles, catalogue, errors};
if (require.main === module) {
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
module.exports = {result};
