// The admin dashboard at /admin: where the maintainer adds, changes and removes documents.
//
// It is a static page. The maintainer logs in with GitHub through Netlify (netlify-auth.js), and
// every change is written to the repository with GitHub's API (github-commit.js), after
// catalogue-rules.js has checked it. Netlify then rebuilds the public site.
// This file starts the page: the session, the login screen, the header, the two tabs, and the
// copy of the catalogue the two tabs work on.
import {el} from '../js/dom.js';
import {button, note, explain, focusOn, countLabel} from './ui.js';
import {LOCAL, createLocalStore} from './local-preview.js';
import {createDocumentsView} from './documents.js';
import {createForm} from './form.js';

const rules = window.L2CatalogueRules;
const REPOSITORY = 'ousssamaaslan-cell/university';
const BRANCH = 'main';
// The repository is public, so the login asks GitHub for public repositories only. It is the scope
// the Decap form asked for, so GitHub does not ask the maintainer to authorize the site again.
const SCOPE = 'public_repo';
const SESSION_KEY = 'l2-admin-session';

const root = document.querySelector('[data-admin-root]');
const sessionSlot = document.querySelector('[data-admin-session]');
const main = document.getElementById('main');

// The GitHub token lives in this object and in sessionStorage only: it is gone when the tab closes,
// it is never written to localStorage, and it is never logged.
const session = {
  token: null,
  restore() {
    try { this.token = sessionStorage.getItem(SESSION_KEY); } catch { this.token = null; }
  },
  keep(token) {
    this.token = token;
    try { sessionStorage.setItem(SESSION_KEY, token); } catch { /* kept until this page is closed or reloaded */ }
  },
  end() {
    this.token = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* nothing was stored */ }
    // The Decap backup at /admin/decap/ keeps its own login in localStorage. Logging out here ends
    // that one too, so that no GitHub token stays in this browser.
    try { localStorage.removeItem('decap-cms-user'); } catch { /* storage unavailable */ }
  }
};

const auth = window.L2NetlifyAuth.create({window, siteId: location.hostname});
const store = LOCAL ? createLocalStore() : window.L2GitHubStore.create({
  fetch: window.fetch.bind(window),
  apiRoot: 'https://api.github.com',
  repo: REPOSITORY,
  branch: BRANCH,
  getToken: async () => session.token
});

const state = {
  // {login} once the maintainer is logged in.
  user: null,
  // The tab that is open: 'add' or 'list'.
  tab: 'add',
  // The repository as it was last read: {head, raw, catalogue, files, readAt}.
  // files is a Map of PDF path -> {sha, size}.
  snapshot: null
};

// Called after each read of the repository, to draw what depends on it.
const redraw = [];

// A part that does not apply is written as `condition && node`; it is left out here.
const present = nodes => nodes.filter(node => node !== null && node !== undefined && node !== false);

function show(...nodes) {
  root.replaceChildren(...present(nodes));
}

// Reads the catalogue and the list of PDFs from GitHub, never from the published site, so the
// dashboard shows a change made a minute ago.
async function readRepository() {
  const current = await store.read();
  let catalogue;
  try {
    catalogue = JSON.parse(current.raw);
    for (const key of ['semesters', 'modules', 'resources']) if (!Array.isArray(catalogue[key])) throw new Error(key);
  } catch {
    throw Object.assign(new Error('Le fichier data/resources.json du dépôt est illisible. Corrigez-le dans le dépôt, puis rafraîchissez.'), {kind: 'catalogue'});
  }
  return {head: current.head, raw: current.raw, catalogue, files: await store.pdfFiles(current.head), readAt: new Date()};
}

async function reload() {
  state.snapshot = await readRepository();
  for (const draw of redraw) draw();
}

// Makes one change (an addition, an edit or a deletion) in one commit, then reads the repository
// again so both tabs show the result. readPdf gives the bytes of the file chosen in the form.
// Returns admin-flow.js's result; listIsOld is set when the commit went through but the new read did not.
let saving = 0;
async function publish(change, readPdf = null) {
  saving++;
  try {
    const result = await window.L2AdminFlow.publish({store, rules, change, readPdf});
    if (result.changed) {
      try { await reload(); } catch { result.listIsOld = true; }
    }
    return result;
  } finally {
    saving--;
  }
}

// Leaving the page in the middle of a save could lose it: the browser asks first.
window.addEventListener('beforeunload', event => {
  if (saving === 0) return;
  event.preventDefault();
  // Older browsers ask only when this is set.
  event.returnValue = '';
});

