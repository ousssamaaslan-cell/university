// Search page: search.html?q=<words>
//
// Every word typed must appear somewhere in a module or a document: the module's abbreviation
// or name, the type, the title, the year, the session... A sheet or chapter number typed after
// its word ("td 3", "chapitre 2") must be the document's own number. Accents are ignored.
import {el} from './dom.js';
import {t, tCount, typeset, pageUrl} from './i18n.js';
import {RESOURCE_TYPES, loadCatalogue, semestersOf, modulesOf, sortedResources} from './catalogue.js';
import {renderLayout, renderCatalogueFacts, renderFooter, homeCrumb} from './layout.js';
import {moduleCode, moduleRow, loadingState, loadErrorState, emptyState, actionLink} from './components.js';
import {resourceList} from './resource-list.js';

const MIN_LENGTH = 2;
// Each listed document costs one small request to check its file, so a very broad query is capped.
const MAX_DOCUMENTS = 30;
const TYPING_PAUSE = 200;

const main = document.getElementById('main');

// Makes two spellings comparable: "Données" and "donnees".
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // accents
    .replace(/\p{Cf}/gu, '') // invisible characters, which come along when text is pasted from a chat
    .replace(/œ/g, 'oe')
    .replace(/[’ʼ]/g, "'");
}

// Everything a reader might type to find this document.
function documentWords(module, resource) {
  const words = [module.abbr, module.title, resource.title, t(`type.${resource.type}`)];
  if (resource.type === 'cours') words.push(t('marker.cours', {n: resource.chapter}));
  if (resource.type === 'td' || resource.type === 'tp') {
    words.push(t(`marker.${resource.type}`, {n: resource.number}), t(`type.${resource.type}.name`));
  }
  if (resource.type === 'examen') {
    words.push(t('marker.examen'), t(`session.${resource.session}`));
    if (resource.examKind !== 'rattrapage') words.push(t(`kind.${resource.examKind}`));
  }
  if (resource.academicYear) words.push(resource.academicYear);
  if (resource.hasCorrection) words.push(t(resource.type === 'tp' ? 'correction.tp.yes' : 'correction.yes'));
  return words;
}

// Prepares the searchable text of every module and document once, in display order.
function buildIndex(catalogue) {
  const modules = semestersOf(catalogue).flatMap(semester =>
    modulesOf(catalogue, semester.id).map(module => ({semester, module}))
  );
  return {
    modules: modules.map(({semester, module}) => ({
      module,
      text: normalize([module.abbr, module.title, semester.id, semester.label].join(' '))
    })),
    documents: modules.flatMap(({module}) =>
      RESOURCE_TYPES.flatMap(type =>
        sortedResources(catalogue, module.id, type).map(resource => ({
          module,
          resource,
          text: normalize(documentWords(module, resource).join(' '))
        }))
      )
    )
  };
}

// "td 3", "tp2", "chapitre 4": a sheet or a chapter asked for by its number.
// That number must then be the document's own. Left to the rule below, "3" would also match
// the 3 of "ASD3", and "asd3 td 3" would list every TD of the module.
const NUMBERED = /(?:^|\s)(td|tp|chapitre)\s*(\d{1,2})(?=\s|$)/g;

function find(index, query) {
  const wanted = normalize(query).trim();
  const numbered = [...wanted.matchAll(NUMBERED)].map(([, word, number]) => ({type: word === 'td' || word === 'tp' ? word : 'cours', number: Number(number)}));
  // Every other word must appear somewhere in the module's or the document's text.
  const words = wanted.replace(NUMBERED, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0 && numbered.length === 0) return {modules: [], documents: []};

  const hasWords = entry => words.every(word => entry.text.includes(word));
  const hasNumber = ({resource}) => numbered.every(({type, number}) =>
    resource.type === type && (type === 'cours' ? resource.chapter : resource.number) === number
  );
  const isExactAbbreviation = module => normalize(module.abbr) === wanted;
  return {
    // A module whose abbreviation is exactly what was typed comes first.
    // A numbered sheet or chapter is a document, so such a query lists no module.
    modules: numbered.length > 0 ? [] : index.modules.filter(hasWords).map(entry => entry.module)
      .sort((a, b) => Number(isExactAbbreviation(b)) - Number(isExactAbbreviation(a))),
    documents: index.documents.filter(entry => hasWords(entry) && hasNumber(entry))
  };
}

function moduleResults(catalogue, modules) {
  return el('section', {class: 'section', 'aria-labelledby': 'results-modules'},
    el('div', {class: 'section__head'}, el('h2', {id: 'results-modules'}, t('search.modules'))),
    el('ul', {class: 'row-list', role: 'list'}, modules.map(module => moduleRow(catalogue, module)))
  );
}

