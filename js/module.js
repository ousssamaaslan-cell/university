// Module page: module.html?id=<module-id>.
import {el} from './dom.js';
import {t, tCount, localized, pageUrl} from './i18n.js';
import {RESOURCE_TYPES, loadCatalogue, findModule, findSemester, resourcesOf, semesterAnchor} from './catalogue.js';
import {renderLayout, renderBreadcrumb, renderSampleNotice, homeCrumb} from './layout.js';
import {moduleCode, moduleLabel, loadingState, errorState, actionLink} from './components.js';

const main = document.getElementById('main');
const moduleId = new URLSearchParams(location.search).get('id');

function typeRow(catalogue, module, type) {
  return el('li', {},
    el('div', {class: 'row row--plain'},
      el('span', {class: 'row__title'}, t(`type.${type}`)),
      el('span', {class: 'row__meta'}, tCount('count.documents', resourcesOf(catalogue, module.id, type).length))
    )
  );
}

function modulePage(catalogue, module) {
  const semester = findSemester(catalogue, module.semester);
  const semesterLabel = localized(semester.label);

  document.title = t('module.docTitle', {abbr: module.abbr, title: localized(module.title)});
  renderBreadcrumb([
    homeCrumb(),
    {label: semesterLabel, href: pageUrl('index.html', {}, semesterAnchor(semester.id))},
    {label: moduleLabel(module)}
  ]);

  return [
    el('header', {class: 'page-header'},
      el('h1', {}, moduleCode(module, {large: true}), el('span', {}, localized(module.title))),
      el('p', {class: 'page-header__meta'},
        el('span', {}, semesterLabel),
        el('span', {}, tCount('count.documents', resourcesOf(catalogue, module.id).length))
      )
    ),
    el('section', {class: 'section', 'aria-labelledby': 'types-title'},
      el('div', {class: 'section__head'}, el('h2', {id: 'types-title'}, t('module.types.title'))),
      el('ul', {class: 'row-list', role: 'list'}, RESOURCE_TYPES.map(type => typeRow(catalogue, module, type)))
    )
  ];
}

// Shown when ?id= is missing or matches no module.
function moduleNotFound() {
  document.title = `${t('module.notFound.title')} | ${t('site.name')}`;
  renderBreadcrumb([homeCrumb(), {label: t('module.notFound.title')}]);
  return [
    el('header', {class: 'page-header'},
      el('h1', {}, t('module.notFound.title')),
      el('p', {class: 'lede'}, t('module.notFound.text'))
    ),
    el('p', {}, actionLink({href: pageUrl('index.html'), label: t('module.notFound.action')}))
  ];
}

async function start() {
  renderLayout({breadcrumb: [homeCrumb()]});

  const content = el('div', {class: 'page-width'}, loadingState());
  main.replaceChildren(content);

  try {
    const catalogue = await loadCatalogue();
    renderSampleNotice(catalogue);
    const module = moduleId ? findModule(catalogue, moduleId) : null;
    content.replaceChildren(...(module ? modulePage(catalogue, module) : moduleNotFound()));
  } catch (error) {
    console.error(error);
    content.replaceChildren(
      errorState({title: t('error.title'), text: t('error.text'), action: {href: location.href, label: t('error.action')}})
    );
  }
}

start();
