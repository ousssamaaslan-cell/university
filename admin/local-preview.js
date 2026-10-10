// The dashboard on a local preview (http://localhost:...): it cannot log in to GitHub from there,
// so it works on a copy of the repository kept in this browser tab. Nothing is sent anywhere, and
// a reload starts again from the files on disk. It answers the same questions as github-commit.js.

export const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

const failure = (kind, message) => Object.assign(new Error(message), {kind});

export function createLocalStore() {
  // The tab's copy: the catalogue's text, and the PDFs chosen in this tab.
  let raw = null;
  let version = 0;
  const chosen = new Map();

  async function read() {
    if (raw === null) {
      let response;
      try { response = await fetch('../data/resources.json', {cache: 'no-store'}); } catch { response = null; }
      if (!response?.ok) throw failure('network', 'Le catalogue local est introuvable.');
      raw = await response.text();
    }
    return {head: `local-${version}`, raw};
  }

  // The size of each PDF: the ones chosen in this tab, and for the others what the local server says.
  async function pdfFiles() {
    const files = new Map();
    await Promise.all(JSON.parse(raw).resources.map(async ({pdfPath}) => {
      if (chosen.has(pdfPath)) {
        files.set(pdfPath, {sha: `tab:${pdfPath}`, size: chosen.get(pdfPath).size});
        return;
      }
      try {
        const response = await fetch(`../${pdfPath}`, {method: 'HEAD', cache: 'no-store'});
        if (response.ok) files.set(pdfPath, {sha: `disk:${pdfPath}`, size: Number(response.headers.get('content-length')) || 0});
      } catch { /* not listed: the row says the file is missing */ }
    }));
    return files;
  }

  async function fileContent(sha) {
    const path = sha.slice(sha.indexOf(':') + 1);
    if (sha.startsWith('tab:')) return chosen.get(path);
    const response = await fetch(`../${path}`, {cache: 'no-store'});
    if (!response.ok) throw failure('missing', 'Ce PDF est introuvable sur le serveur local.');
    return response.blob();
  }

  return {
    user: async () => ({login: 'aperçu local'}),
    canWrite: async () => true,
    read, pdfFiles, fileContent
  };
}
