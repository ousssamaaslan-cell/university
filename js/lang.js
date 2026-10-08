// Picks the page language before anything is drawn, so an Arabic page never flashes left-to-right.
// Order: ?lang= in the address, then the last choice saved in this browser, then French.
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

  try {
    localStorage.setItem(storageKey, lang);
  } catch (error) {
    // Private browsing or blocked storage: the ?lang= parameter on links still carries the choice.
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
})();
