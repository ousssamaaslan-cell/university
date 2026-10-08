// Module page: module.html?id=<module-id>
//
// The address also remembers the view, so a link can be shared or the page reloaded as is:
//   type=cours|td|tp|examen   the open tab
//   year=2024-2025            the academic-year filter (Examens only)
//   session=normal|rattrapage the session filter (Examens only)
import {el} from './dom.js';
import {t, tCount, localized, pageUrl} from './i18n.js';
import {RESOURCE_TYPES, SESSIONS, loadCatalogue, findModule, findSemester, resourcesOf, sortedResources, semesterAnchor} from './catalogue.js';
import {renderLayout, renderBreadcrumb, renderSampleNotice, homeCrumb, updateLanguageLinks} from './layout.js';
import {moduleCode, loadingState, errorState, emptyState, actionLink} from './components.js';
import {createTabs} from './tabs.js';
import {resourceList} from './resource-list.js';

const main = document.getElementById('main');
const params = new URLSearchParams(location.search);

// The exam filters. They are kept while the reader visits another tab and comes back.
const filters = {
  year: params.get('year') ?? '',
  session: SESSIONS.includes(params.get('session')) ? params.get('session') : ''
};

// Writes the view into the address without reloading. An empty value removes the parameter.
function setParams(changes) {
  const url = new URL(location.href);
  for (const [name, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
  }
  history.replaceState(null, '', url);
  updateLanguageLinks();
}

// A labelled <select>. `options` is a list of [value, text].
function selectField(id, label, options, current) {
  const select = el('select', {id},
    options.map(([value, text]) => el('option', {value, selected: value === current}, text))
  );
  return {select, field: el('div', {class: 'field'}, el('label', {for: id}, label), select)};
}

// Exams are listed newest first, under one heading per academic year.
function examsByYear(exams) {
  const years = [...new Set(exams.map(exam => exam.academicYear))];
  return years.map(year =>
    el('section', {class: 'year-group'},
      el('h2', {class: 'year-group__title'}, el('bdi', {}, year)),
      resourceList(exams.filter(exam => exam.academicYear === year))
    )
  );
}

function examPanel(panel, exams) {
  const years = [...new Set(exams.map(exam => exam.academicYear))];
  if (!years.includes(filters.year)) filters.year = '';

  const year = selectField('filter-year', t('filter.year'),
    [['', t('filter.all')], ...years.map(value => [value, value])], filters.year);
  const session = selectField('filter-session', t('filter.session'),
    [['', t('filter.all')], ...SESSIONS.map(value => [value, t(`filter.session.${value}`)])], filters.session);
  const reset = el('button', {class: 'button', type: 'button'}, t('filter.reset'));
  // Announces the number of exams shown each time a filter changes.
  const status = el('p', {class: 'filters__status', role: 'status'});
  const results = el('div', {});

  function draw() {
    const shown = exams.filter(exam =>
      (!filters.year || exam.academicYear === filters.year) &&
      (!filters.session || exam.session === filters.session)
    );
    const filtered = Boolean(filters.year || filters.session);
    reset.hidden = !filtered;
    // With no filter set, the Examens tab already shows this number, so it is only read aloud.
    status.classList.toggle('visually-hidden', !filtered);
    status.textContent = tCount('count.exams', shown.length);
    results.replaceChildren(...(shown.length > 0
      ? examsByYear(shown)
      : [emptyState({title: t('filter.none.title'), text: t('filter.none.text')})]
    ));
  }

  function change() {
    filters.year = year.select.value;
    filters.session = session.select.value;
    setParams({year: filters.year, session: filters.session});
    draw();
  }

  year.select.addEventListener('change', change);
  session.select.addEventListener('change', change);
  reset.addEventListener('click', () => {
    year.select.value = '';
    session.select.value = '';
    change();
    // The reset button has just been hidden; keep keyboard focus inside the filters.
    year.select.focus();
  });

  panel.replaceChildren(
    el('fieldset', {class: 'filters'},
      el('legend', {class: 'visually-hidden'}, t('filter.legend')),
      el('div', {class: 'filters__row'}, year.field, session.field, reset)
    ),
    status,
    results
  );
  draw();
}

function modulePage(catalogue, module) {
  const semester = findSemester(catalogue, module.semester);
  const total = resourcesOf(catalogue, module.id).length;

  document.title = t('module.docTitle', {abbr: module.abbr, title: localized(module.title)});
  renderBreadcrumb([
    homeCrumb(),
    {label: localized(semester.label), href: pageUrl('index.html', {}, semesterAnchor(semester.id))}
  ]);

  // The semester is in the breadcrumb and each tab shows its own count, so the title stands alone.
  const header = el('header', {class: 'page-header'},
    el('h1', {}, moduleCode(module, {large: true}), ' ', localized(module.title))
  );

  if (total === 0) {
    return [header, emptyState({title: t('module.empty.title'), text: t('module.empty.text')})];
  }

  const byType = Object.fromEntries(RESOURCE_TYPES.map(type => [type, sortedResources(catalogue, module.id, type)]));

  function drawPanel(type, panel) {
    const resources = byType[type];
    if (resources.length === 0) panel.replaceChildren(emptyState({title: t(`empty.${type}`), text: t('empty.text')}));
    else if (type === 'examen') examPanel(panel, resources);
    else panel.replaceChildren(resourceList(resources));
  }

  // Open the tab named in the address, otherwise the first one that has documents.
  const requested = params.get('type');
  const first = RESOURCE_TYPES.includes(requested) ? requested : RESOURCE_TYPES.find(type => byType[type].length > 0);

  const tabs = createTabs({
    label: t('tabs.label'),
    tabs: RESOURCE_TYPES.map(type => ({
      id: type,
      label: t(`type.${type}`),
      count: byType[type].length,
      countLabel: tCount('count.documents', byType[type].length)
    })),
    selected: first,
    onSelect(type, panel) {
      const onExams = type === 'examen';
      setParams({type, year: onExams ? filters.year : '', session: onExams ? filters.session : ''});
      drawPanel(type, panel);
    }
  });
  drawPanel(first, tabs.panel);

  return [header, tabs.tablist, tabs.panel];
}

// Shown when ?id= is missing or matches no module.
function moduleNotFound() {
  document.title = `${t('module.notFound.title')} | ${t('site.name')}`;
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
    const moduleId = params.get('id');
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
