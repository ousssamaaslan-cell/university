// Home page: every semester with its modules.
import {el} from './dom.js';
import {t, tCount, typeset} from './i18n.js';
import {loadCatalogue, semestersOf, modulesOf, semesterAnchor} from './catalogue.js';
import {renderLayout, renderCatalogueFacts, renderFooter} from './layout.js';
import {moduleRow, loadingState, loadErrorState, emptyState} from './components.js';

const main = document.getElementById('main');

function pageHeader() {
  return el('header', {class: 'page-header'},
    el('h1', {}, t('home.title')),
    el('p', {class: 'lede'}, t('home.lede'))
  );
}

function semesterSection(catalogue, semester) {
  const anchor = semesterAnchor(semester.id);
  const modules = modulesOf(catalogue, semester.id);
  return el('section', {class: 'section', id: anchor, 'aria-labelledby': `${anchor}-title`},
    el('div', {class: 'section__head'},
      el('h2', {id: `${anchor}-title`}, typeset(semester.label.fr)),
      modules.length > 0 && el('p', {class: 'section__count'}, tCount('count.modules', modules.length))
    ),
    modules.length > 0
      ? el('ul', {class: 'row-list', role: 'list'}, modules.map(module => moduleRow(catalogue, module)))
      : emptyState({title: t('semester.empty.title'), text: t('semester.empty.text')})
  );
}

async function start() {
  renderLayout({breadcrumb: []});

  const content = el('div', {class: 'page-width'}, pageHeader(), loadingState());
  main.replaceChildren(content);

  try {
    const catalogue = await loadCatalogue();
    renderCatalogueFacts(catalogue);
    content.replaceChildren(pageHeader(), ...semestersOf(catalogue).map(semester => semesterSection(catalogue, semester)));
  } catch (error) {
    console.error(error);
    renderFooter();
    content.replaceChildren(pageHeader(), loadErrorState());
    return;
  }

  // The sections did not exist when the browser first looked for #s3 or #s4, so go there now.
  // This stays outside the try block: an odd fragment must not be reported as a failed load.
  if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

start();
