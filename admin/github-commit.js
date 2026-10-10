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
  // The only files a commit may add, replace or remove beside the catalogue:
  // pdfs/<semester>/<module-id>/<resource-id>.pdf. A path with "..", a backslash, a leading slash
  // or another folder does not have this shape.
  const PDF_PATH = /^pdfs\/(?:S3|S4)\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;
  const isPdfPath = path => typeof path === 'string' && PDF_PATH.test(path);

  // An error the admin can explain. Its kind says what happened:
  //   'session'   there is no token, or GitHub no longer accepts it
  //   'access'    the account may not write to the repository
  //   'network'   GitHub was not reached
  //   'conflict'  the branch moved while the commit was being made
  //   'path'      a file outside the catalogue and the PDF folders was about to be written
  //   'limit'     GitHub is limiting requests for now
  //   'missing', 'github'   anything else GitHub refused
  const failure = (kind, message, more = {}) => Object.assign(new Error(message), {kind}, more);

  // What to tell the maintainer when GitHub refuses a request.
  async function refusal(response, writing) {
    let detail = '';
    try { detail = (await response.json()).message ?? ''; } catch { /* GitHub sent no JSON */ }
    const status = response.status;
    const more = {status, detail};
    if (status === 401) return failure('session', 'GitHub ne reconnaît plus votre session. Déconnectez-vous, puis reconnectez-vous.', more);
    if (status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || /rate limit/i.test(detail))) {
      return failure('limit', 'GitHub limite le nombre de demandes pour le moment. Réessayez dans quelques minutes.', more);
    }
    // GitHub answers 404, not 403, to a write by an account that may only read a public repository.
    if (status === 403 || (status === 404 && writing)) return failure('access', "Votre compte GitHub n'a pas le droit d'écrire dans le dépôt.", more);
    if (status === 404) return failure('missing', "GitHub ne trouve pas le dépôt ou la branche. Vérifiez que votre compte a le droit d'écrire dans le dépôt.", more);
    return failure('github', `GitHub a refusé la demande (${status}${detail ? ` : ${detail}` : ''}).`, more);
  }

  function create({fetch, apiRoot, repo, branch, getToken}) {
    // as: 'json' (the default), 'text' or 'bytes' for a file's own content.
    // account: the request is about the logged-in account, not about the repository.
    async function call(method, path, {body, as = 'json', account = false} = {}) {
      const token = await getToken();
      if (!token) throw failure('session', 'Session GitHub introuvable. Déconnectez-vous, puis reconnectez-vous.');
      try {
        const response = await fetch(account ? `${apiRoot}${path}` : `${apiRoot}/repos/${repo}${path}`, {
          method,
          // GitHub lets a browser reuse an answer for a minute; a branch read must never be that old.
          cache: 'no-store',
          headers: {
            Authorization: `token ${token}`,
            Accept: as === 'json' ? 'application/vnd.github+json' : 'application/vnd.github.raw+json',
            ...(body ? {'Content-Type': 'application/json; charset=utf-8'} : {})
          },
          body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) throw await refusal(response, method !== 'GET');
        return await (as === 'bytes' ? response.blob() : as === 'text' ? response.text() : response.json());
      } catch (error) {
        if (error.kind) throw error;
        // fetch failed, or the answer was cut off while it was being read.
        throw failure('network', 'GitHub est injoignable. Vérifiez votre connexion, puis réessayez.');
      }
    }

    // The GitHub account the token belongs to.
    async function user() {
      return {login: (await call('GET', '/user', {account: true})).login};
    }

    // Whether that account may write to the repository.
    async function canWrite() {
      return (await call('GET', '')).permissions?.push === true;
    }

    // The catalogue as it is on the branch now, and the commit it was read from.
    async function read() {
      const head = (await call('GET', `/git/ref/heads/${branch}`)).object.sha;
      return {head, raw: await call('GET', `/contents/${CATALOGUE_PATH}?ref=${head}`, {as: 'text'})};
    }

    // Every file under pdfs/ in a commit: a Map of path -> {sha, size}. Only the pdfs/ folder is listed,
    // not the whole repository.
    async function pdfFiles(head) {
      const files = new Map();
      const commit = await call('GET', `/git/commits/${head}`);
      const top = await call('GET', `/git/trees/${commit.tree.sha}`);
      const folder = top.tree.find(entry => entry.path === 'pdfs' && entry.type === 'tree');
      if (!folder) return files;
      const listing = await call('GET', `/git/trees/${folder.sha}?recursive=1`);
      for (const entry of listing.tree) if (entry.type === 'blob') files.set(`pdfs/${entry.path}`, {sha: entry.sha, size: entry.size});
      return files;
    }

    // The bytes of one file, by the sha pdfFiles() gave. It is the file as the repository holds it
    // now, which the public site may not be showing yet.
    function fileContent(sha) {
      return call('GET', `/git/blobs/${sha}`, {as: 'bytes'});
    }

    // head is the commit read() returned. The new commit is built on it, and the branch moves only
    // if it still points there, so a change made elsewhere in the meantime is never overwritten.
    //   files    [{path, base64}] PDFs to add or replace
    //   deletes  [path] PDFs to remove
    async function commit({head, raw, files, deletes, message}) {
      for (const path of [...files.map(file => file.path), ...deletes]) {
        if (!isPdfPath(path)) throw failure('path', `Chemin refusé : « ${path} ». L'administration n'écrit que ${CATALOGUE_PATH} et les PDF rangés dans pdfs/<semestre>/<module>/.`);
      }
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
        // Never forced: GitHub refuses the move when the branch no longer points at head.
        await call('PATCH', `/git/refs/heads/${branch}`, {body: {sha: next.sha, force: false}});
      } catch (error) {
        // Until this request, nothing was visible on the branch. If it is the one that got lost,
        // the branch may or may not have moved: only a new read can tell.
        if (error.kind === 'network') error.uncertain = true;
        if (error.status === 422 && !/protect/i.test(error.detail ?? '')) {
          throw failure('conflict', "Le dépôt a changé pendant l'enregistrement, qui a été annulé. Rechargez la page, puis refaites votre modification.", {status: 422});
        }
        throw error;
      }
      return next.sha;
    }

    return {user, canWrite, read, pdfFiles, fileContent, commit};
  }

  return {create, isPdfPath, CATALOGUE_PATH};
});
