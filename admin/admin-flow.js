// What happens after a click on "Publier", "Enregistrer" or "Supprimer définitivement":
// read the repository as it is now, apply the change to it, make one commit, and try once more
// if the branch moved in between.
//
// The store (GitHub, or the local preview) and the rules are passed in, so
// node scripts/test-admin.cjs runs the same code.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.L2AdminFlow = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const failure = (kind, message, more = {}) => Object.assign(new Error(message), {kind}, more);

  // The name Git gives to a file's content. GitHub lists it for every PDF, so a chosen file can
  // be compared with the one in the repository without downloading it.
  async function gitBlobSha(bytes) {
    const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
    const whole = new Uint8Array(header.length + bytes.length);
    whole.set(header);
    whole.set(bytes, header.length);
    const digest = await crypto.subtle.digest('SHA-1', whole);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // GitHub's API takes a file as base64 text.
  function toBase64(bytes) {
    let binary = '';
    for (let start = 0; start < bytes.length; start += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(start, start + 0x8000));
    return btoa(binary);
  }

  // A PDF starts with "%PDF-". The doctor makes the same test on every build.
  const startsLikePdf = bytes => bytes.length >= 5 && String.fromCharCode(...bytes.subarray(0, 5)) === '%PDF-';

  // Makes one change, in one commit. Returns {changed, plan, commit, attempts, pdfSha}; changed is
  // false, and nothing is committed, when the change leaves the repository as it is.
  //   change   what catalogue-rules.js planChange takes; change.pdf is {name} when a file was chosen
  //   readPdf  gives the chosen file's bytes as a Uint8Array; it is called once
  // It throws an error with a kind: one of github-commit.js, or 'invalid', 'file', 'duplicate' or
  // 'stale' from the rules, with problems (what to tell the maintainer) and duplicates.
  async function publish({store, rules, change, readPdf = null}) {
    let pdf = null;
    if (change.pdf) {
      const bytes = await readPdf();
      // What the rules check is the file as it will be committed, whatever the form believed.
      pdf = {facts: {name: change.pdf.name, size: bytes.length, isPdf: startsLikePdf(bytes), sha: await gitBlobSha(bytes)}, base64: toBase64(bytes)};
    }
    for (let attempt = 1; ; attempt++) {
      // Always the branch as it is now: the list on screen may be minutes old.
      const current = await store.read();
      const files = await store.pdfFiles(current.head);
      const plan = rules.planChange(current.raw, pdf ? {...change, pdf: pdf.facts} : change, files);
      if (plan.errors.length) throw failure(plan.code, plan.errors[0], {problems: plan.errors, duplicates: plan.duplicates ?? []});
      if (!plan.changed) return {changed: false, plan, commit: null, attempts: attempt, pdfSha: null};
      try {
        const commit = await store.commit({
          head: current.head,
          raw: plan.raw,
          files: plan.writes.map(write => ({path: write.to, base64: pdf.base64})),
          deletes: plan.deletes,
          message: rules.commitMessage(plan)
        });
        return {changed: true, plan, commit, attempts: attempt, pdfSha: plan.writes.length ? pdf.facts.sha : null};
      } catch (error) {
        // The branch moved between the read and the commit: read it again and apply the change
        // again, once. A second time, the maintainer is told to refresh. The branch is never forced.
        if (error.kind !== 'conflict' || attempt === 2) throw error;
      }
    }
  }

  return {publish, gitBlobSha, toBase64, startsLikePdf};
});
