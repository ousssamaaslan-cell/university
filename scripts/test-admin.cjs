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

// What the form holds for a new document, and a chosen PDF as the form describes it.
const asked = fields => ({semester: 'S3', module: 'asd3', title: {fr: ' Titre ', ar: ' عنوان '}, ...fields});
const chosen = (more = {}) => ({name: 'Série N°2 (corrigé).PDF', size: 1200, isPdf: true, ...more});
const pdfOf = text => new TextEncoder().encode(`%PDF-1.4\n% ${text}\n%%EOF\n`);

test('dashboard, add: each of the four types gets its ID, its fields and its place', () => {
  const start = fixture();
  const cours = plan(start, {action: 'add', fields: asked({type: 'cours', chapter: '2'}), pdf: chosen()});
  assert.deepEqual([cours.errors, cours.added, cours.writes, cours.deletes, cours.changed], [[], ['asd3-cours-ch02'], [{to: 'pdfs/S3/asd3/asd3-cours-ch02.pdf'}], [], true]);
  assert.deepEqual(cours.record, {id: 'asd3-cours-ch02', level: 'L2', semester: 'S3', module: 'asd3', type: 'cours', chapter: 2, title: {fr: 'Titre', ar: 'عنوان'}, pdfPath: 'pdfs/S3/asd3/asd3-cours-ch02.pdf', order: 2});
  assert.equal(rules.commitMessage(cours), 'Admin: add asd3-cours-ch02');

  const td = plan(start, {action: 'add', fields: asked({type: 'td', number: '2', hasCorrection: true}), pdf: chosen()});
  assert.deepEqual(td.record, {id: 'asd3-td-02', level: 'L2', semester: 'S3', module: 'asd3', type: 'td', number: 2, title: {fr: 'Titre', ar: 'عنوان'}, hasCorrection: true, pdfPath: 'pdfs/S3/asd3/asd3-td-02.pdf', order: 2});
  // It lands between TD 1 and TD 3, and every other record is exactly as it was.
  assert.deepEqual(JSON.parse(td.raw).resources.map(resource => resource.id), ['asd3-cours-ch01', 'asd3-td-01', 'asd3-td-02', 'asd3-td-03', 'asd3-examen-2024-2025-emd', 'ao-cours-ch01']);
  assert.equal(td.raw, serialize({...start, resources: [start.resources[0], start.resources[1], td.record, ...start.resources.slice(2)]}));

  const tp = plan(start, {action: 'add', fields: asked({type: 'tp', number: 4, academicYear: '2023-2024'}), pdf: chosen()});
  assert.deepEqual(tp.record, {id: 'asd3-tp-04-2023-2024', level: 'L2', semester: 'S3', module: 'asd3', type: 'tp', number: 4, academicYear: '2023-2024', title: {fr: 'Titre', ar: 'عنوان'}, hasCorrection: false, pdfPath: 'pdfs/S3/asd3/asd3-tp-04-2023-2024.pdf', order: 4});

  const examen = plan(start, {action: 'add', fields: asked({module: 'ao', type: 'examen', academicYear: '2025-2026', session: 'rattrapage', examKind: 'rattrapage', hasCorrection: true, number: '7', chapter: '3'}), pdf: chosen()});
  assert.deepEqual(examen.record, {id: 'ao-examen-2025-2026-rattrapage', level: 'L2', semester: 'S3', module: 'ao', type: 'examen', academicYear: '2025-2026', session: 'rattrapage', examKind: 'rattrapage', title: {fr: 'Titre', ar: 'عنوان'}, hasCorrection: true, pdfPath: 'pdfs/S3/ao/ao-examen-2025-2026-rattrapage.pdf', order: 4});
  // The PDF is named after the ID whatever the file was called, and stays inside the module's folder.
  for (const made of [cours, td, tp, examen]) assert.equal(gitHubStore.isPdfPath(made.writes[0].to), true);
});

