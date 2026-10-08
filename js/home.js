// Home page: every semester with its modules.
import {el} from './dom.js';
import {t, tCount, localized, pageUrl} from './i18n.js';
import {loadCatalogue, semestersOf, modulesOf, resourcesOf, semesterAnchor} from './catalogue.js';
import {renderLayout, renderSampleNotice} from './layout.js';
import {moduleCode, loadingState, errorState, emptyState} from './components.js';

const main = document.getElementById('main');

function pageHeader() {
  return el('header', {class: 'page-header'},
    el('h1', {}, t('home.title')),
    el('p', {class: 'lede'}, t('home.lede'))
  );
}

function moduleRow(catalogue, module) {
  return el('li', {},
    el('a', {class: 'row', href: pageUrl('module.html', {id: module.id})},
      moduleCode(module),
      el('span', {class: 'row__title'}, localized(module.title)),
      el('span', {class: 'row__meta'}, tCount('count.documents', resourcesOf(catalogue, module.id).length))
    )
  );
}

function semesterSection(catalogue, semester) {
  const anchor = semesterAnchor(semester.id);
  const modules = modulesOf(catalogue, semester.id);
  return el('section', {class: 'section', id: anchor, 'aria-labelledby': `${anchor}-title`},
    el('div', {class: 'section__head'},
      el('h2', {id: `${anchor}-title`}, localized(semester.label)),
      modules.length > 0 && el('p', {class: 'section__count'}, tCount('count.modules', modules.length))
    ),
    modules.length > 0
      ? el('ul', {class: 'row-list', role: 'list'}, modules.map(module => moduleRow(catalogue, module)))
      : emptyState({title: t('semester.empty.title'), text: t('semester.empty.text')})
  );
}

async function start() {
  document.title = t('home.docTitle');
  renderLayout({breadcrumb: [{label: t('breadcrumb.home')}]});

  const content = el('div', {class: 'page-width'}, pageHeader(), loadingState());
  main.replaceChildren(content);

  try {
    const catalogue = await loadCatalogue();
    renderSampleNotice(catalogue);
    content.replaceChildren(pageHeader(), ...semestersOf(catalogue).map(semester => semesterSection(catalogue, semester)));

    // The sections did not exist when the browser first looked for #s3 or #s4, so go there now.
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  } catch (error) {
    console.error(error);
    content.replaceChildren(
      pageHeader(),
      errorState({title: t('error.title'), text: t('error.text'), action: {href: location.href, label: t('error.action')}})
    );
  }
}

start();
