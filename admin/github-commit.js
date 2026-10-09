// Reads the catalogue from GitHub and writes one admin change back as a single commit:
// the catalogue, the new PDFs and the removed PDFs together. The repository therefore never
// holds a record without its file or a file without its record, which node scripts/doctor.cjs
// refuses on every Netlify build.
//
// It uses GitHub's REST API (Git database) with the token of the logged-in maintainer.
// fetch is passed in, so node scripts/test-admin.cjs runs the same code against a stand-in.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.L2GitHubStore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CATALOGUE_PATH = 'data/resources.json';
  const FILE = {mode: '100644', type: 'blob'};

  // What to tell the maintainer when GitHub refuses a request.
  async function refusal(response) {
    let detail = '';
    try { detail = (await response.json()).message ?? ''; } catch { /* GitHub sent no JSON */ }
    const error = new Error(
      response.status === 401 ? 'GitHub ne reconnaît plus votre session. Déconnectez-vous, puis reconnectez-vous.'
        : response.status === 404 ? "GitHub ne trouve pas le dépôt ou la branche. Vérifiez que votre compte a le droit d'écrire dans le dépôt."
          : `GitHub a refusé la demande (${response.status}${detail ? ` : ${detail}` : ''}).`
    );
    error.status = response.status;
    return error;
  }

  function create({fetch, apiRoot, repo, branch, getToken}) {
    async function call(method, path, {body, raw = false} = {}) {
      const token = await getToken();
      if (!token) throw new Error('Session GitHub introuvable. Déconnectez-vous, puis reconnectez-vous.');
      let response;
      try {
        response = await fetch(`${apiRoot}/repos/${repo}${path}`, {
          method,
          // GitHub lets a browser reuse an answer for a minute; a branch read must never be that old.
          cache: 'no-store',
          headers: {
            Authorization: `token ${token}`,
            Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
            ...(body ? {'Content-Type': 'application/json; charset=utf-8'} : {})
          },
          body: body ? JSON.stringify(body) : undefined
        });
      } catch {
        throw new Error('GitHub est injoignable. Vérifiez votre connexion, puis réessayez.');
      }
      if (!response.ok) throw await refusal(response);
      return raw ? response.text() : response.json();
    }

    // The catalogue as it is on the branch now, and the commit it was read from.
    async function read() {
      const head = (await call('GET', `/git/ref/heads/${branch}`)).object.sha;
      return {head, raw: await call('GET', `/contents/${CATALOGUE_PATH}?ref=${head}`, {raw: true})};
    }

    // head is the commit read() returned. The new commit is built on it, and the branch moves only
    // if it still points there, so a change made elsewhere in the meantime is never overwritten.
    //   files    [{path, base64}] PDFs to add or replace
    //   deletes  [path] PDFs to remove
    async function commit({head, raw, files, deletes, message}) {
      const parent = await call('GET', `/git/commits/${head}`);
      const catalogue = await call('POST', '/git/blobs', {body: {content: raw, encoding: 'utf-8'}});
      const tree = [{...FILE, path: CATALOGUE_PATH, sha: catalogue.sha}];
      for (const file of files) {
        const blob = await call('POST', '/git/blobs', {body: {content: file.base64, encoding: 'base64'}});
        tree.push({...FILE, path: file.path, sha: blob.sha});
      }
      // A null sha removes the file from the tree.
      for (const path of deletes) tree.push({...FILE, path, sha: null});
      const created = await call('POST', '/git/trees', {body: {base_tree: parent.tree.sha, tree}});
      const next = await call('POST', '/git/commits', {body: {message, tree: created.sha, parents: [head]}});
      try {
        await call('PATCH', `/git/refs/heads/${branch}`, {body: {sha: next.sha, force: false}});
      } catch (error) {
        if (error.status !== 422) throw error;
        throw new Error("Le dépôt a changé pendant l'enregistrement, qui a été annulé. Rechargez la page, puis refaites votre modification.");
      }
      return next.sha;
    }

    return {read, commit};
  }

  return {create};
});
