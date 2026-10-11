// The page scripts need a browser from about 2020 or later. In an older one they do not run at
// all and the page would stay blank, so mark it here: css/styles.css then shows the short
// message that every page carries for this case.
// This is a plain script (not a module), so that an old browser runs it too.
(function () {
  if (!Element.prototype.replaceChildren) document.documentElement.setAttribute('data-old-browser', '');
})();
