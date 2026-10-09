// Small pieces of interface shared by several pages.
import {el} from './dom.js';
import {t, tCount, localized, pageUrl} from './i18n.js';
import {resourcesOf} from './catalogue.js';

// The module abbreviation (ASD3, AO...), shown next to the module name everywhere.
// <bdi> keeps it left-to-right inside Arabic text.
export function moduleCode(module, {large = false} = {}) {
  return el('bdi', {class: large ? 'module-code module-code--lg' : 'module-code'}, module.abbr);
}

// One line of a module list. The abbreviation and the name are one link to the module page.
// After them come the number of documents and, when the module has exams, a shortcut that
// opens the module page on its Examens tab.
export function moduleRow(catalogue, module) {
  const name = localized(module.title);
  const hasExams = resourcesOf(catalogue, module.id, 'examen').length > 0;
  return el('li', {class: 'module'},
    el('a', {class: 'module__link', href: pageUrl('module.html', {id: module.id})},
      moduleCode(module),
      el('span', {class: 'module__title'}, name)
    ),
    el('p', {class: 'module__meta'},
      el('span', {class: 'module__count'}, tCount('count.documents', resourcesOf(catalogue, module.id).length)),
      hasExams && el('a', {class: 'module__shortcut', href: pageUrl('module.html', {id: module.id, type: 'examen'})},
        t('type.examen'),
        // Several rows have this link, so screen readers also hear which module it belongs to.
        el('span', {class: 'visually-hidden'}, t('link.target', {name: `${module.abbr} ${name}`}))
      )
    )
  );
}

export function loadingState() {
  return el('p', {class: 'status status--loading', role: 'status'}, t('loading'));
}

// An error the reader can act on: what failed, what to do, and one action.
export function errorState({title, text, action}) {
  return el('div', {class: 'status status--error', role: 'alert'},
    el('p', {class: 'status__title'}, title),
    el('p', {}, text),
    action && el('p', {}, actionLink(action))
  );
}

// Shown when the catalogue cannot be loaded. Its link loads the page again. The address leaves out
// any #fragment: a link to the same address with the same fragment would only jump within the page.
export function loadErrorState() {
  return errorState({
    title: t('error.title'),
    text: t('error.text'),
    action: {href: location.pathname + location.search, label: t('error.action')}
  });
}

// A link that stands on its own line, with a tap target tall enough for a thumb.
export function actionLink({href, label}) {
  return el('a', {class: 'action-link', href}, label);
}

// "Signaler une erreur" opens the report form, carrying a missing document's details when known.
// `name` completes the link's name for screen readers when it stands beside a document.
export function reportLink({module = null, document = null, name = null} = {}) {
  return el('a', {class: 'action-link', href: pageUrl('report.html', {
    ...(module && {module}),
    ...(document && {document})
  })},
    t('report.label'),
    name && el('span', {class: 'visually-hidden'}, t('link.target', {name}))
  );
}

export function emptyState({title, text}) {
  return el('div', {class: 'empty'},
    el('p', {class: 'empty__title'}, title),
    text && el('p', {}, text)
  );
}
