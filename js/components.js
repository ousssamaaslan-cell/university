// Small pieces of interface shared by several pages.
import {el} from './dom.js';
import {t, localized} from './i18n.js';

// The module abbreviation (ASD3, AO...), shown next to the module name everywhere.
// <bdi> keeps it left-to-right inside Arabic text.
export function moduleCode(module, {large = false} = {}) {
  return el('bdi', {class: large ? 'module-code module-code--lg' : 'module-code'}, module.abbr);
}

// Abbreviation and name as plain inline text, for breadcrumbs and titles.
export function moduleLabel(module) {
  return [el('bdi', {}, module.abbr), ' ', localized(module.title)];
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

// A link that stands on its own line, with a tap target tall enough for a thumb.
export function actionLink({href, label}) {
  return el('a', {class: 'action-link', href}, label);
}

export function emptyState({title, text}) {
  return el('div', {class: 'empty'},
    el('p', {class: 'empty__title'}, title),
    text && el('p', {}, text)
  );
}