test('dashboard, add: what the form cannot prevent is refused, and nothing is planned', () => {
  const start = fixture();
  const refusal = (fields, pdf = chosen()) => plan(start, {action: 'add', fields: asked(fields), pdf});
  const said = (fields, pdf) => refusal(fields, pdf).errors.join(' ');
  assert.match(said({type: 'td', number: '2'}, null), /Choisissez le fichier PDF/);
  assert.match(said({type: 'td', number: '0'}), /Le numéro de la série doit être un nombre entier, à partir de 1\./);
  assert.match(said({type: 'td', number: '2.5'}), /Le numéro de la série/);
  assert.match(said({type: 'cours', chapter: ''}), /Le numéro du chapitre/);
  assert.match(said({type: 'td', number: '2', title: {fr: '  ', ar: 'عنوان'}}), /Le titre en français est vide\./);
  assert.match(said({type: 'td', number: '2', title: {fr: 'Titre', ar: ''}}), /Le titre en arabe est vide\./);
  assert.match(said({type: 'td', number: '2', semester: 'S4'}), /Le module ASD3 appartient au semestre S3/);
  assert.match(said({type: 'td', number: '2', module: 'inconnu'}), /Choisissez un module\./);
  assert.match(said({type: 'quiz', number: '2'}), /Le type du document est inconnu\./);
  assert.match(said({type: 'examen', session: 'normal', examKind: 'emd'}), /Choisissez l'année universitaire\./);
  assert.match(said({type: 'examen', academicYear: '2024-2026', session: 'normal', examKind: 'emd'}), /Choisissez l'année universitaire\./);
  assert.match(said({type: 'examen', academicYear: '2023-2024', session: 'normal', examKind: 'rattrapage'}), /Un examen de rattrapage appartient à la session de rattrapage\./);
  assert.match(said({type: 'examen', academicYear: '2023-2024', session: 'été', examKind: 'partiel'}), /Choisissez la session\..*Choisissez la nature de l'examen\./);
  for (const refused of [refusal({type: 'td', number: '0'}), refusal({type: 'td', number: '2'}, null)]) {
    assert.deepEqual([refused.code, Object.keys(refused).sort()], ['invalid', ['code', 'errors']]);
  }
});

test('dashboard, files: a file that is not a PDF and a file over 50 MB are refused; over 10 MB is a warning', () => {
  const verdict = more => rules.checkPdf(chosen(more));
  assert.deepEqual(verdict(), {error: null, warning: null});
  // Both tests must pass: the name's ending, and the first bytes.
  assert.match(verdict({name: 'notes.docx'}).error, /« notes\.docx » n'est pas un fichier PDF : son nom ne se termine pas par \.pdf/);
  assert.match(verdict({name: 'photo.pdf.jpg'}).error, /ne se termine pas par \.pdf/);
  assert.match(verdict({name: 'renomme.pdf', isPdf: false}).error, /« renomme\.pdf » n'est pas un vrai PDF : son contenu ne commence pas par %PDF/);
  assert.match(verdict({name: 'vide.pdf', size: 0, isPdf: false}).error, /« vide\.pdf » est vide/);
  assert.equal(verdict({name: 'MAJUSCULES.PDF'}).error, null);
  // 50 MB is the limit, as for the Decap form; 10 MB is where the advice starts.
  assert.equal(verdict({size: rules.MAX_PDF_BYTES}).error, null);
  assert.match(verdict({size: rules.MAX_PDF_BYTES + 1}).error, /pèse 50,1 Mo\. La limite est de 50 Mo : compressez le PDF/);
  assert.match(verdict({size: 63.4e6}).error, /pèse 63,4 Mo/);
  assert.deepEqual([verdict({size: rules.LARGE_PDF_BYTES}).error, verdict({size: rules.LARGE_PDF_BYTES}).warning], [null, null]);
  assert.match(verdict({size: 12.5e6}).warning, /Ce PDF pèse 12,5 Mo.*compressez-le si vous le pouvez.*publier tel quel/);
  assert.equal(verdict({size: 12.5e6}).error, null);
  assert.equal(rules.MAX_PDF_BYTES, 50e6);
  assert.equal(rules.LARGE_PDF_BYTES, 10e6);

  // The save rules refuse the same files, whatever the form let through.
  const start = fixture();
  for (const [bad, expected] of [[{name: 'notes.docx'}, /ne se termine pas par \.pdf/], [{isPdf: false}, /ne commence pas par %PDF/], [{size: 50e6 + 1}, /La limite est de 50 Mo/]]) {
    const refused = plan(start, {action: 'add', fields: asked({type: 'td', number: '2'}), pdf: chosen(bad)});
    assert.equal(refused.code, 'file');
    assert.match(refused.errors[0], expected);
    assert.equal('raw' in refused, false);
  }
  const large = plan(start, {action: 'add', fields: asked({type: 'td', number: '2'}), pdf: chosen({size: 12.5e6})});
  assert.deepEqual([large.errors, large.added], [[], ['asd3-td-02']]);
});

test('dashboard, duplicates: a document already at that place is shown before the save, and must be accepted', () => {
  const start = fixture();
  const again = {action: 'add', fields: asked({type: 'td', number: '3'}), pdf: chosen()};
  const warned = plan(start, again);
  assert.equal(warned.code, 'duplicate');
  assert.deepEqual(warned.duplicates.map(duplicate => [duplicate.id, duplicate.title.fr]), [['asd3-td-03', 'Titre']]);
  assert.equal('raw' in warned, false);
  // Accepted: it is published beside the first one, under the next ID.
  const accepted = plan(start, {...again, acknowledged: ['asd3-td-03']});
  assert.deepEqual([accepted.errors, accepted.added, accepted.writes], [[], ['asd3-td-03-2'], [{to: 'pdfs/S3/asd3/asd3-td-03-2.pdf'}]]);
  // Accepting one document does not accept another that appeared meanwhile.
  const grown = fixture();
  grown.resources.push({...record(start, 'asd3-td-03'), id: 'asd3-td-03-2', pdfPath: 'pdfs/S3/asd3/asd3-td-03-2.pdf'});
  const surprised = plan(grown, {...again, acknowledged: ['asd3-td-03']});
  assert.deepEqual([surprised.code, surprised.duplicates.map(duplicate => duplicate.id)], ['duplicate', ['asd3-td-03', 'asd3-td-03-2']]);

  // Same module, type and number, whatever the year: the year then tells the two versions apart.
  const otherYear = plan(start, {action: 'add', fields: asked({type: 'td', number: '3', academicYear: '2022-2023'}), pdf: chosen(), acknowledged: ['asd3-td-03']});
  assert.deepEqual(otherYear.added, ['asd3-td-03-2022-2023']);
  // A chapter, and an exam by year, session and kind.
  assert.deepEqual(plan(start, {action: 'add', fields: asked({type: 'cours', chapter: '1'}), pdf: chosen()}).duplicates.map(duplicate => duplicate.id), ['asd3-cours-ch01']);
  const exam = fields => plan(start, {action: 'add', fields: asked({type: 'examen', academicYear: '2024-2025', session: 'normal', examKind: 'emd', ...fields}), pdf: chosen()});
  assert.deepEqual([exam({}).code, exam({}).duplicates.map(duplicate => duplicate.id)], ['duplicate', ['asd3-examen-2024-2025-emd']]);
  assert.deepEqual(exam({examKind: 'controle'}).added, ['asd3-examen-2024-2025-controle']);
  assert.deepEqual(exam({academicYear: '2023-2024'}).added, ['asd3-examen-2023-2024-emd']);
  assert.deepEqual(exam({module: 'ao'}).added, ['ao-examen-2024-2025-emd']);
  // Another module or another type with the same number is not a duplicate.
  assert.deepEqual(plan(start, {action: 'add', fields: asked({type: 'tp', number: '3'}), pdf: chosen()}).added, ['asd3-tp-03']);
  assert.deepEqual(plan(start, {action: 'add', fields: asked({module: 'ao', type: 'td', number: '3'}), pdf: chosen()}).added, ['ao-td-03']);

  // What the form shows while it is being filled in.
  const catalogue = fixture();
  assert.equal(rules.draftId(catalogue, asked({type: 'td'})), null);
  assert.deepEqual(rules.draftId(catalogue, asked({type: 'td', number: '7'})), {id: 'asd3-td-07', pdfPath: 'pdfs/S3/asd3/asd3-td-07.pdf'});
  assert.deepEqual(rules.draftId(catalogue, asked({type: 'td', number: '3'})), {id: 'asd3-td-03-2', pdfPath: 'pdfs/S3/asd3/asd3-td-03-2.pdf'});
  assert.equal(rules.draftId(catalogue, asked({type: 'examen', academicYear: '2024-2025'})), null);
  assert.deepEqual(rules.similarDocuments(catalogue, asked({type: 'td', number: '3'})).map(item => item.id), ['asd3-td-03']);
  assert.deepEqual(rules.similarDocuments(catalogue, asked({type: 'td', number: ''})), []);
  assert.deepEqual(rules.similarDocuments(catalogue, asked({type: 'examen', academicYear: '2024-2025', examKind: 'emd'})), []);
  assert.deepEqual(rules.similarDocuments(catalogue, asked({type: 'examen', academicYear: '2024-2025', examKind: 'emd', session: 'normal'})).map(item => item.id), ['asd3-examen-2024-2025-emd']);
});

test('dashboard, add on GitHub: the record and the PDF go into one commit, for each of the four types', async () => {
  const github = fakeGitHub(startFiles());
  const additions = [
    [asked({type: 'cours', chapter: '2'}), 'asd3-cours-ch02'],
    [asked({type: 'td', number: '2', hasCorrection: true}), 'asd3-td-02'],
    [asked({type: 'tp', number: '1'}), 'asd3-tp-01'],
    [asked({module: 'ao', type: 'examen', academicYear: '2025-2026', session: 'normal', examKind: 'final'}), 'ao-examen-2025-2026-final']
  ];
  for (const [fields, id] of additions) {
    const before = github.state.head;
    const bytes = pdfOf(id);
    let reads = 0;
    const result = await publish(github, {action: 'add', fields, pdf: {name: 'scan.pdf'}}, async () => { reads++; return bytes; });
    assert.deepEqual([result.changed, result.attempts, result.plan.added, reads], [true, 1, [id], 1]);
    const commit = github.commits.get(github.state.head);
    assert.deepEqual([commit.parents, commit.message], [[before], `Admin: add ${id}`]);
    const files = github.filesAtHead();
    assert.equal(files[result.plan.record.pdfPath], new TextDecoder().decode(bytes));
    assert.equal(files['data/resources.json'], result.plan.raw);
    assert.deepEqual(result.pdf, {path: result.plan.record.pdfPath, size: bytes.length, sha: await flow.gitBlobSha(bytes)});
  }
  assert.deepEqual(github.history(), ['Admin: add ao-examen-2025-2026-final', 'Admin: add asd3-tp-01', 'Admin: add asd3-td-02', 'Admin: add asd3-cours-ch02', 'start']);
  assert.deepEqual(JSON.parse(github.filesAtHead()['data/resources.json']).resources.map(resource => resource.id),
    ['asd3-cours-ch01', 'asd3-cours-ch02', 'asd3-td-01', 'asd3-td-02', 'asd3-td-03', 'asd3-tp-01', 'asd3-examen-2024-2025-emd', 'ao-cours-ch01', 'ao-examen-2025-2026-final']);
  assert.equal(github.filesAtHead()['README.md'], 'readme');
});

test('dashboard, add on GitHub: the bytes are checked again at the save, and a refusal commits nothing', async () => {
  const github = fakeGitHub(startFiles());
  const start = github.state.head;
  const add = (fields, bytes, more = {}) => rejection(publish(github, {action: 'add', fields: asked(fields), pdf: {name: 'scan.pdf'}, ...more}, async () => bytes));
  // A file whose content is not a PDF, whatever the form believed about it.
  const text = await add({type: 'td', number: '2'}, new TextEncoder().encode('ceci est du texte'));
  assert.deepEqual([text.kind, github.state.head], ['file', start]);
  assert.match(text.problems[0], /ne commence pas par %PDF/);
  const empty = await add({type: 'td', number: '2'}, new Uint8Array());
  assert.match(empty.problems[0], /est vide/);
  // A document already at that place, added by somebody else since the page was loaded: stop and show it.
  const duplicate = await add({type: 'td', number: '3'}, pdfOf('td 3'));
  assert.deepEqual([duplicate.kind, duplicate.duplicates.map(item => item.id), github.state.head], ['duplicate', ['asd3-td-03'], start]);
  const invalid = await add({type: 'td', number: '0'}, pdfOf('td 0'));
  assert.deepEqual([invalid.kind, github.state.head], ['invalid', start]);
  assert.equal(github.requests.some(request => request.method !== 'GET'), false);

  // During a retry the PDF is not read a second time, and the new ID follows the branch as it then is.
  let reads = 0;
  github.before('PATCH /git/refs/heads/main', () => github.commitElsewhere(catalogue => { catalogue.resources.splice(2, 0, {...catalogue.resources[1], id: 'asd3-td-02', number: 2, pdfPath: 'pdfs/S3/asd3/asd3-td-02.pdf', order: 2}); }));
  const raced = await rejection(publish(github, {action: 'add', fields: asked({type: 'td', number: '2'}), pdf: {name: 'scan.pdf'}}, async () => { reads++; return pdfOf('td 2'); }));
  assert.deepEqual([raced.kind, raced.duplicates.map(item => item.id), reads], ['duplicate', ['asd3-td-02'], 1]);
  assert.deepEqual(github.history(), ['another change', 'start']);
});

// What the form holds for a document already published: its own fields, as the form shows them.
const shown = (resource, changes = {}) => ({
  semester: resource.semester, module: resource.module, type: resource.type,
  chapter: resource.chapter ?? '', number: resource.number ?? '', academicYear: resource.academicYear ?? '',
  session: resource.session ?? '', examKind: resource.examKind ?? '', hasCorrection: resource.hasCorrection === true,
  title: {...resource.title}, ...changes
});
const edit = (catalogue, id, changes = {}, more = {}) => ({action: 'edit', id, base: record(catalogue, id), fields: shown(record(catalogue, id), changes), pdf: null, ...more});

test('dashboard, edit: titles, fields and the correction change; the ID, the PDF path and the place in the file do not', () => {
  const start = fixture();
  const titled = plan(start, edit(start, 'asd3-td-03', {title: {fr: ' Nouveau titre ', ar: 'عنوان جديد'}, hasCorrection: false}));
  assert.deepEqual([titled.errors, titled.updated, titled.writes, titled.deletes, titled.added, titled.removed, titled.changed], [[], ['asd3-td-03'], [], [], [], [], true]);
  assert.deepEqual(titled.record, {id: 'asd3-td-03', level: 'L2', semester: 'S3', module: 'asd3', type: 'td', number: 3, title: {fr: 'Nouveau titre', ar: 'عنوان جديد'}, hasCorrection: false, pdfPath: 'pdfs/S3/asd3/asd3-td-03.pdf', order: 3});
  assert.equal(titled.raw, serialize({...start, resources: start.resources.map(resource => (resource.id === 'asd3-td-03' ? titled.record : resource))}));
  assert.equal(rules.commitMessage(titled), 'Admin: edit asd3-td-03');

  // A new number: the order follows it, the ID and the file name stay.
  const renumbered = plan(start, edit(start, 'asd3-td-03', {number: '4'}));
  assert.deepEqual([renumbered.record.number, renumbered.record.order, renumbered.record.id, renumbered.record.pdfPath], [4, 4, 'asd3-td-03', 'pdfs/S3/asd3/asd3-td-03.pdf']);
  // An order typed by hand is kept (the fixture's exam has order 2 as an EMD; give a TD an order of its own).
  const custom = fixture();
  record(custom, 'asd3-td-01').order = 0;
  const kept = plan(custom, edit(custom, 'asd3-td-01', {number: '6', academicYear: '2024-2025'}));
  assert.deepEqual([kept.record.number, kept.record.order, kept.record.academicYear, kept.record.id], [6, 0, '2024-2025', 'asd3-td-01']);
  assert.deepEqual(Object.keys(kept.record), ['id', 'level', 'semester', 'module', 'type', 'number', 'academicYear', 'title', 'hasCorrection', 'pdfPath', 'order']);
  // An exam: its kind changes, and its usual order with it.
  const exam = plan(start, edit(start, 'asd3-examen-2024-2025-emd', {examKind: 'final', hasCorrection: true}));
  assert.deepEqual([exam.record.examKind, exam.record.order, exam.record.hasCorrection, exam.record.id], ['final', 3, true, 'asd3-examen-2024-2025-emd']);

  // Nothing changed: nothing to commit, and the file is returned as it is.
  const same = plan(start, edit(start, 'asd3-td-03'));
  assert.deepEqual([same.errors, same.changed, same.updated, same.writes], [[], false, [], []]);
  assert.equal(same.raw, serialize(start));
});

test('dashboard, edit: the PDF is replaced at the same path; the same file again replaces nothing', () => {
  const start = fixture();
  const replaced = plan(start, edit(start, 'asd3-td-01', {}, {pdf: chosen({sha: 'b'.repeat(40)})}), new Map([['pdfs/S3/asd3/asd3-td-01.pdf', {sha: 'a'.repeat(40)}]]));
  assert.deepEqual([replaced.errors, replaced.updated, replaced.writes, replaced.deletes, replaced.changed], [[], ['asd3-td-01'], [{to: 'pdfs/S3/asd3/asd3-td-01.pdf'}], [], true]);
  // The record itself is untouched: only the file changes.
  assert.equal(JSON.stringify(replaced.record), JSON.stringify(record(start, 'asd3-td-01')));
  assert.equal(replaced.raw, serialize(start));

  const identical = plan(start, edit(start, 'asd3-td-01', {}, {pdf: chosen({sha: 'a'.repeat(40)})}), new Map([['pdfs/S3/asd3/asd3-td-01.pdf', {sha: 'a'.repeat(40)}]]));
  assert.deepEqual([identical.errors, identical.changed, identical.writes], [[], false, []]);
  // The same file with a new title: the title is saved, the file is not sent again.
  const titleOnly = plan(start, edit(start, 'asd3-td-01', {title: {fr: 'Autre', ar: 'آخر'}}, {pdf: chosen({sha: 'a'.repeat(40)})}), new Map([['pdfs/S3/asd3/asd3-td-01.pdf', {sha: 'a'.repeat(40)}]]));
  assert.deepEqual([titleOnly.changed, titleOnly.updated, titleOnly.writes], [true, ['asd3-td-01'], []]);
  // A replacement must be a PDF too.
  assert.equal(plan(start, edit(start, 'asd3-td-01', {}, {pdf: chosen({isPdf: false})})).code, 'file');
  assert.equal(plan(start, edit(start, 'asd3-td-01', {}, {pdf: chosen({size: 50e6 + 1})})).code, 'file');
});

test('dashboard, edit: the module and the type are locked, and a form opened on an older catalogue is refused', () => {
  const start = fixture();
  assert.match(plan(start, edit(start, 'asd3-td-03', {module: 'ao'})).errors.join(' '), /Le module et le type d'un document déjà publié ne changent pas : supprimez ce document, puis ajoutez-le de nouveau\./);
  assert.match(plan(start, edit(start, 'asd3-td-03', {type: 'tp'})).errors.join(' '), /Le module et le type d'un document déjà publié ne changent pas/);
  assert.match(plan(start, edit(start, 'asd3-td-03', {semester: 'S4'})).errors.join(' '), /Le module ASD3 appartient au semestre S3/);
  assert.match(plan(start, edit(start, 'asd3-td-03', {title: {fr: '', ar: 'عنوان'}})).errors.join(' '), /Le titre en français est vide/);
  assert.match(plan(start, edit(start, 'asd3-td-03', {number: '0'})).errors.join(' '), /Le numéro de la série/);

  // Removed elsewhere, or changed elsewhere, since the form was opened.
  const gone = plan(without(start, 'asd3-td-03'), edit(start, 'asd3-td-03', {title: {fr: 'Nouveau', ar: 'جديد'}}));
  assert.deepEqual([gone.code, 'raw' in gone], ['stale', false]);
  const elsewhere = fixture();
  record(elsewhere, 'asd3-td-03').hasCorrection = false;
  const moved = plan(elsewhere, edit(start, 'asd3-td-03', {title: {fr: 'Nouveau', ar: 'جديد'}}));
  assert.equal(moved.code, 'stale');
  assert.match(moved.errors[0], /asd3-td-03 a été modifié ailleurs/);

  // Moving onto another document's place is warned about; staying where it is, never.
  const onto = plan(start, edit(start, 'asd3-td-03', {number: '1'}));
  assert.deepEqual([onto.code, onto.duplicates.map(duplicate => duplicate.id)], ['duplicate', ['asd3-td-01']]);
  assert.deepEqual(plan(start, edit(start, 'asd3-td-03', {number: '1'}, {acknowledged: ['asd3-td-01']})).updated, ['asd3-td-03']);
  const twins = fixture();
  twins.resources.push({...record(twins, 'asd3-td-03'), id: 'asd3-td-03-2', pdfPath: 'pdfs/S3/asd3/asd3-td-03-2.pdf'});
  assert.deepEqual(plan(twins, edit(twins, 'asd3-td-03-2', {title: {fr: 'Seconde version', ar: 'نسخة ثانية'}})).updated, ['asd3-td-03-2']);
  assert.deepEqual(rules.similarDocuments(twins, shown(record(twins, 'asd3-td-03-2')), record(twins, 'asd3-td-03-2')), []);
  assert.deepEqual(rules.similarDocuments(twins, shown(record(twins, 'asd3-td-03-2'), {number: '1'}), record(twins, 'asd3-td-03-2')).map(item => item.id), ['asd3-td-01']);
});

test('dashboard, edit on GitHub: an edit, a replaced PDF and both together are each one commit', async () => {
  const github = fakeGitHub(startFiles());
  const start = fixture();
  let before = github.state.head;

  // Titles only: the catalogue changes, no file is sent.
  const titled = await publish(github, edit(start, 'asd3-td-01', {title: {fr: 'Piles et files', ar: 'المكدسات والطوابير'}}));
  assert.deepEqual([titled.changed, titled.plan.writes, titled.pdf], [true, [], null]);
  assert.deepEqual([github.commits.get(github.state.head).parents, github.commits.get(github.state.head).message], [[before], 'Admin: edit asd3-td-01']);
  assert.equal(github.filesAtHead()['pdfs/S3/asd3/asd3-td-01.pdf'], '%PDF-old');
  assert.equal(JSON.parse(github.filesAtHead()['data/resources.json']).resources.find(resource => resource.id === 'asd3-td-01').title.ar, 'المكدسات والطوابير');
  assert.equal(github.requests.filter(request => request.method === 'POST' && request.url.endsWith('/git/blobs')).length, 1);

  // The PDF only: same path, new content, and the catalogue byte for byte the same.
  const now = JSON.parse(github.filesAtHead()['data/resources.json']);
  before = github.state.head;
  const catalogueBefore = github.filesAtHead()['data/resources.json'];
  const replaced = await publish(github, {...edit(now, 'asd3-td-01'), pdf: {name: 'nouvelle version.pdf'}}, async () => pdfOf('version 2'));
  assert.deepEqual([replaced.changed, replaced.plan.writes], [true, [{to: 'pdfs/S3/asd3/asd3-td-01.pdf'}]]);
  assert.deepEqual([github.commits.get(github.state.head).parents, github.commits.get(github.state.head).message], [[before], 'Admin: edit asd3-td-01']);
  assert.equal(github.filesAtHead()['pdfs/S3/asd3/asd3-td-01.pdf'], new TextDecoder().decode(pdfOf('version 2')));
  assert.equal(github.filesAtHead()['data/resources.json'], catalogueBefore);
  assert.deepEqual(Object.keys(github.filesAtHead()).sort(), ['README.md', 'data/resources.json', 'pdfs/S3/ao/ao-cours-ch01.pdf', 'pdfs/S3/asd3/asd3-td-01.pdf']);

  // The very same file again: GitHub is not asked to commit anything.
  before = github.state.head;
  const writes = github.requests.filter(request => request.method !== 'GET').length;
  const again = await publish(github, {...edit(now, 'asd3-td-01'), pdf: {name: 'nouvelle version.pdf'}}, async () => pdfOf('version 2'));
  assert.deepEqual([again.changed, again.commit, github.state.head], [false, null, before]);
  assert.equal(github.requests.filter(request => request.method !== 'GET').length, writes);

  // Both at once, on a branch that moves during the save: still one commit of ours, on top of theirs.
  let theirs;
  github.before('PATCH /git/refs/heads/main', () => { theirs = github.commitElsewhere(catalogue => { catalogue.resources = catalogue.resources.filter(resource => resource.id !== 'ao-cours-ch01'); }); });
  const both = await publish(github, {...edit(now, 'asd3-td-01', {number: '2', hasCorrection: true}), pdf: {name: 'v3.pdf'}}, async () => pdfOf('version 3'));
  assert.deepEqual([both.changed, both.attempts], [true, 2]);
  assert.deepEqual(github.commits.get(github.state.head).parents, [theirs]);
  const final = JSON.parse(github.filesAtHead()['data/resources.json']);
  assert.deepEqual([final.resources.find(resource => resource.id === 'asd3-td-01').number, final.resources.some(resource => resource.id === 'ao-cours-ch01')], [2, false]);
  assert.equal(github.filesAtHead()['pdfs/S3/asd3/asd3-td-01.pdf'], new TextDecoder().decode(pdfOf('version 3')));

  // The document was changed elsewhere after the form was opened: the edit is refused, not merged over it.
  const stale = await rejection(publish(github, edit(now, 'asd3-td-01', {title: {fr: 'Trop tard', ar: 'فات الأوان'}})));
  assert.equal(stale.kind, 'stale');
  assert.equal(JSON.parse(github.filesAtHead()['data/resources.json']).resources.find(resource => resource.id === 'asd3-td-01').title.fr, 'Piles et files');
});

// A stand-in for the public site: what it serves is set by the test, as a deployment would.
function fakeSite(catalogue) {
  const site = {catalogue, files: new Map(), requests: [], down: false};
  site.fetch = async (url, options = {}) => {
    site.requests.push({url, ...options});
    if (site.down) throw new TypeError('Failed to fetch');
    const path = url.replace('https://site.test/', '');
    if (path === 'data/resources.json') return new Response(typeof site.catalogue === 'string' ? site.catalogue : serialize(site.catalogue), {status: site.catalogue === null ? 404 : 200});
    const file = site.files.get(path);
    if (!file) return new Response('', {status: 404});
    const headers = {...(file.noLength ? {} : {'content-length': String(file.bytes.length)}), ...(file.etag ? {etag: file.etag} : {})};
    return new Response(options.method === 'HEAD' ? null : file.bytes, {status: 200, headers});
  };
  return site;
}
const live = (site, expected) => flow.liveCheck({fetch: site.fetch, siteRoot: 'https://site.test/', ...expected})();

test('deployment: the public catalogue says when an addition, an edit or a deletion is online', async () => {
  const start = fixture();
  const added = plan(start, {action: 'add', fields: asked({type: 'td', number: '2'}), pdf: chosen()});
  const site = fakeSite(start);
  assert.equal(await live(site, {present: [added.record]}), false);
  site.catalogue = JSON.parse(added.raw);
  assert.equal(await live(site, {present: [added.record]}), true);
  // The public site is asked, never the browser's cache.
  assert.ok(site.requests.every(request => request.cache === 'no-store' && request.url === 'https://site.test/data/resources.json'));

  // An edit is online when the public record is the saved one, not merely present.
  const edited = plan(start, edit(start, 'asd3-td-03', {title: {fr: 'Nouveau', ar: 'جديد'}}));
  site.catalogue = start;
  assert.equal(await live(site, {present: [edited.record]}), false);
  site.catalogue = JSON.parse(edited.raw);
  assert.equal(await live(site, {present: [edited.record]}), true);

  // A deletion is online when none of the removed documents is listed any more.
  site.catalogue = without(start, 'asd3-td-01');
  assert.equal(await live(site, {absent: ['asd3-td-01', 'ao-cours-ch01']}), false);
  site.catalogue = without(start, 'asd3-td-01', 'ao-cours-ch01');
  assert.equal(await live(site, {absent: ['asd3-td-01', 'ao-cours-ch01']}), true);

  // A site that does not answer, or answers something else, is simply not online yet.
  site.down = true;
  assert.equal(await live(site, {absent: ['asd3-td-01']}), false);
  site.down = false;
  site.catalogue = null;
  assert.equal(await live(site, {absent: ['asd3-td-01']}), false);
  site.catalogue = '<!doctype html><title>Page introuvable</title>';
  assert.equal(await live(site, {absent: ['asd3-td-01']}), false);
});

test('deployment: a replaced PDF is recognised by its size, by the server\'s mark, or by its content', async () => {
  const start = fixture();
  const path = 'pdfs/S3/asd3/asd3-td-01.pdf';
  const oldBytes = pdfOf('ancienne version');
  const newBytes = pdfOf('nouvelle version, plus longue');
  const expected = async (bytes, before) => ({present: [record(start, 'asd3-td-01')], pdf: {path, size: bytes.length, sha: await flow.gitBlobSha(bytes), before}});
  const site = fakeSite(start);

  // The catalogue is unchanged by a replacement, so it cannot be the sign: the old file is still served.
  site.files.set(path, {bytes: oldBytes, etag: '"old"'});
  assert.equal(await live(site, await expected(newBytes, {size: oldBytes.length, etag: '"old"'})), false);
  site.files.set(path, {bytes: newBytes, etag: '"new"'});
  assert.equal(await live(site, await expected(newBytes, {size: oldBytes.length, etag: '"old"'})), true);
  // Sizes differ: a header request was enough, the file was not downloaded.
  assert.deepEqual(site.requests.filter(request => request.url.endsWith('.pdf')).map(request => request.method), ['HEAD', 'HEAD']);

  // Same size as before: the server's mark of the content tells the two files apart.
  const sameSize = pdfOf('nouvelle version');
  assert.equal(sameSize.length, oldBytes.length);
  site.files.set(path, {bytes: oldBytes, etag: '"old"'});
  assert.equal(await live(site, await expected(sameSize, {size: oldBytes.length, etag: '"old"'})), false);
  site.files.set(path, {bytes: sameSize, etag: '"new"'});
  assert.equal(await live(site, await expected(sameSize, {size: oldBytes.length, etag: '"old"'})), true);

  // No mark and no earlier measure: the file itself is compared with the one that was sent.
  site.files.set(path, {bytes: oldBytes});
  assert.equal(await live(site, await expected(sameSize, null)), false);
  site.files.set(path, {bytes: sameSize});
  assert.equal(await live(site, await expected(sameSize, null)), true);
  site.files.set(path, {bytes: sameSize, noLength: true});
  assert.equal(await live(site, await expected(sameSize, {size: null, etag: null})), true);
  // A PDF the public site does not serve yet.
  site.files.delete(path);
  assert.equal(await live(site, await expected(newBytes, null)), false);
});

test('deployment: the site is asked every 15 seconds, for 5 minutes at most', async () => {
  const waits = [];
  const wait = async delay => { waits.push(delay); };
  // Online at the third look.
  let looks = 0;
  assert.equal(await flow.watchDeployment({isLive: async () => ++looks === 3, wait}), 'live');
  assert.deepEqual([looks, waits], [3, [15000, 15000, 15000]]);
  // Never online: twenty looks, five minutes, then it stops asking.
  waits.length = 0;
  looks = 0;
  assert.equal(await flow.watchDeployment({isLive: async () => { looks++; return false; }, wait}), 'timeout');
  assert.deepEqual([looks, waits.length, waits.reduce((sum, delay) => sum + delay, 0)], [20, 20, 300000]);
  // A newer change took over: this watch stops without an answer, and without a further look.
  const controller = new AbortController();
  looks = 0;
  const stopped = flow.watchDeployment({isLive: async () => { looks++; controller.abort(); return false; }, wait, signal: controller.signal});
  assert.deepEqual([await stopped, looks], ['stopped', 1]);
  const late = new AbortController();
  assert.equal(await flow.watchDeployment({isLive: async () => { late.abort(); return true; }, wait, signal: late.signal}), 'stopped');
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

test('the doctor accepts everything the dashboard commits: each type added, an edit, a replaced PDF, a deletion, several deletions', t => {
  const project = projectCopy(t);
  const original = project.read('data/resources.json');
  const module = JSON.parse(original).modules[0];
  const fields = more => ({semester: module.semester, module: module.id, title: {fr: 'Document de test', ar: 'وثيقة اختبار'}, ...more});
  const current = () => JSON.parse(project.read('data/resources.json'));
  // One change of the dashboard: planned on the catalogue as it is, written to disk as the commit would write it, then checked.
  const commit = change => {
    const made = rules.planChange(project.read('data/resources.json'), change);
    assert.deepEqual(made.errors, []);
    for (const path of [...made.writes.map(write => write.to), ...made.deletes]) assert.equal(gitHubStore.isPdfPath(path), true, path);
    project.apply(made);
    const checked = project.doctor();
    assert.deepEqual([checked.errors, checked.exitCode], [[], 0], rules.commitMessage(made));
    return made;
  };

  const cours = commit({action: 'add', fields: fields({type: 'cours', chapter: '12'}), pdf: chosen()}).record;
  const td = commit({action: 'add', fields: fields({type: 'td', number: '12', hasCorrection: true}), pdf: chosen()}).record;
  const tp = commit({action: 'add', fields: fields({type: 'tp', number: '12', academicYear: '2024-2025'}), pdf: chosen()}).record;
  const examen = commit({action: 'add', fields: fields({type: 'examen', academicYear: '2025-2026', session: 'rattrapage', examKind: 'rattrapage'}), pdf: chosen()}).record;
  // A second TD 12, accepted beside the first.
  const twin = commit({action: 'add', fields: fields({type: 'td', number: '12'}), pdf: chosen(), acknowledged: [td.id]}).record;
  assert.deepEqual([cours.id, td.id, tp.id, examen.id, twin.id], [`${module.id}-cours-ch12`, `${module.id}-td-12`, `${module.id}-tp-12-2024-2025`, `${module.id}-examen-2025-2026-rattrapage`, `${module.id}-td-12-2`]);
  assert.equal(project.doctor().catalogue.resources, JSON.parse(original).resources.length + 5);

  // An edit that changes a title and a number, then a PDF replaced at its path.
  assert.deepEqual(commit(edit(current(), td.id, {title: {fr: 'Titre corrigé', ar: 'عنوان مصحح'}, number: '13'})).updated, [td.id]);
  assert.deepEqual(commit(edit(current(), cours.id, {}, {pdf: chosen()})).writes, [{to: cours.pdfPath}]);

  // One deletion, then the rest together: the catalogue and pdfs/ are back to what they were.
  const now = id => record(current(), id);
  assert.deepEqual(commit({action: 'delete', documents: [now(tp.id)]}).deletes, [tp.pdfPath]);
  assert.equal(commit({action: 'delete', documents: [cours.id, td.id, examen.id, twin.id].map(now)}).removed.length, 4);
  assert.equal(project.read('data/resources.json'), original);
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
