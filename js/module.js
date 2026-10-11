// Module page: module.html?id=<module-id>
//
// The address also remembers the view, so a link can be shared or the page reloaded as is:
//   type=cours|td|tp|examen   the open tab
//   year=2024-2025            the academic-year filter (Examens only)
//   session=normal|rattrapage the session filter (Examens only)
import {el} from './dom.js';
import {t, tCount, typeset, pageUrl} from './i18n.js';
import {RESOURCE_TYPES, SESSIONS, loadCatalogue, findModule, findSemester, resourcesOf, sortedResources, semesterAnchor} from './catalogue.js';
import {renderLayout, renderBreadcrumb, renderCatalogueFacts, renderFooter, setDescription, setNoIndex, homeCrumb} from './layout.js';
import {moduleCode, loadingState, loadErrorState, emptyState, actionLink} from './components.js';
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
  // Safari refuses this call when it is made very often (an arrow key held down on the tabs).
  // The view is drawn all the same; only the address stays one step behind.
  try {
    history.replaceState(null, '', url);
  } catch (error) {
    // Refused: nothing else to do.
  }
}

// A labelled <select> for one filter, 'year' or 'session'. `options` is a list of [value, text].
function selectField(name, options) {
  const id = `filter-${name}`;
  const select = el('select', {id},
    [['', t('filter.all')], ...options].map(([value, text]) =>
      el('option', {value, selected: value === filters[name]}, text))
  );
  return {name, select, field: el('div', {class: 'field'}, el('label', {for: id}, t(`filter.${name}`)), select)};
}

// Exams are listed newest first, under one heading per academic year.
function examsByYear(exams) {
  const years = [...new Set(exams.map(exam => exam.academicYear))];
  return years.map(year =>
    el('section', {class: 'year-group'},
      el('h2', {class: 'year-group__title'}, year),
      resourceList(exams.filter(exam => exam.academicYear === year))
    )
  );
}

function examPanel(panel, exams) {
  // Each filter offers only what this module's exams really have, and is shown only when
  // there is a choice to make: at least two years, or both sessions.
  const years = [...new Set(exams.map(exam => exam.academicYear))];
  const sessions = SESSIONS.filter(value => exams.some(exam => exam.session === value));
  const options = {
    year: years.length > 1 ? years.map(value => [value, value]) : [],
    session: sessions.length > 1 ? sessions.map(value => [value, t(`filter.session.${value}`)]) : []
  };
  // A value from the address that is not on offer is dropped, and the address corrected.
  for (const name of Object.keys(filters)) {
    if (!options[name].some(([value]) => value === filters[name])) filters[name] = '';
  }
  setParams(filters);

  const fields = Object.keys(filters).filter(name => options[name].length > 0).map(name => selectField(name, options[name]));
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
    // With no filter set, the Examens tab already shows this number. With no match, the message
    // below says so. In both cases the count is only read aloud, not printed a second time.
    status.classList.toggle('visually-hidden', !filtered || shown.length === 0);
    status.textContent = tCount('count.exams', shown.length);
    results.replaceChildren(...(shown.length > 0
      ? examsByYear(shown)
      : [emptyState({title: t('filter.none.title'), text: t('filter.none.text')})]
    ));
  }

  function change() {
    for (const {name, select} of fields) filters[name] = select.value;
    setParams(filters);
    draw();
  }

  for (const {select} of fields) select.addEventListener('change', change);
  reset.addEventListener('click', () => {
    for (const {select} of fields) select.value = '';
    change();
    // The reset button has just been hidden; keep keyboard focus inside the filters.
    fields[0].select.focus();
  });

  // Drawn before it is attached: the tab has just said how many exams there are, so the count
  // is not announced a second time on arrival. Later changes of a filter are announced.
  draw();
  panel.replaceChildren(...[
    fields.length > 0 && el('fieldset', {class: 'filters'},
      el('legend', {class: 'visually-hidden'}, t('filter.legend')),
      el('div', {class: 'filters__row'}, fields.map(({field}) => field)),
      // The count and the reset button share one line, so a filtered list starts as high as it can.
      el('div', {class: 'filters__summary'}, status, reset)
    ),
    results
  ].filter(Boolean));
}

function modulePage(catalogue, module) {
  const semester = findSemester(catalogue, module.semester);
  const total = resourcesOf(catalogue, module.id).length;

  const name = typeset(module.title.fr);
  document.title = t('module.docTitle', {abbr: module.abbr, title: name});
  setDescription(t('module.description', {abbr: module.abbr, title: name}));
  renderBreadcrumb([
    homeCrumb(),
    {label: typeset(semester.label.fr), href: pageUrl('index.html', {}, semesterAnchor(semester.id))}
  ]);

  // The semester is in the breadcrumb and each tab shows its own count, so the title stands alone.
  const header = el('header', {class: 'page-header'},
    el('h1', {}, moduleCode(module, {large: true}), ' ', name)
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
    // An empty panel holds nothing to focus, so the panel itself is the Tab stop after the tabs.
    // A panel with documents is not one: Tab goes straight to its first control.
    if (resources.length === 0) panel.tabIndex = 0;
    else panel.removeAttribute('tabindex');
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
      // Read by screen readers after the label: "Cours, 5 documents".
      countLabel: t('list.separator') + tCount('count.documents', byType[type].length)
    })),
    selected: first,
    onSelect(type, panel) {
      const onExams = type === 'examen';
      setParams({type, year: onExams ? filters.year : '', session: onExams ? filters.session : ''});
      drawPanel(type, panel);
    }
  });
  drawPanel(first, tabs.panel);
  // Tidy the address on arrival: an unknown type is dropped, and so are exam filters when
  // another tab is open. A shared link then carries only what is shown.
  setParams({type: RESOURCE_TYPES.includes(requested) ? requested : '', ...(first === 'examen' ? {} : {year: '', session: ''})});

  return [header, tabs.tablist, tabs.panel];
}

// Shown when ?id= is missing or matches no module.
function moduleNotFound() {
  document.title = `${t('module.notFound.title')} | ${t('site.name')}`;
  setNoIndex();
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
    renderCatalogueFacts(catalogue);
    // Module IDs are lower case; a link typed as "ASD3" still finds its module.
    const moduleId = params.get('id')?.trim().toLowerCase();
    const module = moduleId ? findModule(catalogue, moduleId) : null;
    content.replaceChildren(...(module ? modulePage(catalogue, module) : moduleNotFound()));
  } catch (error) {
    console.error(error);
    // The module's name is not known, so the page gets a plain title and heading of its own.
    document.title = `${t('error.heading')} | ${t('site.name')}`;
    renderFooter();
    content.replaceChildren(
      el('header', {class: 'page-header'}, el('h1', {}, t('error.heading'))),
      loadErrorState()
    );
  }
}

start();
