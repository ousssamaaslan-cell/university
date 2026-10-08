// Small pieces of interface shared by several pages.
import {el} from './dom.js';
import {t, tCount, localized, pageUrl} from './i18n.js';

// The module abbreviation (ASD3, AO...), shown next to the module name everywhere.
// <bdi> keeps it left-to-right inside Arabic text.
export function moduleCode(module, {large = false} = {}) {
  return el('bdi', {class: large ? 'module-code module-code--lg' : 'module-code'}, module.abbr);
}

// One line of a module list: abbreviation, name and number of documents, linking to the module page.
export function moduleRow(module, documentCount) {
  return el('li', {},
    el('a', {class: 'row', href: pageUrl('module.html', {id: module.id})},
      moduleCode(module),
      el('span', {class: 'row__title'}, localized(module.title)),
      el('span', {class: 'row__meta'}, tCount('count.documents', documentCount))
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

// A link that stands on its own line, with a tap target tall enough for a thumb.
export function actionLink({href, label}) {
  return el('a', {class: 'action-link', href}, label);
}

// The maintainer's address for "Signaler une erreur" (docs/project-brief.md). Change it here only.
const REPORT_EMAIL = 'ousssamaaslan@gmail.com';

// "Signaler une erreur": opens the reader's mail app with a message to the maintainer.
// The message already says which page the reader was on and, for a missing PDF, which file.
// `name` completes the link's name for screen readers when it stands beside a document.
export function reportLink({file = null, name = null} = {}) {
  const address = () => {
    const body = [
      t('report.body.prompt'), '', '',
      t('report.body.page', {url: location.href}),
      file && t('report.body.file', {path: file})
    ].filter(line => typeof line === 'string').join('\r\n');
    return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(t('report.subject'))}&body=${encodeURIComponent(body)}`;
  };
  const link = el('a', {class: 'action-link', href: address()},
    t('report.label'),
    name && el('span', {class: 'visually-hidden'}, t('report.target', {name}))
  );
  // Tabs and filters change the page address without a reload, so read it again at the click.
  link.addEventListener('click', () => {
    link.href = address();
  });
  return link;
}

export function emptyState({title, text}) {
  return el('div', {class: 'empty'},
    el('p', {class: 'empty__title'}, title),
    text && el('p', {}, text)
  );
}
