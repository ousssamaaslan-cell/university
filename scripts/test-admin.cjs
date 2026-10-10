// Checks the admin without a browser, without Netlify and without GitHub:
//   1. admin/catalogue-rules.js: what a save writes, and what it refuses;
//   2. admin/github-commit.js: the commit, against a stand-in for GitHub's API;
//   3. admin/netlify-auth.js: the login exchange, against a stand-in for the browser window;
//   4. scripts/doctor.cjs: it accepts what the admin commits and stops what must never be published.
// The first tests are those of the former Decap form at /admin/decap, which still saves through
// the same rules; the dashboard's own tests follow them.
// Run from anywhere: node scripts/test-admin.cjs. No npm packages required.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const rules = require('../admin/catalogue-rules.js');
const gitHubStore = require('../admin/github-commit.js');
const netlifyAuth = require('../admin/netlify-auth.js');
const flow = require('../admin/admin-flow.js');

const text = {fr: 'Titre', ar: 'عنوان'};
const serialize = catalogue => JSON.stringify(catalogue, null, 2) + '\n';

// A small catalogue of its own, so these checks do not depend on the documents currently published.
function fixture() {
  return {
    semesters: [
      {id: 'S3', level: 'L2', label: {fr: 'Semestre 3', ar: 'السداسي الثالث'}, order: 1},
      {id: 'S4', level: 'L2', label: {fr: 'Semestre 4', ar: 'السداسي الرابع'}, order: 2}
    ],
    modules: [
      {id: 'asd3', level: 'L2', semester: 'S3', abbr: 'ASD3', title: {fr: 'Algorithmique et Structures de Données 3', ar: 'الخوارزميات'}, order: 1},
      {id: 'ao', level: 'L2', semester: 'S3', abbr: 'AO', title: {fr: 'Architecture des Ordinateurs', ar: 'بنية الحواسيب'}, order: 2}
    ],
    resources: [
      {id: 'asd3-cours-ch01', level: 'L2', semester: 'S3', module: 'asd3', type: 'cours', chapter: 1, title: text, pdfPath: 'pdfs/S3/asd3/asd3-cours-ch01.pdf', order: 1},
      {id: 'asd3-td-01', level: 'L2', semester: 'S3', module: 'asd3', type: 'td', number: 1, title: text, hasCorrection: false, pdfPath: 'pdfs/S3/asd3/asd3-td-01.pdf', order: 1},
      {id: 'asd3-td-03', level: 'L2', semester: 'S3', module: 'asd3', type: 'td', number: 3, title: text, hasCorrection: true, pdfPath: 'pdfs/S3/asd3/asd3-td-03.pdf', order: 3},
      {id: 'asd3-examen-2024-2025-emd', level: 'L2', semester: 'S3', module: 'asd3', type: 'examen', academicYear: '2024-2025', session: 'normal', examKind: 'emd', title: text, hasCorrection: false, pdfPath: 'pdfs/S3/asd3/asd3-examen-2024-2025-emd.pdf', order: 2},
      {id: 'ao-cours-ch01', level: 'L2', semester: 'S3', module: 'ao', type: 'cours', chapter: 1, title: text, pdfPath: 'pdfs/S3/ao/ao-cours-ch01.pdf', order: 1}
    ]
  };
}

// What the form sends for a document: the fields of the form only, with a file staged under its own name.
const upload = name => ({path: `pdfs/${name}`, name, size: 1200, isPdf: true});
const formItem = (fields, file = 'scan.pdf') => ({semester: 'S3', module: 'asd3', title: {fr: ' Titre ', ar: 'عنوان'}, pdfPath: `pdfs/${file}`, ...fields});
const save = (catalogue, change, uploads = [upload('scan.pdf')]) => {
  const raw = serialize(catalogue);
  return rules.prepareSave(raw, {resources: change(JSON.parse(raw).resources)}, uploads);
};
const errorsOf = (fields, uploads) => save(fixture(), resources => [formItem(fields), ...resources], uploads).errors.join(' ');

test('saving without a change leaves the file exactly as it is', () => {
  for (const raw of [serialize(fixture()), fs.readFileSync(path.join(root, 'data/resources.json'), 'utf8')]) {
    const plan = rules.prepareSave(raw, {resources: JSON.parse(raw).resources}, []);
    assert.deepEqual(plan.errors, []);
    assert.equal(plan.raw, raw);
    assert.equal(plan.changed, false);
    assert.deepEqual([plan.writes, plan.deletes, plan.added, plan.updated, plan.removed], [[], [], [], [], []]);
  }
});

test('a new TD gets its ID, level, order, folder and file name', () => {
  const plan = save(fixture(), resources => [formItem({type: 'td', number: 2, hasCorrection: true}, 'Série N°2 (corrigé).pdf'), ...resources], [upload('Série N°2 (corrigé).pdf')]);
  assert.deepEqual(plan.errors, []);
  const saved = JSON.parse(plan.raw);
  assert.deepEqual(saved.resources.find(resource => resource.id === 'asd3-td-02'), {
    id: 'asd3-td-02', level: 'L2', semester: 'S3', module: 'asd3', type: 'td', number: 2,
    title: {fr: 'Titre', ar: 'عنوان'}, hasCorrection: true, pdfPath: 'pdfs/S3/asd3/asd3-td-02.pdf', order: 2
  });
  assert.deepEqual(plan.writes, [{from: 'pdfs/Série N°2 (corrigé).pdf', to: 'pdfs/S3/asd3/asd3-td-02.pdf'}]);
  assert.deepEqual(plan.added, ['asd3-td-02']);
  // It lands between TD 1 and TD 3, and nothing else in the file moves.
  assert.deepEqual(saved.resources.map(resource => resource.id), ['asd3-cours-ch01', 'asd3-td-01', 'asd3-td-02', 'asd3-td-03', 'asd3-examen-2024-2025-emd', 'ao-cours-ch01']);
  assert.deepEqual([saved.semesters, saved.modules], [fixture().semesters, fixture().modules]);
});

