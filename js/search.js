// Search page: search.html?q=<words>
//
// Every word typed must appear somewhere in a module or a document: the module's abbreviation
// or name, the type, the chapter or sheet number, the title, the year, the session...
// Both languages are searched whatever the page language, and accents are ignored.
import {el} from './dom.js';
import {t, tCount, localized, pageUrl, everyLanguage} from './i18n.js';
import {RESOURCE_TYPES, loadCatalogue, semestersOf, modulesOf, sortedResources} from './catalogue.js';
import {renderLayout, renderCatalogueFacts, homeCrumb, updateLanguageLinks} from './layout.js';
import {moduleCode, moduleRow, loadingState, errorState, emptyState, actionLink} from './components.js';
import {resourceList} from './resource-list.js';

const MIN_LENGTH = 2;
// Each listed document costs one small request to check its file, so a very broad query is capped.
const MAX_DOCUMENTS = 30;
const TYPING_PAUSE = 200;

const main = document.getElementById('main');

// Makes two spellings comparable: "Données" and "donnees", "أنظمة" and "انظمه".
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // accents, and Arabic vowel marks and hamza on a carrier letter
    .replace(/ـ/g, '') // tatweel, the stretching stroke
    .replace(/ٱ/g, 'ا') // alef wasla -> alef
    .replace(/ى/g, 'ي') // alef maqsura -> ya
    .replace(/ة/g, 'ه') // ta marbuta -> ha
    .replace(/œ/g, 'oe')
    .replace(/[’ʼ]/g, "'");
}

// Everything a reader might type to find this document.
function documentWords(module, resource) {
  const words = [
    module.abbr, module.title.fr, module.title.ar,
    resource.title.fr, resource.title.ar,
    ...everyLanguage(`type.${resource.type}`)
  ];
  if (resource.type === 'cours') words.push(...everyLanguage('marker.cours', {n: resource.chapter}));
  if (resource.type === 'td' || resource.type === 'tp') {
    words.push(...everyLanguage(`marker.${resource.type}`, {n: resource.number}), ...everyLanguage(`type.${resource.type}.name`));
  }
  if (resource.type === 'examen') {
    words.push(...everyLanguage('marker.examen'), ...everyLanguage(`session.${resource.session}`));
    if (resource.examKind !== 'rattrapage') words.push(...everyLanguage(`kind.${resource.examKind}`));
  }
  if (resource.academicYear) words.push(resource.academicYear);
  if (resource.hasCorrection) words.push(...everyLanguage(resource.type === 'tp' ? 'correction.tp.yes' : 'correction.yes'));
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
      text: normalize([module.abbr, module.title.fr, module.title.ar, semester.id, semester.label.fr, semester.label.ar].join(' '))
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

function find(index, query) {
  const wanted = normalize(query).trim();
  const words = wanted.split(/\s+/);
  const matches = entry => words.every(word => entry.text.includes(word));
  const isExactAbbreviation = module => normalize(module.abbr) === wanted;
  return {
    // A module whose abbreviation is exactly what was typed comes first.
    modules: index.modules.filter(matches).map(entry => entry.module)
      .sort((a, b) => Number(isExactAbbreviation(b)) - Number(isExactAbbreviation(a))),
    documents: index.documents.filter(matches)
  };
}

function moduleResults(catalogue, modules) {
  return el('section', {class: 'section', 'aria-labelledby': 'results-modules'},
    el('div', {class: 'section__head'}, el('h2', {id: 'results-modules'}, t('search.modules'))),
    el('ul', {class: 'row-list', role: 'list'}, modules.map(module => moduleRow(catalogue, module)))
  );
}

// Documents are grouped under the module they belong to, each group linking to that module's page.
function documentResults(documents) {
  const shown = documents.slice(0, MAX_DOCUMENTS);
  const modules = [...new Set(shown.map(entry => entry.module))];
  return el('section', {class: 'section', 'aria-labelledby': 'results-documents'},
    el('div', {class: 'section__head'}, el('h2', {id: 'results-documents'}, t('search.documents'))),
    documents.length > shown.length && el('p', {class: 'search__note'}, t('search.capped', {shown: shown.length})),
    modules.map(module =>
      el('div', {class: 'result-group'},
        el('h3', {class: 'result-group__title'},
          el('a', {href: pageUrl('module.html', {id: module.id})}, moduleCode(module), el('span', {}, localized(module.title)))
        ),
        resourceList(shown.filter(entry => entry.module === module).map(entry => entry.resource), {mixed: true})
      )
    )
  );
}

// Returns {summary, content}: the line that announces the outcome, and what to draw under it.
function results(catalogue, index, query) {
  if (!query) {
    return {summary: '', content: [emptyState({title: t('search.prompt.title'), text: t('search.prompt.text')})]};
  }
  if (query.length < MIN_LENGTH) {
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
      documents.length > 0 && documentResults(documents)
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
      history.replaceState(null, '', url);
      updateLanguageLinks();
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
    output.replaceChildren(
      errorState({title: t('error.title'), text: t('error.text'), action: {href: location.href, label: t('error.action')}})
    );
  }
}

start();
