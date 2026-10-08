// Writes a one-page placeholder PDF for every build-phase `sample-` resource in data/resources.json.
// No npm packages required. Output is deterministic, so rerunning it changes nothing in Git.
// Run from anywhere: node scripts/make-sample-pdfs.cjs
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data/resources.json'), 'utf8'));
const modulesById = new Map(catalogue.modules.map(item => [item.id, item]));

const typeLabels = {cours: 'Cours', td: 'TD', tp: 'TP', examen: 'Examen'};
const sessionLabels = {normal: 'Session normale', rattrapage: 'Session de rattrapage'};
const kindLabels = {emd: 'EMD', final: 'Examen final', rattrapage: 'Rattrapage', controle: 'Contrôle'};

// The built-in PDF fonts cover Latin text only, so the page is written in French.
const toLatin1 = value => String(value)
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/œ/g, 'oe')
  .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');
const pdfString = value => '(' + toLatin1(value).replace(/([\\()])/g, '\\$1') + ')';

function wrap(text, width) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > width) { lines.push(line); line = word; }
    else line = line ? line + ' ' + word : word;
  }
  if (line) lines.push(line);
  return lines;
}

function describe(resource) {
  const module = modulesById.get(resource.module);
  const facts = [];
  if (resource.type === 'cours') facts.push(`Chapitre ${resource.chapter}`);
  if (resource.type === 'td' || resource.type === 'tp') facts.push(`${typeLabels[resource.type]} ${resource.number}`);
  if (resource.academicYear) facts.push(`Année universitaire ${resource.academicYear}`);
  if (resource.session) facts.push(sessionLabels[resource.session]);
  if (resource.examKind) facts.push(kindLabels[resource.examKind]);
  if ('hasCorrection' in resource) facts.push(resource.hasCorrection ? 'Avec corrigé' : 'Sans corrigé');
  return {
    heading: `${module.abbr} - ${typeLabels[resource.type]}`,
    moduleName: module.title.fr,
    title: resource.title.fr,
    facts
  };
}

function buildPdf(resource) {
  const {heading, moduleName, title, facts} = describe(resource);
  const text = [];
  let y = 770;
  const write = (font, size, value, gap) => {
    text.push(`BT /${font} ${size} Tf 60 ${y} Td ${pdfString(value)} Tj ET`);
    y -= gap;
  };
  write('F2', 20, "DOCUMENT D'EXEMPLE", 22);
  write('F1', 11, 'Fichier factice (placeholder) utilisé pendant la construction du site.', 15);
  write('F1', 11, "Ce n'est pas un document de l'université. Il sera remplacé ou supprimé.", 40);
  write('F2', 16, heading, 20);
  write('F1', 11, moduleName, 30);
  for (const line of wrap(title, 62)) write('F2', 13, line, 18);
  y -= 10;
  for (const fact of facts) write('F1', 11, fact, 16);
  y -= 14;
  write('F1', 9, `Identifiant : ${resource.id}`, 12);
  const stream = Buffer.from(text.join('\n'), 'latin1');

  const font = name => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    font('Helvetica'),
    font('Helvetica-Bold'),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, 'latin1'), stream, Buffer.from('\nendstream', 'latin1')]),
    `<< /Title ${pdfString(`Exemple - ${heading} - ${title}`)} >>`
  ];

  const chunks = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
  const offsets = [];
  let length = chunks[0].length;
  objects.forEach((body, index) => {
    offsets.push(length);
    const chunk = Buffer.concat([Buffer.from(`${index + 1} 0 obj\n`, 'latin1'), Buffer.isBuffer(body) ? body : Buffer.from(body, 'latin1'), Buffer.from('\nendobj\n', 'latin1')]);
    chunks.push(chunk);
    length += chunk.length;
  });
  const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`]
    .concat(offsets.map(offset => String(offset).padStart(10, '0') + ' 00000 n \n'))
    .concat(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${length}\n%%EOF\n`);
  chunks.push(Buffer.from(xref.join(''), 'latin1'));
  return Buffer.concat(chunks);
}

let written = 0;
for (const resource of catalogue.resources) {
  if (!resource.id.startsWith('sample-')) continue;
  if (!path.basename(resource.pdfPath).startsWith('sample-')) throw new Error(`${resource.id}: a sample PDF filename must start with sample-`);
  const target = path.resolve(root, resource.pdfPath);
  if (path.relative(path.join(root, 'pdfs'), target).startsWith('..')) throw new Error(`${resource.id}: pdfPath is outside pdfs/`);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, buildPdf(resource));
  written++;
}
console.log(`Wrote ${written} placeholder PDF(s).`);
