// 404 page: shown by the host for an address that matches no page of the site.
// 404.html sets a <base> first, so the links below resolve from the start of the site.
import {el} from './dom.js';
import {t, pageUrl} from './i18n.js';
import {renderLayout, renderFooter, homeCrumb} from './layout.js';
import {actionLink} from './components.js';

document.title = t('notFound.docTitle');
renderLayout({breadcrumb: [homeCrumb()]});
// Nothing is loaded on this page, so the footer can be drawn at once.
renderFooter();

document.getElementById('main').replaceChildren(
  el('div', {class: 'page-width'},
    el('header', {class: 'page-header'},
      el('h1', {}, t('notFound.title')),
      el('p', {class: 'lede'}, t('notFound.text'))
    ),
    el('p', {}, actionLink({href: pageUrl('index.html'), label: t('notFound.action')}))
  )
);
