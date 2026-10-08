// The parts every page shares: skip link, header, language switch, sample-data notice,
// breadcrumb and footer. Each page has an empty <header data-site-header> and
// <footer data-site-footer>; this file fills them, so the markup lives in one place.
import {el} from './dom.js';
import {t, lang, languages, pageUrl, languageUrl, DEFAULT_LANG} from './i18n.js';
import {isSample} from './catalogue.js';

// Call once per page. `breadcrumb` is the first trail to show (see renderBreadcrumb).
export function renderLayout({breadcrumb}) {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');

  const main = document.getElementById('main');
  const skipLink = el('a', {class: 'skip-link', href: '#main'}, t('skip'));
  // Move focus by script: on 404.html a <base> is set, and a plain "#main" link would leave the page.
  skipLink.addEventListener('click', event => {
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
  });
  document.body.prepend(skipLink);

  header.replaceChildren(
    el('div', {class: 'site-header__inner page-width'},
      el('a', {class: 'site-brand', href: pageUrl('index.html')},
        el('span', {class: 'site-brand__name'}, t('site.name')),
        el('span', {class: 'site-brand__org'}, t('site.university'))
      ),
      languageSwitch(),
      searchForm()
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

// The search field, on every page. It is a plain form that opens search.html?q=..., so it works
// with the Enter key and needs no script of its own. On search.html, js/search.js makes it live.
function searchForm() {
  return el('form', {class: 'site-search', role: 'search', action: 'search.html', method: 'get'},
    el('label', {class: 'visually-hidden', for: 'site-search'}, t('search.label')),
    el('input', {
      id: 'site-search',
      type: 'search',
      name: 'q',
      value: new URLSearchParams(location.search).get('q') ?? '',
      placeholder: t('search.placeholder'),
      enterkeyhint: 'search'
    }),
    // Keeps the results in the reader's language.
    lang !== DEFAULT_LANG && el('input', {type: 'hidden', name: 'lang', value: lang}),
    el('button', {class: 'button', type: 'submit'}, t('search.submit'))
  );
}

// Call after the address changes without a reload (a tab or filter was chosen),
// so that switching language keeps the reader on the same view.
export function updateLanguageLinks() {
  for (const link of document.querySelectorAll('.lang-switch a')) link.href = languageUrl(link.lang);
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
