// The GitHub login of the admin dashboard, through Netlify's OAuth provider.
//
// The Netlify project has GitHub installed as an authentication provider (README, "One-time setup
// of the GitHub login"). Netlify keeps the OAuth app's secret and talks to GitHub; this page only
// opens Netlify's window and receives the access token that window posts back. The exchange is the
// one of Netlify's own browser library, netlify-auth-providers, which Netlify's documentation
// points to and which Decap CMS carries a copy of:
//   1. open https://api.netlify.com/auth?provider=github&site_id=<the site's host>&scope=<scope>;
//   2. the window posts "authorizing:github"; answer with the same text, to that window;
//   3. the window posts "authorization:github:success:{"token":"..."}", or "...:error:{...}".
// A message is read only when it comes from https://api.netlify.com.
//
// The browser's window is passed in, so node scripts/test-admin.cjs runs this code against a stand-in.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.L2NetlifyAuth = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const NETLIFY = 'https://api.netlify.com';
  // The size netlify-auth-providers gives GitHub's window.
  const WINDOW = {width: 960, height: 600};
  // How often to look whether the maintainer closed the window, and how long an answer may still follow.
  const WATCH_MS = 500;
  const GRACE_MS = 1000;

  const failure = (kind, message) => Object.assign(new Error(message), {kind});

  // siteId is the host Netlify knows the site by: location.hostname on the published site.
  function create({window, siteId}) {
    // Opens the login window. Call it straight from a click, or the browser blocks the window.
    // Resolves with the access token. Rejects with an error whose kind is 'blocked' (no window
    // opened), 'cancelled' (window closed before the end) or 'refused' (Netlify or GitHub said no).
    function login({scope}) {
      return new Promise((resolve, reject) => {
        const left = Math.max(0, Math.round(window.screen.width / 2 - WINDOW.width / 2));
        const top = Math.max(0, Math.round(window.screen.height / 2 - WINDOW.height / 2));
        const address = `${NETLIFY}/auth?provider=github&site_id=${encodeURIComponent(siteId)}&scope=${encodeURIComponent(scope)}`;
        const popup = window.open(address, 'Netlify Authorization', `width=${WINDOW.width}, height=${WINDOW.height}, top=${top}, left=${left}`);
        if (!popup) {
          reject(failure('blocked', "La fenêtre de connexion n'a pas pu s'ouvrir."));
          return;
        }

        let greeted = false;
        let settled = false;
        let watch = null;
        const finish = (settle, value) => {
          if (settled) return;
          settled = true;
          window.removeEventListener('message', receive, false);
          window.clearInterval(watch);
          try { popup.close(); } catch { /* already closed */ }
          settle(value);
        };

        function receive(event) {
          if (event.origin !== NETLIFY || typeof event.data !== 'string') return;
          if (event.data === 'authorizing:github') {
            greeted = true;
            popup.postMessage(event.data, event.origin);
            return;
          }
          // As in Netlify's library, a result counts only after the greeting above.
          const result = greeted && event.data.match(/^authorization:github:(success|error):([\s\S]+)$/);
          if (!result) return;
          let data = null;
          try { data = JSON.parse(result[2]); } catch { /* not JSON: treated as a refusal */ }
          if (result[1] === 'success' && data && typeof data.token === 'string' && data.token) finish(resolve, data.token);
          else finish(reject, failure('refused', "GitHub ou Netlify a refusé la connexion."));
        }

        window.addEventListener('message', receive, false);
        watch = window.setInterval(() => {
          if (!popup.closed) return;
          window.clearInterval(watch);
          window.setTimeout(() => finish(reject, failure('cancelled', 'La fenêtre de connexion a été fermée avant la fin.')), GRACE_MS);
        }, WATCH_MS);
        if (typeof popup.focus === 'function') popup.focus();
      });
    }

    return {login};
  }

  return {create, NETLIFY};
});
