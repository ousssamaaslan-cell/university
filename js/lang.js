// Picks the page language before anything is drawn, so an Arabic page never flashes left-to-right.
// Order: ?lang= in the address, then the last switch choice saved in this browser, then French.
// This is a plain script (not a module) so it can run in <head> ahead of the stylesheet's first paint.
(function () {
  var supported = ['fr', 'ar'];
  var storageKey = 'l2-resources-lang';
  var lang = new URLSearchParams(location.search).get('lang');

  if (supported.indexOf(lang) === -1) {
    try {
      lang = localStorage.getItem(storageKey);
    } catch (error) {
      lang = null;
    }
  }
  if (supported.indexOf(lang) === -1) lang = 'fr';

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // The page scripts need a browser from about 2020 or later. In an older one they do not run at
  // all and the page would stay blank, so mark it here: css/styles.css then shows the short
  // message that every page carries for this case.
  if (!Element.prototype.replaceChildren) document.documentElement.setAttribute('data-old-browser', '');
})();