// Documents are grouped under the module they belong to, each group linking to that module's page.
// `listedModules` are the modules already shown above, in the Modules section.
function documentResults(documents, listedModules) {
  const shown = documents.slice(0, MAX_DOCUMENTS);
  const modules = [...new Set(shown.map(entry => entry.module))];
  // Typing a module's code finds that module and its documents. The module is then named once,
  // in the Modules section just above, and its documents follow without a second heading.
  const alreadyNamed = modules.length === 1 && listedModules.length === 1 && listedModules[0] === modules[0];
  return el('section', {class: 'section', 'aria-labelledby': 'results-documents'},
    el('div', {class: 'section__head'}, el('h2', {id: 'results-documents'}, t('search.documents'))),
    documents.length > shown.length && el('p', {class: 'search__note'}, t('search.capped', {shown: shown.length})),
    modules.map(module =>
      el('div', {class: 'result-group'},
        // The same link as in a module row, so a module looks the same wherever it is named.
        !alreadyNamed && el('h3', {},
          el('a', {class: 'module__link', href: pageUrl('module.html', {id: module.id})},
            moduleCode(module),
            el('span', {class: 'module__title'}, typeset(module.title))
          )
        ),
        // Two modules often hold an exam with the same title; `context` adds the module's code to
        // what screen readers hear, so the links can be told apart.
        resourceList(shown.filter(entry => entry.module === module).map(entry => entry.resource), {mixed: true, context: module.abbr})
      )
    )
  );
}

// Returns {summary, content}: the line that announces the outcome, and what to draw under it.
function results(catalogue, index, query) {
  if (!query) {
    return {summary: '', content: [emptyState({title: t('search.prompt.title'), text: t('search.prompt.text')})]};
  }
  // Counted on what is really searched for: marks that carry no letter do not count.
  if (normalize(query).trim().length < MIN_LENGTH) {
    return {summary: '', content: [emptyState({title: t('search.short.title'), text: t('search.prompt.text')})]};
  }

  const {modules, documents} = find(index, query);
  if (modules.length === 0 && documents.length === 0) {
    // The line under the heading says there is no result; what follows is only what to try next.
    return {
      summary: t('search.none.title', {query}),
      content: [
        el('p', {class: 'status'}, t('search.none.text')),
        el('p', {}, actionLink({href: pageUrl('index.html'), label: t('search.none.action')}))
      ]
    };
  }

  const counts = [
    modules.length > 0 && tCount('count.modules', modules.length),
    documents.length > 0 && tCount('count.documents', documents.length)
  ].filter(Boolean).join(t('list.separator'));
  return {
    summary: t('search.status', {summary: counts, query}),
    content: [
      modules.length > 0 && moduleResults(catalogue, modules),
      documents.length > 0 && documentResults(documents, modules)
    ].filter(Boolean)
  };
}

async function start() {
  renderLayout({breadcrumb: [homeCrumb()]});
  document.title = t('search.docTitle');

  // Announces the outcome of each search to screen readers, and shows it under the heading.
  const status = el('p', {class: 'lede', role: 'status'});
  const output = el('div', {}, loadingState());
  main.replaceChildren(
    el('div', {class: 'page-width'},
      el('header', {class: 'page-header'}, el('h1', {}, t('search.title')), status),
      output
    )
  );

  const field = document.getElementById('site-search');
  // With something to search for, a blank character holds the height of the outcome line while
  // the catalogue loads, so the results are not pushed down when the line is filled.
  if (field.value.trim()) status.textContent = ' ';

  try {
    const catalogue = await loadCatalogue();
    renderCatalogueFacts(catalogue);
    const index = buildIndex(catalogue);

    const show = () => {
      const query = field.value.trim();
      const {summary, content} = results(catalogue, index, query);
      document.title = query ? t('search.docTitle.query', {query}) : t('search.docTitle');
      status.textContent = summary;
      output.replaceChildren(...content);
    };

    // On this page the header field searches as the reader types, and keeps the address in step
    // so the result can be shared or reloaded.
    const update = () => {
      const url = new URL(location.href);
      if (field.value.trim()) url.searchParams.set('q', field.value.trim());
      else url.searchParams.delete('q');
      // Safari refuses this call when it is made very often; the results are drawn all the same.
      try {
        history.replaceState(null, '', url);
      } catch (error) {
        // The address stays one step behind until the next search.
      }
      show();
    };
    let timer;
    field.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(update, TYPING_PAUSE);
    });
    field.form.addEventListener('submit', event => {
      event.preventDefault();
      clearTimeout(timer);
      update();
    });

    show();
    // Arriving with nothing typed: put the cursor in the field.
    if (!field.value) field.focus();
  } catch (error) {
    console.error(error);
    renderFooter();
    output.replaceChildren(loadErrorState());
  }
}

start();
