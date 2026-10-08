// The parts every page shares: skip link, header, language switch, sample-data notice,
// breadcrumb and footer. Each page has an empty <header data-site-header> and
// <footer data-site-footer>; this file fills them, so the markup lives in one place.
import {el} from './dom.js';
import {t, lang, languages, pageUrl, languageUrl} from './i18n.js';
import {isSample} from './catalogue.js';

// Call once per page. `breadcrumb` is the first trail to show (see renderBreadcrumb).
export function renderLayout({breadcrumb}) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');

  document.body.prepend(el('a', {class: 'skip-link', href: '#main'}, t('skip')));

  header.replaceChildren(
    el('div', {class: 'site-header__inner page-width'},
      el('a', {class: 'site-brand', href: pageUrl('index.html')},
        el('span', {class: 'site-brand__name'}, t('site.name')),
        el('span', {class: 'site-brand__org'}, t('site.university'))
      ),
      languageSwitch()
    )
  );

  footer.replaceChildren(
    el('div', {class: 'site-footer__inner page-width'},
      el('p', {class: 'site-footer__name'}, t('site.name')),
      el('p', {}, t('site.university')),
      el('p', {}, t('site.about'))
    )
  );

  renderBreadcrumb(breadcrumb);
}

function languageSwitch() {
  return el('nav', {class: 'lang-switch', 'aria-label': t('lang.label')},
    el('ul', {role: 'list'},
      languages.map(language =>
        el('li', {},
          el('a', {
            href: languageUrl(language.code),
            lang: language.code,
            hreflang: language.code,
            'aria-current': language.code === lang ? 'true' : null
          }, language.name)
        )
      )
    )
  );
}

// Draws the breadcrumb under the header, replacing any earlier one.
// `trail` is a list of {label, href}; the last item is the current page and needs no href.
// A label is a string, or a list of strings and nodes.
export function renderBreadcrumb(trail) {
  const items = trail.map((item, index) => {
    const isCurrent = index === trail.length - 1;
    return el('li', {},
      isCurrent
        ? el('span', {'aria-current': 'page'}, item.label)
        : el('a', {href: item.href}, item.label)
    );
  });
  const nav = el('nav', {class: 'breadcrumb page-width', 'aria-label': t('breadcrumb.label'), 'data-breadcrumb': true},
    el('ol', {role: 'list'}, items)
  );

  const existing = document.querySelector('[data-breadcrumb]');
  if (existing) existing.replaceWith(nav);
  else document.getElementById('main').before(nav);
}

// The first step of every trail.
export function homeCrumb() {
  return {label: t('breadcrumb.home'), href: pageUrl('index.html')};
}

// While the catalogue holds build-phase sample records, say so on every page.
export function renderSampleNotice(catalogue) {
  if (!catalogue.resources.some(isSample) || document.querySelector('[data-sample-notice]')) return;
  document.querySelector('[data-site-header]').after(
    el('div', {class: 'notice', role: 'note', 'data-sample-notice': true},
      el('p', {class: 'page-width'}, el('strong', {}, t('sample.title')), ' ', t('sample.text'))
    )
  );
}
