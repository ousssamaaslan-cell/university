// Netlify publishes this allowlisted copy, never the repository root.
// No site framework or npm package is needed; Node's built-in modules do the copy.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '.netlify-publish');
const inside = (parent, target) => target.startsWith(parent + path.sep);
if (!inside(root, output) || path.basename(output) !== '.netlify-publish') {
  throw new Error('Unsafe publish directory');
}

const published = new Set();

function add(relative) {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe publish path: ${relative}`);
  }
  const source = path.resolve(root, relative);
  const target = path.resolve(output, relative);
  if (!inside(root, source) || !inside(output, target)) throw new Error(`Path escapes publish roots: ${relative}`);
  if (fs.lstatSync(source).isSymbolicLink() || !fs.statSync(source).isFile()) throw new Error(`Not a regular site file: ${relative}`);
  if (!inside(root, fs.realpathSync(source))) throw new Error(`File escapes repository: ${relative}`);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
  published.add(relative.replaceAll('\\', '/'));
}

function addAssetTree(directory, extensions) {
  for (const entry of fs.readdirSync(path.join(root, directory), {withFileTypes: true})) {
    const relative = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in site assets: ${relative}`);
    if (entry.isDirectory()) addAssetTree(relative, extensions);
    else if (extensions.includes(path.extname(entry.name).toLowerCase())) add(relative);
  }
}

// The target was resolved and checked above. Reject a junction or symlink before deletion.
if (fs.existsSync(output) && (fs.lstatSync(output).isSymbolicLink() || !inside(root, fs.realpathSync(output)))) {
  throw new Error('Unsafe existing publish directory');
}
fs.rmSync(output, {recursive: true, force: true});
for (const file of ['index.html', 'module.html', 'search.html', 'report.html', '404.html']) add(file);
add('css/styles.css');
add('data/resources.json');
addAssetTree('js', ['.js']);
addAssetTree('assets', ['.svg', '.png', '.jpg', '.jpeg', '.webp', '.ico']);
// The admin dashboard at /admin, then the former Decap form kept at /admin/decap as a temporary backup.
// The files are named one by one, so nothing else placed in admin/ is published.
// Nothing here is secret: the GitHub login goes through Netlify, which keeps the OAuth secret.
for (const file of [
  'index.html', 'admin.css', 'admin.js', 'ui.js', 'form.js', 'documents.js', 'local-preview.js',
  'catalogue-rules.js', 'github-commit.js', 'netlify-auth.js', 'admin-flow.js',
  'decap/index.html', 'decap/admin.js',
  'decap/decap-cms.js', 'decap/decap-cms.js.LICENSE.txt', 'decap/decap-cms.LICENSE.txt'
]) add(`admin/${file}`);

const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data', 'resources.json'), 'utf8'));
for (const resource of catalogue.resources) {
  if (!/^pdfs\/(S3|S4)\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/.test(resource.pdfPath)) {
    throw new Error(`Unsafe PDF path: ${resource.pdfPath}`);
  }
  add(resource.pdfPath);
}

console.log(`Published ${published.size} site files in .netlify-publish:`);
for (const file of [...published].sort()) console.log(file);
