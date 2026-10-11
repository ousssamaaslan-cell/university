// The parts every page shares: skip link, header, search field, sample-data notice,
// breadcrumb and footer. Each page has an empty <header data-site-header> and
// <footer data-site-footer>; this file fills them, so the markup lives in one place.
import {el} from './dom.js';
import {t, pageUrl, formatDate} from './i18n.js';
import {isSample} from './catalogue.js';
import {reportLink} from './components.js';

// Call once per page. `breadcrumb` is the trail to show first (see renderBreadcrumb).
// The footer is drawn later, by renderFooter or renderCatalogueFacts.
export function renderLayout({breadcrumb}) {
  const header = document.querySelector('[data-site-header]');

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
      searchForm()
    )
  );

  renderBreadcrumb(breadcrumb);
}

// Draws the footer. Call it when the page content is drawn or has failed to load, not before:
// while the page is still almost empty the footer would sit in view, then jump down the page
// when the list arrives. With a catalogue, the footer also gives the date of the last update.
export function renderFooter(catalogue = null) {
  // The date comes from the server (js/catalogue.js). When the server gives none, the line stays hidden.
  const updated = catalogue?.lastModified ?? null;
  document.querySelector('[data-site-footer]').replaceChildren(
    el('div', {class: 'site-footer__inner page-width'},
      el('p', {class: 'site-footer__name'}, t('site.name')),
      // Who runs the site: students, not the university (docs/project-brief.md).
      el('p', {}, t('footer.status')),
      el('p', {'data-last-update': true, hidden: !updated},
        updated && [t('footer.updated'), ' ', el('time', {datetime: updated.toISOString()}, formatDate(updated))]
      ),
      el('p', {class: 'site-footer__report'}, t('report.prompt'), ' ', reportLink())
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
      enterkeyhint: 'search',
      // Long enough for any real search, short enough for an address every host accepts.
      maxlength: '100'
    }),
    el('button', {class: 'button', type: 'submit'}, t('search.submit'))
  );
}

// Draws the breadcrumb under the header, replacing any earlier one.
// `trail` is a list of {label, href}: the pages above the current one, each a link.
// The current page is not repeated, because its name is the title just below.
// The home page has nothing above it, so it passes an empty list and gets no breadcrumb.
export function renderBreadcrumb(trail) {
  const existing = document.querySelector('[data-breadcrumb]');
  if (trail.length === 0) {
    existing?.remove();
    return;
  }

  const nav = el('nav', {class: 'breadcrumb page-width', 'aria-label': t('breadcrumb.label'), 'data-breadcrumb': true},
    el('ol', {role: 'list'}, trail.map(item => el('li', {}, el('a', {href: item.href}, item.label))))
  );
  if (existing) existing.replaceWith(nav);
  else document.getElementById('main').before(nav);
}

// The first step of every trail below the home page.
export function homeCrumb() {
  return {label: t('breadcrumb.home'), href: pageUrl('index.html')};
}

// Call once the catalogue has loaded, just before drawing the page content. It draws what the
// catalogue tells every page: the sample-data notice, and the footer with the date of the last update.
export function renderCatalogueFacts(catalogue) {
  renderSampleNotice(catalogue);
  renderFooter(catalogue);
}

// While the catalogue holds build-phase sample records, say so on every page.
// It is a labelled <aside>, so screen readers find it among the page's regions.
function renderSampleNotice(catalogue) {
  if (!catalogue.resources.some(isSample) || document.querySelector('[data-sample-notice]')) return;
  document.querySelector('[data-site-header]').after(
    el('aside', {class: 'notice', 'aria-label': t('sample.label'), 'data-sample-notice': true},
      el('div', {class: 'page-width'}, el('p', {}, el('strong', {}, t('sample.title')), ' ', t('sample.text')))
    )
  );
}

// The page's description for search engines.
export function setDescription(text) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = el('meta', {name: 'description'});
    document.head.append(meta);
  }
  meta.content = text;
}

// Asks search engines not to list this view: an unknown module, for example.
export function setNoIndex() {
  if (!document.querySelector('meta[name="robots"]')) document.head.append(el('meta', {name: 'robots', content: 'noindex'}));
}