// An error, as a message with the button that helps: "Se reconnecter" when the session expired,
// or "Réessayer" when the caller gives a way to try again.
function errorNote(error, {saving = false, retry = null} = {}) {
  const message = explain(error, {saving});
  const loginProblem = ['session', 'blocked', 'cancelled', 'refused'].includes(error?.kind);
  let box;
  const actions = [];
  if (loginProblem && !LOCAL) {
    // The login window opens from this click. The page is not reloaded, so nothing typed is lost.
    actions.push(button('Se reconnecter', {variant: 'primary', onClick: async () => {
      try {
        session.keep(await auth.login({scope: SCOPE}));
        const done = note('ok', {title: 'Vous êtes reconnecté.', text: 'Vous pouvez recommencer.'});
        box.replaceWith(done);
        focusOn(done);
      } catch (failure) {
        const again = errorNote(failure);
        box.replaceWith(again);
        focusOn(again);
      }
    }}));
  } else if (retry) {
    actions.push(button('Réessayer', {onClick: retry}));
  }
  box = note('error', {...message, actions});
  return box;
}

// Opens a document's PDF in a new tab, as the repository holds it now: a PDF added a minute ago,
// or just replaced, is not on the public site yet. `messages` is where to say what went wrong.
const openedPdfs = new Map();
async function openPdf(resource, messages) {
  const file = state.snapshot.files.get(resource.pdfPath);
  if (!file) return;
  // The tab is opened in the click itself, or the browser would block it. The PDF goes in once read.
  const tab = window.open('', '_blank');
  if (tab) {
    tab.document.title = `${resource.id}.pdf`;
    tab.document.body.textContent = 'Chargement du PDF…';
  }
  try {
    if (!openedPdfs.has(file.sha)) {
      const bytes = await store.fileContent(file.sha);
      openedPdfs.set(file.sha, URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'})));
    }
    if (tab) tab.location.replace(openedPdfs.get(file.sha));
    else {
      const blocked = note('warn', {title: "Le navigateur a bloqué l'ouverture du nouvel onglet.", actions: [el('a', {class: 'button', href: openedPdfs.get(file.sha), target: '_blank'}, `Ouvrir ${resource.id}.pdf`)]});
      messages.replaceChildren(blocked);
      focusOn(blocked);
    }
  } catch (error) {
    if (tab) tab.close();
    const problem = errorNote(error);
    messages.replaceChildren(problem);
    focusOn(problem);
  }
}

// What the two tabs are given to work with.
const app = {
  local: LOCAL,
  repository: REPOSITORY,
  rules,
  get snapshot() { return state.snapshot; },
  reload,
  publish,
  errorNote,
  openPdf,
  // Open the add form on a module, and open the list. Set by showDashboard.
  startAdding: () => {},
  openList: () => {}
};

// The header's right side: the account, the link to the public site, and the way out.
function renderSession() {
  const site = el('a', {href: '../', target: '_blank', rel: 'noopener'}, 'Voir le site', el('span', {class: 'visually-hidden'}, ' (nouvel onglet)'));
  if (!state.user) {
    sessionSlot.replaceChildren(site);
    return;
  }
  sessionSlot.replaceChildren(...present([
    LOCAL
      ? el('span', {class: 'admin-session__user'}, 'Aperçu local')
      : el('span', {class: 'admin-session__user'}, 'Connecté : ', el('strong', {}, state.user.login)),
    site,
    !LOCAL && button('Se déconnecter', {onClick: logOut})
  ]));
}

function loginView({problem = null, notice = null} = {}) {
  const heading = el('h1', {}, "Connexion à l'administration");
  const connect = button('Se connecter avec GitHub', {variant: 'primary'});
  connect.addEventListener('click', () => logIn(connect));
  const view = el('section', {class: 'admin-login'},
    heading,
    el('p', {class: 'lede'}, 'Cette page sert à ajouter, modifier et supprimer les documents du site. Elle est réservée au responsable du site.'),
    problem && note('error', problem),
    notice && note('info', {text: notice}),
    el('p', {}, connect),
    el('p', {class: 'hint'}, "La connexion se fait dans une petite fenêtre GitHub. Si rien ne s'ouvre, autorisez les fenêtres surgissantes pour ce site, puis recommencez.")
  );
  return {view, heading};
}

function showLogin(options) {
  state.user = null;
  state.snapshot = null;
  redraw.length = 0;
  renderSession();
  const {view, heading} = loginView(options);
  show(view);
  return heading;
}

function waitingView(text) {
  return el('p', {class: 'status status--loading', role: 'status'}, text);
}

// Called from the click on "Se connecter avec GitHub", so the browser lets the login window open.
async function logIn(connect) {
  connect.disabled = true;
  connect.textContent = 'Connexion en cours…';
  try {
    session.keep(await auth.login({scope: SCOPE}));
  } catch (error) {
    focusOn(showLogin({problem: explain(error)}));
    return;
  }
  await enter();
}

function logOut() {
  session.end();
  focusOn(showLogin({notice: 'Vous êtes déconnecté.'}));
}

// After a login, and on a reload in the same tab: who is logged in, may they write, and what
// does the repository hold?
async function enter() {
  show(waitingView(LOCAL ? 'Lecture du catalogue…' : 'Lecture du catalogue sur GitHub…'));
  try {
    const [user, canWrite] = await Promise.all([store.user(), store.canWrite()]);
    if (!canWrite) {
      session.end();
      focusOn(showLogin({problem: {
        title: `Le compte GitHub « ${user.login} » n'a pas le droit d'écrire dans le dépôt du site.`,
        text: `Connectez-vous avec le compte du responsable du site, ou demandez à être ajouté au dépôt ${REPOSITORY}.`
      }}));
      return;
    }
    state.user = user;
    renderSession();
    state.snapshot = await readRepository();
  } catch (error) {
    if (error.kind === 'session') {
      session.end();
      focusOn(showLogin({problem: {...explain(error), text: 'Reconnectez-vous.'}}));
      return;
    }
    // The session may still be good (GitHub unreachable, for example): keep it and offer to try again.
    const message = errorNote(error, {retry: enter});
    show(el('h1', {}, 'Administration des documents'), message);
    focusOn(message);
    return;
  }
  showDashboard();
}

// The two sections, as tabs. Both panels stay in the page, so what was typed in the form is still
// there after a look at the list.
function showDashboard() {
  const sections = [
    {id: 'add', label: 'Ajouter un document'},
    {id: 'list', label: 'Mes documents'}
  ];
  const panels = new Map(sections.map(section => [section.id, el('div', {class: 'tab-panel', role: 'tabpanel', id: `panel-${section.id}`, 'aria-labelledby': `tab-${section.id}`})]));
  const tabs = sections.map(section => el('button', {class: 'tab', type: 'button', role: 'tab', id: `tab-${section.id}`, 'aria-controls': `panel-${section.id}`, 'data-tab': section.id},
    el('span', {class: 'tab__label'}, section.label)
  ));
  const tablist = el('div', {class: 'tabs admin-tabs', role: 'tablist', 'aria-label': "Sections de l'administration"}, tabs);
  // "Mes documents" shows how many there are: the bare number for the eye, with its unit for screen readers.
  const count = el('span', {class: 'tab__count', 'aria-hidden': 'true'});
  const countSpoken = el('span', {class: 'visually-hidden'});
  tabs[1].append(count, countSpoken);

  function open(id, {focus = false} = {}) {
    state.tab = id;
    for (const tab of tabs) {
      const selected = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels.get(tab.dataset.tab).hidden = !selected;
      if (selected && focus) tab.focus();
    }
  }

  tablist.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) open(tab.dataset.tab);
  });
  // Arrow keys move between the tabs, Home and End jump to the first and last, as on the site's module pages.
  tablist.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = tabs.indexOf(document.activeElement);
    const last = tabs.length - 1;
    const moves = {ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last};
    if (index === -1 || !(event.key in moves)) return;
    event.preventDefault();
    open(tabs[moves[event.key]].dataset.tab, {focus: true});
  });

  const form = createForm(app);
  const documents = createDocumentsView(app);
  panels.get('add').append(el('h2', {}, 'Ajouter un document'), form.node);
  panels.get('list').append(el('h2', {}, 'Mes documents'), documents.node);
  app.startAdding = module => {
    open('add');
    form.startIn(module);
  };
  app.openList = () => open('list', {focus: true});

  redraw.length = 0;
  redraw.push(form.draw, documents.draw, () => {
    const total = state.snapshot.catalogue.resources.length;
    count.textContent = String(total);
    countSpoken.textContent = `, ${countLabel(total)}`;
  });
  for (const draw of redraw) draw();

  show(
    el('h1', {}, 'Administration des documents'),
    LOCAL && note('warn', {title: 'Aperçu local.', text: "Rien n'est envoyé à GitHub : les modifications restent dans cet onglet et disparaissent au rechargement de la page."}),
    tablist,
    ...panels.values()
  );
  open(state.tab);
}

// A file dropped beside the form's drop zone would replace this page with the file, and what was
// typed would be lost. Outside the zone, a dropped file does nothing.
for (const type of ['dragover', 'drop']) {
  window.addEventListener(type, event => {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
  });
}

// Moves focus by script: the page sets a <base>, and a plain "#main" link would go to /admin/#main.
document.querySelector('[data-skip-link]').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
});

renderSession();
if (LOCAL) {
  enter();
} else {
  session.restore();
  if (session.token) enter();
  else showLogin();
}
