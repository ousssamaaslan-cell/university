// What the admin does to a change before it is committed to data/resources.json.
// It fills in what the maintainer never types (id, level, order, the PDF's folder and name),
// refuses what the form's dropdowns cannot prevent, and writes the file in its usual layout.
// The catalogue format is described in docs/content-model.md. node scripts/doctor.cjs checks the
// result again on every Netlify build, so a mistake here stops the build instead of reaching students.
//
// No page and no network are used here, so node scripts/test-admin.cjs runs the same code.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.L2CatalogueRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CATALOGUE_PATH = 'data/resources.json';
  // The four resource types, in the order module pages show them.
  const TYPES = ['cours', 'td', 'tp', 'examen'];
  const SESSIONS = ['normal', 'rattrapage'];
  const EXAM_KINDS = ['emd', 'final', 'rattrapage', 'controle'];
  // Where an exam goes inside its academic year when no order is typed: the order exams are sat in.
  const EXAM_KIND_ORDER = {controle: 1, emd: 2, final: 3, rattrapage: 4};
  // GitHub accepts larger files, but students download these on phones.
  const MAX_PDF_BYTES = 50 * 1000 * 1000;

  const blank = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  const text = value => (typeof value === 'string' ? value.trim() : '');
  const trimSlash = value => value.replace(/^\/+/, '');
  const fileName = path => path.slice(path.lastIndexOf('/') + 1);
  // The form's number field gives an integer; a string of digits is read as one too.
  const integer = (value, minimum) => {
    const number = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
    return Number.isInteger(number) && number >= minimum ? number : null;
  };
  const isAcademicYear = value => {
    const years = typeof value === 'string' && value.match(/^(\d{4})-(\d{4})$/);
    return Boolean(years) && Number(years[2]) === Number(years[1]) + 1;
  };

  // "2026-2027" from September on, "2025-2026" before: the year the teaching started in.
  function academicYearOf(date) {
    const start = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
    return `${start}-${start + 1}`;
  }

  // The choices of the academic-year list, newest first: this year and the 24 before it,
  // and any other year a document already has, so that opening an old document never loses it.
  function academicYears(today, resources) {
    const start = Number(academicYearOf(today).slice(0, 4));
    const years = new Set();
    for (let year = start; year > start - 25; year--) years.add(`${year}-${year + 1}`);
    for (const resource of resources) if (isAcademicYear(resource.academicYear)) years.add(resource.academicYear);
    return [...years].sort().reverse();
  }

  const byOrder = (a, b) => a.order - b.order;

  // Semesters, then each semester's modules, in the order the home page lists them.
  function modulesInOrder(catalogue) {
    const semesters = [...catalogue.semesters].sort((a, b) => byOrder(a, b) || a.label.fr.localeCompare(b.label.fr, 'fr'));
    return semesters.flatMap(semester => catalogue.modules
      .filter(module => module.semester === semester.id)
      .sort((a, b) => byOrder(a, b) || a.title.fr.localeCompare(b.title.fr, 'fr')));
  }

  // The display order of each type, the same as in js/catalogue.js and docs/content-model.md.
  const byTitle = (a, b) => a.title.fr.localeCompare(b.title.fr, 'fr');
  const newestYearFirst = (a, b) => (b.academicYear ?? '').localeCompare(a.academicYear ?? '');
  const bySheetNumber = (a, b) => a.number - b.number || newestYearFirst(a, b) || byOrder(a, b) || byTitle(a, b);
  const displayOrder = {
    cours: (a, b) => a.chapter - b.chapter || byOrder(a, b) || byTitle(a, b),
    td: bySheetNumber,
    tp: bySheetNumber,
    examen: (a, b) => newestYearFirst(a, b) || byOrder(a, b) || byTitle(a, b)
  };

  // The documents of one type in a module, in the order the module page lists them.
  function sortedResources(catalogue, moduleId, type) {
    return catalogue.resources.filter(resource => resource.module === moduleId && resource.type === type).sort(displayOrder[type]);
  }

  // The order of documents in the file: by module, by type, then as the module page lists them.
  function catalogueOrder(catalogue) {
    const moduleRank = new Map(modulesInOrder(catalogue).map((module, index) => [module.id, index]));
    return (a, b) => moduleRank.get(a.module) - moduleRank.get(b.module) ||
      TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || displayOrder[a.type](a, b);
  }

  // A short text that changes whenever the catalogue file does. The form carries the one it was
  // loaded with, so a form opened before somebody else's change cannot overwrite that change.
  async function fingerprint(raw) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // What the form receives in place of the file: the documents and the fingerprint.
  // Semesters and modules are not editable in the form, so they are not sent to it.
  async function forForm(raw) {
    return JSON.stringify({loadedFrom: await fingerprint(raw), resources: JSON.parse(raw).resources});
  }

  // "ASD3 · TD 3", from whatever the form already holds, to name a document in a message.
  function describe(source, module) {
    const parts = [module ? module.abbr : null];
    if (source.type === 'cours') parts.push(integer(source.chapter, 0) === null ? 'Cours' : `Cours, chapitre ${source.chapter}`);
    else if (source.type === 'td' || source.type === 'tp') parts.push(source.type.toUpperCase() + (integer(source.number, 1) === null ? '' : ` ${source.number}`));
    else if (source.type === 'examen') parts.push(isAcademicYear(source.academicYear) ? `Examen ${source.academicYear}` : 'Examen');
    return parts.filter(Boolean).join(' · ');
  }

  // One catalogue record, with its keys in the order docs/content-model.md shows them.
  function assemble(id, pdfPath, fields) {
    const record = {id, level: 'L2', semester: fields.semester, module: fields.module, type: fields.type};
    if (fields.type === 'cours') record.chapter = fields.chapter;
    if (fields.type === 'td' || fields.type === 'tp') record.number = fields.number;
    if (fields.academicYear) record.academicYear = fields.academicYear;
    if (fields.type === 'examen') {
      record.session = fields.session;
      record.examKind = fields.examKind;
    }
    record.title = fields.title;
    if (fields.type !== 'cours') record.hasCorrection = fields.hasCorrection;
    record.pdfPath = pdfPath;
    record.order = fields.order;
    return record;
  }

  const pdfPathOf = (fields, id) => `pdfs/${fields.semester}/${fields.module}/${id}.pdf`;

  // asd3-cours-ch02, asd3-td-03, asd3-examen-2024-2025-emd. A second document with the same
  // facts (two contrôles in one year, a correction kept as a separate PDF) ends in -2, -3...
  function newId(fields, takenIds, takenPaths) {
    const two = number => String(number).padStart(2, '0');
    const year = fields.academicYear ? `-${fields.academicYear}` : '';
    const stem = fields.type === 'cours' ? `${fields.module}-cours-ch${two(fields.chapter)}${year}`
      : fields.type === 'examen' ? `${fields.module}-examen-${fields.academicYear}-${fields.examKind}`
      : `${fields.module}-${fields.type}-${two(fields.number)}${year}`;
    let id = stem;
    for (let copy = 2; takenIds.has(id) || takenPaths.has(pdfPathOf(fields, id)); copy++) id = `${stem}-${copy}`;
    return id;
  }

  // Reads one document of the form. Returns its checked fields, or the list of what is wrong.
  function readItem(item, context) {
    const {modules, existing, uploads, seenIds, usedUploads} = context;
    const source = item && typeof item === 'object' ? item : {};
    const problems = [];
    const type = TYPES.includes(source.type) ? source.type : null;
    const module = modules.get(source.module) ?? null;
    const previous = blank(source.id) ? null : existing.get(source.id) ?? null;

    if (!type) problems.push('le type du document est inconnu');
    if (!blank(source.id) && !previous) problems.push(`l'identifiant « ${source.id} » n'existe pas dans le catalogue`);
    if (previous && seenIds.has(previous.id)) problems.push(`l'identifiant « ${previous.id} » apparaît deux fois`);
    if (previous) seenIds.add(previous.id);
    if (!module) problems.push('choisissez un module');
    else if (source.semester !== module.semester) problems.push(`le module ${module.abbr} appartient au semestre ${module.semester} : choisissez ${module.semester} dans « Semestre »`);
    // The ID and the PDF's folder come from the module and the type, and the ID never changes once published.
    if (previous && module && type && (previous.module !== module.id || previous.type !== type)) {
      problems.push("le module et le type d'un document déjà publié ne changent pas : supprimez ce document, puis ajoutez-le de nouveau");
    }

    const fields = {type, module: module?.id, semester: module?.semester};
    fields.title = {fr: text(source.title?.fr), ar: text(source.title?.ar)};
    if (!fields.title.fr) problems.push('le titre en français est vide');
    if (!fields.title.ar) problems.push('le titre en arabe est vide');

    if (type === 'cours') {
      fields.chapter = integer(source.chapter, 0);
      if (fields.chapter === null) problems.push('le numéro du chapitre doit être un nombre entier, à partir de 0');
    }
    if (type === 'td' || type === 'tp') {
      fields.number = integer(source.number, 1);
      if (fields.number === null) problems.push('le numéro de la série doit être un nombre entier, à partir de 1');
    }
    if (type === 'examen' || !blank(source.academicYear)) {
      if (isAcademicYear(source.academicYear)) fields.academicYear = source.academicYear;
      else problems.push("choisissez l'année universitaire");
    }
    if (type === 'examen') {
      fields.session = SESSIONS.includes(source.session) ? source.session : null;
      fields.examKind = EXAM_KINDS.includes(source.examKind) ? source.examKind : null;
      if (!fields.session) problems.push('choisissez la session');
      if (!fields.examKind) problems.push("choisissez la nature de l'examen");
      if (fields.examKind === 'rattrapage' && fields.session === 'normal') problems.push('un examen de rattrapage appartient à la session de rattrapage');
    }
    if (type && type !== 'cours') fields.hasCorrection = source.hasCorrection === true;

    if (blank(source.order)) fields.order = type === 'cours' ? fields.chapter : type === 'examen' ? EXAM_KIND_ORDER[fields.examKind] : fields.number;
    else {
      fields.order = integer(source.order, 0);
      if (fields.order === null) problems.push("l'ordre d'affichage doit être un nombre entier, à partir de 0");
    }

    // A file chosen in this form is waiting under the name it had on the maintainer's computer.
    const chosen = typeof source.pdfPath === 'string' ? trimSlash(source.pdfPath.trim()) : '';
    const upload = uploads.get(chosen) ?? null;
    if (upload) {
      if (usedUploads.has(chosen)) problems.push(`le fichier « ${upload.name} » est déjà choisi pour un autre document`);
      usedUploads.add(chosen);
      if (!upload.isPdf) problems.push(`« ${upload.name} » n'est pas un fichier PDF`);
      else if (upload.size > MAX_PDF_BYTES) problems.push(`« ${upload.name} » dépasse ${MAX_PDF_BYTES / 1e6} Mo`);
    } else if (!chosen) problems.push('choisissez le fichier PDF');
    else if (!previous || chosen !== previous.pdfPath) problems.push(`le fichier « ${fileName(chosen)} » doit être importé depuis ce formulaire`);

    return {problems, fields, previous, upload: upload ? chosen : null, name: describe(source, module)};
  }

  // Turns what the form wants to save into what must be committed.
  //   currentRaw  the catalogue file as it is in the repository now
  //   next        what the form sent: {resources: [...]}
  //   uploads     files chosen in the form: [{path, name, size, isPdf}], path being where the form staged each one
  // Returns {errors} when something must be corrected first; nothing may be committed then.
  // Otherwise: raw (the new file), writes [{from, to}] for PDFs, deletes [path], and the ids added, updated and removed.
  function prepareSave(currentRaw, next, uploads) {
    const current = JSON.parse(currentRaw);
    const items = next && Array.isArray(next.resources) ? next.resources : null;
    if (!items) return {errors: ["Le formulaire n'a pas transmis la liste des documents. Rechargez la page."]};

    const context = {
      modules: new Map(current.modules.map(module => [module.id, module])),
      existing: new Map(current.resources.map(resource => [resource.id, resource])),
      uploads: new Map(uploads.map(upload => [trimSlash(upload.path), upload])),
      seenIds: new Set(),
      usedUploads: new Set()
    };
    const errors = [];
    const kept = new Map();
    const added = [];
    items.forEach((item, index) => {
      const result = readItem(item, context);
      if (result.problems.length) errors.push(`Document n° ${index + 1}${result.name ? ` (${result.name})` : ''} : ${result.problems.join(' ; ')}.`);
      else if (result.previous) kept.set(result.previous.id, result);
      else added.push(result);
    });
    if (errors.length) return {errors};

    const plan = {errors: [], writes: [], deletes: [], added: [], updated: [], removed: []};
    // Documents keep the place they have in the file, so saving changes only what was edited.
    const resources = [];
    for (const previous of current.resources) {
      const result = kept.get(previous.id);
      if (!result) {
        plan.removed.push(previous.id);
        plan.deletes.push(previous.pdfPath);
        continue;
      }
      const record = assemble(previous.id, previous.pdfPath, result.fields);
      if (result.upload) plan.writes.push({from: result.upload, to: previous.pdfPath});
      if (result.upload || JSON.stringify(record) !== JSON.stringify(previous)) plan.updated.push(previous.id);
      resources.push(record);
    }
    // An ID freed by a removal in this same save is not reused: its PDF is being deleted in the same commit.
    const takenIds = new Set(context.existing.keys());
    const takenPaths = new Set(current.resources.map(resource => resource.pdfPath));
    const inOrder = catalogueOrder(current);
    for (const result of added) {
      const id = newId(result.fields, takenIds, takenPaths);
      const record = assemble(id, pdfPathOf(result.fields, id), result.fields);
      takenIds.add(id);
      takenPaths.add(record.pdfPath);
      plan.writes.push({from: result.upload, to: record.pdfPath});
      plan.added.push(id);
      // A new document goes where the site would list it among those of its module and type.
      const after = resources.findIndex(other => inOrder(record, other) < 0);
      resources.splice(after === -1 ? resources.length : after, 0, record);
    }

    plan.raw = JSON.stringify({semesters: current.semesters, modules: current.modules, resources}, null, 2) + '\n';
    plan.changed = plan.raw !== currentRaw || plan.writes.length > 0;
    return plan;
  }

  // "Admin: add asd3-td-03", "Admin: edit ...", "Admin: delete ...", or a count and one line per
  // document when several changed.
  function commitMessage(plan) {
    const part = (verb, ids) => (ids.length === 0 ? null : ids.length === 1 ? `${verb} ${ids[0]}` : `${verb} ${ids.length} documents`);
    const parts = [part('add', plan.added), part('edit', plan.updated), part('delete', plan.removed)].filter(Boolean);
    const lines = [...plan.added.map(id => `+ ${id}`), ...plan.updated.map(id => `~ ${id}`), ...plan.removed.map(id => `- ${id}`)];
    const subject = `Admin: ${parts.join(', ') || 'rewrite the catalogue in its usual layout'}`;
    return lines.length > 1 ? `${subject}\n\n${lines.join('\n')}` : subject;
  }

  return {
    CATALOGUE_PATH, TYPES, SESSIONS, EXAM_KINDS, MAX_PDF_BYTES,
    academicYearOf, academicYears, modulesInOrder, sortedResources, fingerprint, forForm, prepareSave, commitMessage
  };
});