test('each type gets the fields of its type, in the usual key order', () => {
  const plan = save(fixture(), resources => [
    formItem({type: 'cours', chapter: 0, hasCorrection: true, session: 'normal'}, 'a.pdf'),
    formItem({type: 'tp', number: 4, academicYear: '2023-2024', order: 9}, 'b.pdf'),
    formItem({type: 'examen', module: 'ao', academicYear: '2025-2026', session: 'rattrapage', examKind: 'rattrapage', hasCorrection: true, number: 3}, 'c.pdf'),
    formItem({type: 'examen', academicYear: '2024-2025', session: 'normal', examKind: 'controle'}, 'd.pdf'),
    ...resources
  ], ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf'].map(upload));
  assert.deepEqual(plan.errors, []);
  const byId = new Map(JSON.parse(plan.raw).resources.map(resource => [resource.id, resource]));
  assert.deepEqual(Object.keys(byId.get('asd3-cours-ch00')), ['id', 'level', 'semester', 'module', 'type', 'chapter', 'title', 'pdfPath', 'order']);
  assert.deepEqual(Object.keys(byId.get('asd3-tp-04-2023-2024')), ['id', 'level', 'semester', 'module', 'type', 'number', 'academicYear', 'title', 'hasCorrection', 'pdfPath', 'order']);
  assert.deepEqual(Object.keys(byId.get('ao-examen-2025-2026-rattrapage')), ['id', 'level', 'semester', 'module', 'type', 'academicYear', 'session', 'examKind', 'title', 'hasCorrection', 'pdfPath', 'order']);
  assert.equal(byId.get('asd3-cours-ch00').order, 0);
  assert.equal(byId.get('asd3-tp-04-2023-2024').order, 9);
  assert.equal(byId.get('asd3-tp-04-2023-2024').hasCorrection, false);
  assert.equal(byId.get('ao-examen-2025-2026-rattrapage').order, 4);
  assert.equal(byId.get('asd3-examen-2024-2025-controle').order, 1);
  assert.equal(byId.get('ao-examen-2025-2026-rattrapage').pdfPath, 'pdfs/S3/ao/ao-examen-2025-2026-rattrapage.pdf');
  // The contrôle is listed before the EMD of the same year, as on the module page.
  const ids = [...byId.keys()];
  assert.ok(ids.indexOf('asd3-examen-2024-2025-controle') < ids.indexOf('asd3-examen-2024-2025-emd'));
});

test('an empty optional field is left out, not written empty', () => {
  const plan = save(fixture(), resources => [formItem({type: 'td', number: 5, academicYear: '', order: '', hasCorrection: undefined}), ...resources]);
  const record = JSON.parse(plan.raw).resources.find(resource => resource.id === 'asd3-td-05');
  assert.equal('academicYear' in record, false);
  assert.equal(record.order, 5);
  assert.equal(record.hasCorrection, false);
});

test('a second document with the same facts ends in -2, and a removed ID is not reused in the same save', () => {
  const twice = save(fixture(), resources => [formItem({type: 'td', number: 3}, 'a.pdf'), formItem({type: 'td', number: 3}, 'b.pdf'), ...resources], [upload('a.pdf'), upload('b.pdf')]);
  assert.deepEqual(twice.added, ['asd3-td-03-2', 'asd3-td-03-3']);
  const swapped = save(fixture(), resources => [formItem({type: 'td', number: 1}), ...resources.filter(resource => resource.id !== 'asd3-td-01')]);
  assert.deepEqual([swapped.added, swapped.removed], [['asd3-td-01-2'], ['asd3-td-01']]);
  assert.deepEqual(swapped.deletes, ['pdfs/S3/asd3/asd3-td-01.pdf']);
  assert.deepEqual(swapped.writes, [{from: 'pdfs/scan.pdf', to: 'pdfs/S3/asd3/asd3-td-01-2.pdf'}]);
});

test('what the dropdowns cannot prevent is refused, and nothing is planned', () => {
  assert.match(errorsOf({type: 'td', number: 2, semester: 'S4'}), /le module ASD3 appartient au semestre S3/);
  assert.match(errorsOf({type: 'td', number: 2, module: 'inconnu'}), /choisissez un module/);
  assert.match(errorsOf({type: 'examen', academicYear: '2024-2025', session: 'normal', examKind: 'rattrapage'}), /appartient à la session de rattrapage/);
  assert.match(errorsOf({type: 'examen', session: 'normal', examKind: 'emd'}), /choisissez l'année universitaire/);
  assert.match(errorsOf({type: 'examen', academicYear: '2024-2026', session: 'normal', examKind: 'emd'}), /choisissez l'année universitaire/);
  assert.match(errorsOf({type: 'examen', academicYear: '2024-2025', session: 'été', examKind: 'partiel'}), /choisissez la session.*choisissez la nature/);
  assert.match(errorsOf({type: 'td', number: 0}), /le numéro de la série doit être un nombre entier, à partir de 1/);
  assert.match(errorsOf({type: 'td', number: 2.5}), /le numéro de la série/);
  assert.match(errorsOf({type: 'cours', chapter: -1}), /le numéro du chapitre/);
  assert.match(errorsOf({type: 'td', number: 2, order: -3}), /l'ordre d'affichage/);
  assert.match(errorsOf({type: 'td', number: 2, title: {fr: '  ', ar: 'عنوان'}}), /le titre en français est vide/);
  assert.match(errorsOf({type: 'td', number: 2, title: {fr: 'Titre'}}), /le titre en arabe est vide/);
  assert.match(errorsOf({type: 'quiz', number: 2}), /le type du document est inconnu/);
  assert.match(errorsOf({type: 'td', number: 2, id: 'asd3-td-99'}), /l'identifiant « asd3-td-99 » n'existe pas/);
  assert.match(errorsOf({type: 'td', number: 2, pdfPath: ''}), /choisissez le fichier PDF/);
  assert.match(errorsOf({type: 'td', number: 2, pdfPath: 'pdfs/S3/asd3/asd3-td-01.pdf'}), /doit être importé depuis ce formulaire/);
  assert.match(errorsOf({type: 'td', number: 2, pdfPath: 'https://example.org/td.pdf'}), /doit être importé depuis ce formulaire/);
  assert.match(errorsOf({type: 'td', number: 2}, [{...upload('scan.pdf'), isPdf: false}]), /« scan.pdf » n'est pas un fichier PDF/);
  assert.match(errorsOf({type: 'td', number: 2}, [{...upload('scan.pdf'), size: rules.MAX_PDF_BYTES + 1}]), /dépasse 50 Mo/);
  const shared = save(fixture(), resources => [formItem({type: 'td', number: 2}), formItem({type: 'td', number: 4}), ...resources]);
  assert.match(shared.errors.join(' '), /Document n° 2 .* est déjà choisi pour un autre document/);
  const refused = save(fixture(), resources => [formItem({type: 'td', number: 0}), ...resources]);
  assert.deepEqual(Object.keys(refused), ['errors']);
  assert.match(refused.errors[0], /^Document n° 1 \(ASD3 · TD\) : /);
  assert.deepEqual(rules.prepareSave(serialize(fixture()), {}, []).errors.length, 1);
});

test('a published document keeps its ID, module, type and PDF path', () => {
  const edited = save(fixture(), resources => resources.map(resource => (resource.id === 'asd3-td-03' ? {...resource, number: 4, title: {fr: 'Nouveau titre', ar: 'عنوان جديد'}} : resource)), []);
  assert.deepEqual([edited.errors, edited.updated, edited.writes, edited.deletes], [[], ['asd3-td-03'], [], []]);
  const record = JSON.parse(edited.raw).resources.find(resource => resource.id === 'asd3-td-03');
  assert.deepEqual([record.number, record.title.fr, record.pdfPath], [4, 'Nouveau titre', 'pdfs/S3/asd3/asd3-td-03.pdf']);

  const replaced = save(fixture(), resources => resources.map(resource => (resource.id === 'asd3-td-03' ? {...resource, pdfPath: 'pdfs/scan.pdf'} : resource)));
  assert.deepEqual([replaced.errors, replaced.updated], [[], ['asd3-td-03']]);
  assert.deepEqual(replaced.writes, [{from: 'pdfs/scan.pdf', to: 'pdfs/S3/asd3/asd3-td-03.pdf'}]);
  assert.equal(replaced.raw, serialize(fixture()));

  const moved = save(fixture(), resources => resources.map(resource => (resource.id === 'asd3-td-03' ? {...resource, module: 'ao'} : resource)), []);
  assert.match(moved.errors.join(' '), /le module et le type d'un document déjà publié ne changent pas/);
  const doubled = save(fixture(), resources => [resources[0], ...resources], []);
  assert.match(doubled.errors.join(' '), /apparaît deux fois/);
});

test('removing a document removes its PDF in the same change', () => {
  const plan = save(fixture(), resources => resources.filter(resource => resource.module !== 'ao'), []);
  assert.deepEqual([plan.errors, plan.removed, plan.deletes, plan.writes], [[], ['ao-cours-ch01'], ['pdfs/S3/ao/ao-cours-ch01.pdf'], []]);
  assert.equal(JSON.parse(plan.raw).resources.length, 4);
  assert.equal(JSON.parse(plan.raw).modules.length, 2);
});

test('the commit message names what changed', () => {
  const message = plan => rules.commitMessage({added: [], updated: [], removed: [], ...plan});
  assert.equal(message({added: ['asd3-td-02']}), 'Admin: add asd3-td-02');
  assert.equal(message({updated: ['asd3-td-03']}), 'Admin: edit asd3-td-03');
  assert.equal(message({removed: ['asd3-td-03']}), 'Admin: delete asd3-td-03');
  assert.equal(message({added: ['a', 'b'], removed: ['c']}), 'Admin: add 2 documents, delete c\n\n+ a\n+ b\n- c');
  assert.equal(message({}), 'Admin: rewrite the catalogue in its usual layout');
});

test('the academic-year list starts with the current year and keeps the years already used', () => {
  assert.equal(rules.academicYearOf(new Date(2026, 7, 31)), '2025-2026');
  assert.equal(rules.academicYearOf(new Date(2026, 8, 1)), '2026-2027');
  const years = rules.academicYears(new Date(2026, 9, 9), [{academicYear: '1998-1999'}, {academicYear: 'invalide'}, {}]);
  assert.equal(years[0], '2026-2027');
  assert.equal(years.length, 26);
  assert.equal(years.at(-1), '1998-1999');
});

test('the form receives the documents and a fingerprint of the file it was loaded from', async () => {
  const raw = serialize(fixture());
  const sent = JSON.parse(await rules.forForm(raw));
  assert.deepEqual(Object.keys(sent), ['loadedFrom', 'resources']);
  assert.equal(sent.loadedFrom, await rules.fingerprint(raw));
  assert.match(sent.loadedFrom, /^[0-9a-f]{64}$/);
  assert.notEqual(sent.loadedFrom, await rules.fingerprint(raw + ' '));
});

// A stand-in for the part of GitHub's REST API that admin/github-commit.js uses. It keeps blobs,
// trees and commits in memory and refuses what GitHub refuses: a bad token, a write by an account
// that may only read, removing a file that is not there, and moving the branch to a commit that
// does not descend from it. Two accounts exist: "secret-token" may write, "reader-token" may not.
function fakeGitHub(files) {
  const blobs = new Map(), trees = new Map(), commits = new Map(), folders = new Map(), requests = [], hooks = [];
  const accounts = {'token secret-token': {login: 'responsable', push: true}, 'token reader-token': {login: 'lecteur', push: false}};
  let counter = 0;
  const sha = () => (++counter).toString(16).padStart(40, '0');
  // A file's content gets the name Git gives it; trees and commits get a number.
  const gitSha = bytes => crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const store = (map, value) => { const id = map === blobs ? gitSha(value) : sha(); map.set(id, value); return id; };
  const firstTree = new Map(Object.entries(files).map(([file, content]) => [file, store(blobs, Buffer.from(content))]));
  const state = {head: store(commits, {tree: store(trees, firstTree), parents: [], message: 'start'})};
  const answer = (status, body) => new Response(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body), {status});
  const descendsFrom = (commit, ancestor) => commit === ancestor || (commits.get(commit)?.parents ?? []).some(parent => descendsFrom(parent, ancestor));
  // Trees are kept flat here (path -> blob). GitHub lists one folder at a time, each folder with a sha of its own.
  const folderSha = (tree, name) => {
    const key = `${tree}:${name}`;
    if (!folders.has(key)) folders.set(key, sha());
    return folders.get(key);
  };

  async function fetch(url, options) {
    requests.push({url, ...options});
    const account = accounts[options.headers.Authorization];
    if (!account) return answer(401, {message: 'Bad credentials'});
    const route = `${options.method} ${url.replace('https://api.github.test', '').replace('/repos/owner/site', '')}`;
    const body = options.body ? JSON.parse(options.body) : null;
    // Something a test wants to happen just before one request is answered, once.
    const hook = hooks.findIndex(item => item.route === route);
    if (hook !== -1) hooks.splice(hook, 1)[0].run();
    let match;
    if (route === 'GET /user') return answer(200, {login: account.login});
    if (route === 'GET ') return answer(200, {full_name: 'owner/site', permissions: {pull: true, push: account.push}});
    // GitHub hides a write behind "Not Found" when the account may only read.
    if (options.method !== 'GET' && !account.push) return answer(404, {message: 'Not Found'});
    if ((match = route.match(/^GET \/git\/trees\/(\w+)(\?recursive=1)?$/))) {
      const folder = [...folders].find(([, id]) => id === match[1]);
      if (folder) {
        const [tree, name] = folder[0].split(':');
        const inside = [...trees.get(tree)].filter(([file]) => file.startsWith(`${name}/`));
        return answer(200, {tree: inside.map(([file, blob]) => ({path: file.slice(name.length + 1), type: 'blob', sha: blob, size: blobs.get(blob).length}))});
      }
      const top = new Map();
      for (const [file, blob] of trees.get(match[1])) {
        const name = file.split('/')[0];
        top.set(name, name === file ? {path: name, type: 'blob', sha: blob, size: blobs.get(blob).length} : {path: name, type: 'tree', sha: folderSha(match[1], name)});
      }
      return answer(200, {tree: [...top.values()]});
    }
    if ((match = route.match(/^GET \/git\/blobs\/(\w+)$/))) return blobs.has(match[1]) ? answer(200, blobs.get(match[1])) : answer(404, {message: 'Not Found'});
    if (route === 'GET /git/ref/heads/main') return answer(200, {object: {sha: state.head}});
    if ((match = route.match(/^GET \/contents\/(.+)\?ref=(\w+)$/))) {
      const blob = trees.get(commits.get(match[2]).tree).get(match[1]);
      return blob ? answer(200, blobs.get(blob).toString('utf8')) : answer(404, {message: 'Not Found'});
    }
    if ((match = route.match(/^GET \/git\/commits\/(\w+)$/))) return answer(200, {sha: match[1], tree: {sha: commits.get(match[1]).tree}});
    if (route === 'POST /git/blobs') return answer(201, {sha: store(blobs, Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8'))});
    if (route === 'POST /git/trees') {
      const tree = new Map(trees.get(body.base_tree));
      for (const entry of body.tree) {
        if (entry.mode !== '100644' || entry.type !== 'blob') return answer(422, {message: 'Unexpected tree entry'});
        if (entry.sha === null && !tree.delete(entry.path)) return answer(422, {message: 'GitRPC::BadObjectState'});
        if (entry.sha !== null) tree.set(entry.path, entry.sha);
      }
      return answer(201, {sha: store(trees, tree)});
    }
    if (route === 'POST /git/commits') return answer(201, {sha: store(commits, {tree: body.tree, parents: body.parents, message: body.message})});
    if (route === 'PATCH /git/refs/heads/main') {
      if (body.force !== false || !descendsFrom(body.sha, state.head)) return answer(422, {message: 'Update is not a fast forward'});
      state.head = body.sha;
      return answer(200, {object: {sha: state.head}});
    }
    return answer(404, {message: `No route for ${route}`});
  }

  const filesAtHead = () => Object.fromEntries([...trees.get(commits.get(state.head).tree)].map(([file, blob]) => [file, blobs.get(blob).toString('utf8')]));
  // Somebody else's commit: edit receives the catalogue and may change it.
  const commitElsewhere = (edit = () => {}) => {
    const tree = new Map(trees.get(commits.get(state.head).tree));
    const catalogue = JSON.parse(blobs.get(tree.get('data/resources.json')).toString('utf8'));
    edit(catalogue);
    tree.set('data/resources.json', store(blobs, Buffer.from(serialize(catalogue))));
    state.head = store(commits, {tree: store(trees, tree), parents: [state.head], message: 'another change'});
    return state.head;
  };
  return {
    fetch, requests, filesAtHead, state, commits, commitElsewhere,
    moveBranchElsewhere: () => { state.head = store(commits, {tree: commits.get(state.head).tree, parents: [state.head], message: 'another change'}); },
    before: (route, run) => hooks.push({route, run}),
    history: () => { const list = []; for (let id = state.head; id; id = commits.get(id).parents[0]) list.push(commits.get(id).message.split('\n')[0]); return list; }
  };
}

const connect = (github, token = 'secret-token') => gitHubStore.create({fetch: github.fetch, apiRoot: 'https://api.github.test', repo: 'owner/site', branch: 'main', getToken: async () => token});
const startFiles = () => ({'data/resources.json': serialize(fixture()), 'pdfs/S3/asd3/asd3-td-01.pdf': '%PDF-old', 'pdfs/S3/ao/ao-cours-ch01.pdf': '%PDF-ao', 'README.md': 'readme'});

test('GitHub: the catalogue, the new PDF and the removed PDF go into one commit', async () => {
  const github = fakeGitHub(startFiles());
  const store = connect(github);
  const current = await store.read();
  assert.equal(current.raw, serialize(fixture()));
  const before = github.state.head;
  const plan = save(fixture(), resources => [formItem({type: 'td', number: 2}), ...resources.filter(resource => resource.module !== 'ao')]);
  await store.commit({
    head: current.head, raw: plan.raw, deletes: plan.deletes, message: rules.commitMessage(plan),
    files: plan.writes.map(write => ({path: write.to, base64: Buffer.from('%PDF-1.4 nouveau').toString('base64')}))
  });
  const files = github.filesAtHead();
  assert.deepEqual(Object.keys(files).sort(), ['README.md', 'data/resources.json', 'pdfs/S3/asd3/asd3-td-01.pdf', 'pdfs/S3/asd3/asd3-td-02.pdf']);
  assert.equal(files['data/resources.json'], plan.raw);
  assert.equal(files['pdfs/S3/asd3/asd3-td-02.pdf'], '%PDF-1.4 nouveau');
  assert.equal(files['README.md'], 'readme');
  const commit = github.commits.get(github.state.head);
  assert.deepEqual(commit.parents, [before]);
  assert.equal(commit.message, 'Admin: add asd3-td-02, delete ao-cours-ch01\n\n+ asd3-td-02\n- ao-cours-ch01');
  // Arabic titles survive the round trip, and no answer may come from the browser's cache.
  assert.equal(JSON.parse(files['data/resources.json']).resources[0].title.ar, 'عنوان');
  assert.ok(github.requests.every(request => request.cache === 'no-store'));
});

test('GitHub: a branch that moved during the save is left alone', async () => {
  const github = fakeGitHub(startFiles());
  const store = connect(github);
  const current = await store.read();
  github.moveBranchElsewhere();
  const moved = github.state.head;
  await assert.rejects(store.commit({head: current.head, raw: 'x', files: [], deletes: [], message: 'm'}), /Le dépôt a changé pendant l'enregistrement/);
  assert.equal(github.state.head, moved);
  assert.equal(github.filesAtHead()['data/resources.json'], serialize(fixture()));
});

test('GitHub: a refused session, a missing session and a dead connection are explained', async () => {
  await assert.rejects(connect(fakeGitHub(startFiles()), 'expired').read(), /GitHub ne reconnaît plus votre session/);
  await assert.rejects(connect(fakeGitHub(startFiles()), null).read(), /Session GitHub introuvable/);
  const offline = gitHubStore.create({fetch: async () => { throw new TypeError('Failed to fetch'); }, apiRoot: 'https://api.github.test', repo: 'owner/site', branch: 'main', getToken: async () => 'secret-token'});
  await assert.rejects(offline.read(), /GitHub est injoignable/);
  const github = fakeGitHub(startFiles());
  const current = await connect(github).read();
  await assert.rejects(connect(github).commit({head: current.head, raw: 'x', files: [], deletes: ['pdfs/S3/asd3/absent.pdf'], message: 'm'}), /GitHub a refusé la demande \(422 : GitRPC::BadObjectState\)/);
});

// ---------- The dashboard at /admin ----------

const rejection = async promise => {
  try { await promise; } catch (error) { return error; }
  throw new Error('The promise was expected to be rejected');
};

test('GitHub: the account and its right to write are read; each refusal says what kind it is', async () => {
  const github = fakeGitHub(startFiles());
  assert.deepEqual(await connect(github).user(), {login: 'responsable'});
  assert.equal(await connect(github).canWrite(), true);
  assert.deepEqual(await connect(github, 'reader-token').user(), {login: 'lecteur'});
  assert.equal(await connect(github, 'reader-token').canWrite(), false);

  assert.equal((await rejection(connect(github, 'expired').user())).kind, 'session');
  assert.equal((await rejection(connect(github, null).read())).kind, 'session');
  const offline = gitHubStore.create({fetch: async () => { throw new TypeError('Failed to fetch'); }, apiRoot: 'https://api.github.test', repo: 'owner/site', branch: 'main', getToken: async () => 'secret-token'});
  assert.equal((await rejection(offline.read())).kind, 'network');

  // An account that may only read: the list loads, a save is refused as a lack of access, and nothing moves.
  const reader = connect(github, 'reader-token');
  const current = await reader.read();
  const refused = await rejection(reader.commit({head: current.head, raw: current.raw, files: [], deletes: [], message: 'm'}));
  assert.equal(refused.kind, 'access');
  assert.equal(github.state.head, current.head);

  // The token travels in the Authorization header only: never in an address, never in a body.
  for (const request of github.requests) {
    assert.equal(request.url.includes('secret-token'), false);
    assert.equal((request.body ?? '').includes('secret-token'), false);
  }
});

test('GitHub: only the catalogue and PDFs in their module folder can be written or removed', async () => {
  const github = fakeGitHub(startFiles());
  const store = connect(github);
  const current = await store.read();
  const before = github.requests.length;
  const escapes = [
    'pdfs/../README.md', 'pdfs/S3/asd3/../../../README.md', '../pdfs/S3/asd3/a.pdf', '/pdfs/S3/asd3/a.pdf', 'pdfs\\S3\\asd3\\a.pdf',
    'README.md', 'data/resources.json', 'js/home.js', 'admin/admin.js', 'netlify.toml', 'pdfs/a.pdf', 'pdfs/S3/a.pdf',
    'pdfs/S5/asd3/a.pdf', 'pdfs/S3/asd3/sous-dossier/a.pdf', 'pdfs/S3/asd3/a.txt', 'pdfs/S3/asd3/A.pdf', 'pdfs/S3/asd3/a b.pdf', 'pdfs/S3/asd3/.pdf', ''
  ];
  for (const escape of escapes) {
    assert.equal(gitHubStore.isPdfPath(escape), false, escape);
    const written = await rejection(store.commit({head: current.head, raw: current.raw, files: [{path: escape, base64: 'JVBERi0='}], deletes: [], message: 'm'}));
    const removed = await rejection(store.commit({head: current.head, raw: current.raw, files: [], deletes: [escape], message: 'm'}));
    assert.deepEqual([written.kind, removed.kind], ['path', 'path'], escape);
  }
  // Each one was refused before any request left for GitHub.
  assert.equal(github.requests.length, before);
  assert.equal(github.state.head, current.head);
  assert.equal(gitHubStore.isPdfPath('pdfs/S3/asd3/asd3-td-03.pdf'), true);
  assert.equal(gitHubStore.isPdfPath('pdfs/S4/poo2/poo2-examen-2024-2025-emd-2.pdf'), true);
});

// A stand-in for the browser window during the login: it records the window that was opened and
// lets a test post messages and run the timers by hand.
function fakeWindow({blocked = false} = {}) {
  const listeners = new Set();
  const timers = new Map();
  let nextTimer = 0;
  const popup = {closed: false, received: [], postMessage(data, origin) { this.received.push({data, origin}); }, close() { this.closed = true; }, focus() {}};
  const window = {
    screen: {width: 1280, height: 800},
    opened: null,
    open(address, name, features) { this.opened = {address, name, features}; return blocked ? null : popup; },
    addEventListener: (type, listener) => { if (type === 'message') listeners.add(listener); },
    removeEventListener: (type, listener) => listeners.delete(listener),
    setInterval: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
    clearInterval: id => timers.delete(id)
  };
  return {
    window, popup, listeners,
    post: (data, origin = 'https://api.netlify.com') => { for (const listener of [...listeners]) listener({data, origin}); },
    runTimers: () => { for (const callback of [...timers.values()]) callback(); }
  };
}

test('login: the Netlify window is opened for this site and scope, greeted, and its token returned', async () => {
  const browser = fakeWindow();
  const login = netlifyAuth.create({window: browser.window, siteId: 'exemple.netlify.app'}).login({scope: 'public_repo'});
  assert.equal(browser.window.opened.address, 'https://api.netlify.com/auth?provider=github&site_id=exemple.netlify.app&scope=public_repo');
  assert.equal(browser.window.opened.name, 'Netlify Authorization');

  // Messages from anywhere else are ignored, and so is a result that comes before the greeting.
  browser.post('authorization:github:success:{"token":"stolen"}', 'https://evil.example');
  browser.post('authorizing:github', 'https://evil.example');
  browser.post('authorization:github:success:{"token":"early"}');
  browser.post({not: 'a string'});
  assert.deepEqual(browser.popup.received, []);

  browser.post('authorizing:github');
  assert.deepEqual(browser.popup.received, [{data: 'authorizing:github', origin: 'https://api.netlify.com'}]);
  browser.post('authorization:github:success:{"token":"abc123","provider":"github"}');
  assert.equal(await login, 'abc123');
  assert.equal(browser.popup.closed, true);
  assert.equal(browser.listeners.size, 0);
});

test('login: a blocked window, a refusal and a closed window are told apart', async () => {
  const blocked = fakeWindow({blocked: true});
  assert.equal((await rejection(netlifyAuth.create({window: blocked.window, siteId: 'a.netlify.app'}).login({scope: 'public_repo'}))).kind, 'blocked');

  for (const answer of ['authorization:github:error:{"message":"access_denied"}', 'authorization:github:success:{"provider":"github"}', 'authorization:github:success:pas du JSON']) {
    const browser = fakeWindow();
    const login = netlifyAuth.create({window: browser.window, siteId: 'a.netlify.app'}).login({scope: 'public_repo'});
    browser.post('authorizing:github');
    browser.post(answer);
    assert.equal((await rejection(login)).kind, 'refused', answer);
    assert.equal(browser.listeners.size, 0);
  }

  const closed = fakeWindow();
  const login = netlifyAuth.create({window: closed.window, siteId: 'a.netlify.app'}).login({scope: 'public_repo'});
  closed.runTimers();
  assert.equal(closed.listeners.size, 1, 'an open window keeps the login waiting');
  closed.popup.closed = true;
  closed.runTimers();
  closed.runTimers();
  assert.equal((await rejection(login)).kind, 'cancelled');
  assert.equal(closed.listeners.size, 0);
});

// The dashboard asks for one change at a time: planChange turns it into what to commit, and
// admin-flow.js commits it on the branch as it is at that moment.
const plan = (catalogue, change, files = null) => rules.planChange(serialize(catalogue), change, files);
const record = (catalogue, id) => catalogue.resources.find(resource => resource.id === id);
const without = (catalogue, ...ids) => ({...catalogue, resources: catalogue.resources.filter(resource => !ids.includes(resource.id))});
const publish = (github, change, readPdf = null) => flow.publish({store: connect(github), rules, change, readPdf});

test('dashboard, delete: the record and its PDF leave together, and nothing else in the file moves', () => {
  const start = fixture();
  const one = plan(start, {action: 'delete', documents: [record(start, 'asd3-td-01')]});
  assert.deepEqual([one.errors, one.removed, one.deletes, one.writes, one.added, one.updated, one.changed], [[], ['asd3-td-01'], ['pdfs/S3/asd3/asd3-td-01.pdf'], [], [], [], true]);
  assert.equal(one.raw, serialize(without(start, 'asd3-td-01')));
  assert.equal(rules.commitMessage(one), 'Admin: delete asd3-td-01');

  // Several at once: one change, named in the order of the catalogue whatever the order of the ticks.
  const several = plan(start, {action: 'delete', documents: [record(start, 'ao-cours-ch01'), record(start, 'asd3-examen-2024-2025-emd'), record(start, 'asd3-cours-ch01')]});
  assert.deepEqual(several.removed, ['asd3-cours-ch01', 'asd3-examen-2024-2025-emd', 'ao-cours-ch01']);
  assert.deepEqual(several.deletes, ['pdfs/S3/asd3/asd3-cours-ch01.pdf', 'pdfs/S3/asd3/asd3-examen-2024-2025-emd.pdf', 'pdfs/S3/ao/ao-cours-ch01.pdf']);
  assert.equal(several.raw, serialize(without(start, 'ao-cours-ch01', 'asd3-examen-2024-2025-emd', 'asd3-cours-ch01')));
  assert.equal(rules.commitMessage(several), 'Admin: delete 3 documents\n\n- asd3-cours-ch01\n- asd3-examen-2024-2025-emd\n- ao-cours-ch01');

  // A record whose PDF the repository does not hold is still removed; there is no file to remove.
  const known = new Map([['pdfs/S3/asd3/asd3-td-01.pdf', {sha: 'a'}]]);
  const repair = plan(start, {action: 'delete', documents: [record(start, 'asd3-td-01'), record(start, 'asd3-td-03')]}, known);
  assert.deepEqual([repair.removed, repair.deletes], [['asd3-td-01', 'asd3-td-03'], ['pdfs/S3/asd3/asd3-td-01.pdf']]);
});

test('dashboard, delete: a list that is out of date is refused, and nothing is planned', () => {
  const start = fixture();
  const shown = record(start, 'asd3-td-01');
  const gone = plan(without(start, 'asd3-td-01'), {action: 'delete', documents: [shown]});
  assert.deepEqual([gone.code, Object.keys(gone).sort()], ['stale', ['code', 'errors']]);
  assert.match(gone.errors[0], /asd3-td-01 n'est plus dans le catalogue/);
  const retitled = fixture();
  record(retitled, 'asd3-td-01').title = {fr: 'Autre titre', ar: 'عنوان آخر'};
  const moved = plan(retitled, {action: 'delete', documents: [shown]});
  assert.equal(moved.code, 'stale');
  assert.match(moved.errors[0], /asd3-td-01 a été modifié ailleurs/);
  assert.equal(plan(start, {action: 'delete', documents: []}).code, 'invalid');
  assert.equal(plan(start, {action: 'rename'}).code, 'invalid');
});

test('dashboard: a file gets the name Git gives it, and travels as base64', async () => {
  assert.equal(await flow.gitBlobSha(new Uint8Array()), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  assert.equal(await flow.gitBlobSha(new TextEncoder().encode('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');
  const bytes = crypto.randomBytes(100003);
  assert.equal(flow.toBase64(new Uint8Array(bytes)), bytes.toString('base64'));
  assert.equal(flow.startsLikePdf(new TextEncoder().encode('%PDF-1.7')), true);
  assert.equal(flow.startsLikePdf(new TextEncoder().encode(' %PDF-1.7')), false);
  assert.equal(flow.startsLikePdf(new TextEncoder().encode('%PDF')), false);
});

test('dashboard, delete on GitHub: one commit removes the records and their PDFs', async () => {
  const github = fakeGitHub(startFiles());
  const start = fixture();
  const before = github.state.head;
  const result = await publish(github, {action: 'delete', documents: [record(start, 'ao-cours-ch01'), record(start, 'asd3-td-01'), record(start, 'asd3-td-03')]});
  assert.deepEqual([result.changed, result.attempts], [true, 1]);
  const files = github.filesAtHead();
  // asd3-td-03 had no PDF in this repository: its record goes, and no removal is asked for a file that is not there.
  assert.deepEqual(Object.keys(files).sort(), ['README.md', 'data/resources.json']);
  assert.equal(files['data/resources.json'], serialize(without(start, 'ao-cours-ch01', 'asd3-td-01', 'asd3-td-03')));
  assert.deepEqual(github.commits.get(github.state.head).parents, [before]);
  assert.equal(github.commits.get(github.state.head).message, 'Admin: delete 3 documents\n\n- asd3-td-01\n- asd3-td-03\n- ao-cours-ch01');
  assert.equal(result.commit, github.state.head);
});

test('dashboard: when the branch moved, the change is read again, applied again and committed once more', async () => {
  // Before the save: somebody else committed after the page was loaded. The save starts from the branch as it is now.
  const earlier = fakeGitHub(startFiles());
  const start = fixture();
  earlier.commitElsewhere(catalogue => { catalogue.resources = catalogue.resources.filter(resource => resource.id !== 'asd3-cours-ch01'); });
  const first = await publish(earlier, {action: 'delete', documents: [record(start, 'asd3-td-01')]});
  assert.equal(first.attempts, 1);
  assert.equal(earlier.filesAtHead()['data/resources.json'], serialize(without(start, 'asd3-cours-ch01', 'asd3-td-01')));

  // During the save: the branch moves between the read and the commit. One more try, on the new branch.
  const github = fakeGitHub(startFiles());
  let theirs;
  github.before('PATCH /git/refs/heads/main', () => { theirs = github.commitElsewhere(catalogue => { catalogue.resources = catalogue.resources.filter(resource => resource.id !== 'ao-cours-ch01'); }); });
  const result = await publish(github, {action: 'delete', documents: [record(start, 'asd3-td-01')]});
  assert.deepEqual([result.changed, result.attempts], [true, 2]);
  // Both changes are there, ours on top of theirs, and theirs was not overwritten.
  assert.equal(github.filesAtHead()['data/resources.json'], serialize(without(start, 'ao-cours-ch01', 'asd3-td-01')));
  assert.deepEqual(github.commits.get(github.state.head).parents, [theirs]);
  assert.deepEqual(github.history(), ['Admin: delete asd3-td-01', 'another change', 'start']);
  assert.equal(github.requests.filter(request => request.method === 'PATCH').length, 2);
  assert.ok(github.requests.filter(request => request.method === 'PATCH').every(request => JSON.parse(request.body).force === false));
});

test('dashboard: a branch that moves twice stops the save, and a change that no longer applies is not forced', async () => {
  const start = fixture();
  const github = fakeGitHub(startFiles());
  github.before('PATCH /git/refs/heads/main', () => github.commitElsewhere());
  github.before('PATCH /git/refs/heads/main', () => github.commitElsewhere());
  const twice = await rejection(publish(github, {action: 'delete', documents: [record(start, 'asd3-td-01')]}));
  assert.equal(twice.kind, 'conflict');
  assert.deepEqual(github.history(), ['another change', 'another change', 'start']);
  assert.equal(github.filesAtHead()['data/resources.json'], serialize(start));
  assert.equal(github.filesAtHead()['pdfs/S3/asd3/asd3-td-01.pdf'], '%PDF-old');

  // The other commit removed the very document being deleted: the second try finds nothing to do and says so.
  const other = fakeGitHub(startFiles());
  other.before('PATCH /git/refs/heads/main', () => other.commitElsewhere(catalogue => { catalogue.resources = catalogue.resources.filter(resource => resource.id !== 'asd3-td-01'); }));
  const stale = await rejection(publish(other, {action: 'delete', documents: [record(start, 'asd3-td-01')]}));
  assert.equal(stale.kind, 'stale');
  assert.match(stale.problems[0], /n'est plus dans le catalogue/);
  assert.deepEqual(other.history(), ['another change', 'start']);

  // A lost connection on the very last request leaves the outcome unknown, and the error says so.
  const cut = fakeGitHub(startFiles());
  const store = gitHubStore.create({
    fetch: (url, options) => (options.method === 'PATCH' ? Promise.reject(new TypeError('Failed to fetch')) : cut.fetch(url, options)),
    apiRoot: 'https://api.github.test', repo: 'owner/site', branch: 'main', getToken: async () => 'secret-token'
  });
  const lost = await rejection(flow.publish({store, rules, change: {action: 'delete', documents: [record(start, 'asd3-td-01')]}}));
  assert.deepEqual([lost.kind, lost.uncertain], ['network', true]);
  const early = await rejection(connect(cut, 'expired').read());
  assert.equal(early.uncertain, undefined);
});

// The doctor reads the project folder it lives in, so it is run on a throwaway copy of the project.
const pdfBytes = Buffer.from('%PDF-1.4\n% fichier de test pour scripts/test-admin.cjs\n%%EOF\n', 'latin1');

function projectCopy(t) {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'l2-admin-test-'));
  t.after(() => fs.rmSync(copy, {recursive: true, force: true}));
  const skipped = ['.git', '.netlify-publish', '.playwright-mcp', '.impeccable', 'node_modules'];
  fs.cpSync(root, copy, {recursive: true, filter: source => !skipped.includes(path.relative(root, source).split(path.sep)[0])});
  const file = relative => path.join(copy, relative);
  return {
    read: relative => fs.readFileSync(file(relative), 'utf8'),
    write(relative, content) { fs.mkdirSync(path.dirname(file(relative)), {recursive: true}); fs.writeFileSync(file(relative), content); },
    // unlinkSync, not rmSync: Node 24 on Windows leaves a file in place when its name has an accent.
    remove: relative => fs.unlinkSync(file(relative)),
    doctor() {
      const run = spawnSync(process.execPath, [file('scripts/doctor.cjs')], {encoding: 'utf8'});
      return {...JSON.parse(run.stdout), exitCode: run.status};
    },
    // What admin.js does with a plan, written to disk instead of committed.
    apply(plan) {
      this.write('data/resources.json', plan.raw);
      for (const write of plan.writes) this.write(write.to, pdfBytes);
      for (const removed of plan.deletes) this.remove(removed);
    }
  };
}

test('the doctor accepts what the admin commits: additions, then a replacement, an edit and a removal', t => {
  const project = projectCopy(t);
  const module = JSON.parse(project.read('data/resources.json')).modules[0];
  const item = (fields, file) => ({semester: module.semester, module: module.id, title: {fr: 'Document de test', ar: 'وثيقة اختبار'}, pdfPath: `pdfs/${file}`, ...fields});
  const first = rules.prepareSave(project.read('data/resources.json'), {resources: [
    item({type: 'cours', chapter: 12}, 'a.pdf'),
    item({type: 'td', number: 12, hasCorrection: true}, 'b.pdf'),
    item({type: 'tp', number: 12, academicYear: '2024-2025'}, 'c.pdf'),
    item({type: 'examen', academicYear: '2025-2026', session: 'rattrapage', examKind: 'rattrapage'}, 'd.pdf'),
    ...JSON.parse(project.read('data/resources.json')).resources
  ]}, ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf'].map(upload));
  assert.deepEqual(first.errors, []);
  assert.equal(first.added.length, 4);
  project.apply(first);
  const afterAdding = project.doctor();
  assert.deepEqual([afterAdding.errors, afterAdding.exitCode], [[], 0]);

  const [cours, td, tp] = first.added;
  const second = rules.prepareSave(project.read('data/resources.json'), {resources: JSON.parse(project.read('data/resources.json')).resources
    .filter(resource => resource.id !== tp)
    .map(resource => (resource.id === cours ? {...resource, pdfPath: 'pdfs/a.pdf'} : resource.id === td ? {...resource, title: {fr: 'Titre corrigé', ar: 'عنوان مصحح'}} : resource))
  }, [upload('a.pdf')]);
  assert.deepEqual([second.errors, second.updated.sort(), second.removed], [[], [cours, td].sort(), [tp]]);
  project.apply(second);
  const afterChanging = project.doctor();
  assert.deepEqual([afterChanging.errors, afterChanging.exitCode], [[], 0]);
});

test('the doctor stops what the admin must never commit', t => {
  const project = projectCopy(t);
  const original = project.read('data/resources.json');
  const module = JSON.parse(original).modules[0];
  const folder = `pdfs/${module.semester}/${module.id}`;
  const good = {id: `${module.id}-td-12`, level: 'L2', semester: module.semester, module: module.id, type: 'td', number: 12, title: {fr: 'Document de test', ar: 'وثيقة اختبار'}, hasCorrection: false, pdfPath: `${folder}/${module.id}-td-12.pdf`, order: 12};
  const cases = {
    // Unmodified Decap would write only the form's fields, and leave the file where it was staged.
    'the form as Decap alone would save it': {record: {type: 'td', semester: module.semester, module: module.id, number: 12, title: good.title, hasCorrection: false, pdfPath: 'pdfs/Série 12.pdf', academicYear: '', order: ''}, files: {'pdfs/Série 12.pdf': pdfBytes}, expect: /Invalid resource metadata|Invalid PDF path/},
    'a PDF left in the staging folder': {record: good, files: {[good.pdfPath]: pdfBytes, 'pdfs/scan.pdf': pdfBytes}, expect: /File under pdfs\/ that no catalogue record uses: pdfs\/scan\.pdf/},
    'a record whose PDF was not committed': {record: good, files: {}, expect: /Missing PDF/},
    'a file that is not a PDF': {record: good, files: {[good.pdfPath]: 'ceci est du texte'}, expect: /Not a PDF file/},
    'an empty PDF': {record: good, files: {[good.pdfPath]: ''}, expect: /Missing, empty, or unsafe PDF/},
    'a PDF not named after its ID': {record: {...good, pdfPath: `${folder}/serie-12.pdf`}, files: {[`${folder}/serie-12.pdf`]: pdfBytes}, expect: /PDF must be named after its resource ID/},
    'a PDF in another module folder': {record: {...good, pdfPath: `pdfs/${module.semester}/autre/${module.id}-td-12.pdf`}, files: {[`pdfs/${module.semester}/autre/${module.id}-td-12.pdf`]: pdfBytes}, expect: /Invalid PDF path/},
    'the wrong semester for the module': {record: {...good, semester: module.semester === 'S3' ? 'S4' : 'S3'}, files: {[good.pdfPath]: pdfBytes}, expect: /Invalid resource metadata/},
    'an ID that does not start with the module': {record: {...good, id: 'td-12', pdfPath: `${folder}/td-12.pdf`}, files: {[`${folder}/td-12.pdf`]: pdfBytes}, expect: /Resource ID must start with its module ID/},
    'a number typed as text': {record: {...good, number: '12'}, files: {[good.pdfPath]: pdfBytes}, expect: /Missing or invalid number/},
    'a field of another type': {record: {...good, session: 'normal'}, files: {[good.pdfPath]: pdfBytes}, expect: /Field session does not belong to a td resource/},
    'an optional field written empty': {record: {...good, academicYear: ''}, files: {[good.pdfPath]: pdfBytes}, expect: /Invalid academicYear/},
    'a title in one language': {record: {...good, title: {fr: 'Document de test'}}, files: {[good.pdfPath]: pdfBytes}, expect: /Invalid resource metadata/},
    'a rattrapage exam in the normal session': {record: {...good, id: `${module.id}-examen-2025-2026-rattrapage`, type: 'examen', number: undefined, academicYear: '2025-2026', session: 'normal', examKind: 'rattrapage', pdfPath: `${folder}/${module.id}-examen-2025-2026-rattrapage.pdf`}, files: {[`${folder}/${module.id}-examen-2025-2026-rattrapage.pdf`]: pdfBytes}, expect: /A rattrapage exam must be in the rattrapage session/},
    'the form field carried into the file': {mutate: catalogue => ({loadedFrom: 'abc', ...catalogue}), expect: /unknown top-level key "loadedFrom"/},
    'the module list dropped from the file': {mutate: catalogue => ({resources: catalogue.resources}), expect: /semesters must be an array/}
  };
  for (const [name, {record, files = {}, mutate, expect}] of Object.entries(cases)) {
    const catalogue = JSON.parse(original);
    if (record) catalogue.resources.push(JSON.parse(JSON.stringify(record)));
    project.write('data/resources.json', serialize(mutate ? mutate(catalogue) : catalogue));
    for (const [relative, content] of Object.entries(files)) project.write(relative, content);
    const result = project.doctor();
    assert.equal(result.ok, false, `${name}: the doctor must fail`);
    assert.equal(result.exitCode, 1, name);
    assert.match(result.errors.join('\n'), expect, name);
    for (const relative of Object.keys(files)) project.remove(relative);
  }
  // Each case above fails for its own reason: with the original file back, the copy is clean again.
  project.write('data/resources.json', original);
  assert.deepEqual(project.doctor().errors, []);
});

test('the doctor stops a credential in a published file and a publish folder other than the allowlisted copy', t => {
  const project = projectCopy(t);
  const admin = project.read('admin/admin.js');
  const toml = project.read('netlify.toml');
  const token = ['ghp', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'].join('_');
  project.write('admin/admin.js', `${admin}\nconst token = '${token}';\n`);
  assert.match(project.doctor().errors.join('\n'), /admin\/admin\.js: contains what looks like a GitHub token/);
  project.write('admin/admin.js', `${admin}\nconst ${['client', 'secret'].join('_')} = 'abc';\n`);
  assert.match(project.doctor().errors.join('\n'), /admin\/admin\.js: contains what looks like an OAuth client secret/);
  project.write('admin/admin.js', admin);
  project.write('netlify.toml', toml.replace('publish = ".netlify-publish"', 'publish = "."'));
  assert.match(project.doctor().errors.join('\n'), /netlify\.toml: publish must be "\.netlify-publish"/);
  project.write('netlify.toml', toml);
  // A file added to admin/ later is read too, wherever it sits.
  project.write('admin/decap/extra.js', `const token = '${token}';\n`);
  assert.match(project.doctor().errors.join('\n'), /admin\/decap\/extra\.js: contains what looks like a GitHub token/);
  project.remove('admin/decap/extra.js');
  project.remove('admin/decap/decap-cms.js');
  assert.match(project.doctor().errors.join('\n'), /Missing admin\/decap\/decap-cms\.js/);
});

test('the doctor keeps the admin out of the student pages and out of search engines', t => {
  const project = projectCopy(t);
  assert.deepEqual(project.doctor().errors, []);
  const home = project.read('index.html');
  project.write('index.html', home.replace('</main>', '<a href="admin/">Administration</a></main>'));
  assert.match(project.doctor().errors.join('\n'), /index\.html: student pages must not link to or mention the admin/);
  project.write('index.html', home);
  const toml = project.read('netlify.toml');
  project.write('netlify.toml', toml.replace('X-Robots-Tag = "noindex, nofollow"', 'X-Robots-Tag = "all"'));
  assert.match(project.doctor().errors.join('\n'), /netlify\.toml: \/admin\/\* must be sent with X-Robots-Tag/);
  project.write('netlify.toml', toml);
  for (const page of ['admin/index.html', 'admin/decap/index.html']) {
    const html = project.read(page);
    project.write(page, html.replace('<meta name="robots" content="noindex, nofollow" />', ''));
    assert.match(project.doctor().errors.join('\n'), new RegExp(`${page.replaceAll('/', '\\/').replace('.', '\\.')}: an admin page must carry`));
    project.write(page, html);
  }
  assert.deepEqual(project.doctor().errors, []);
});
