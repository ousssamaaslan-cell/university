// The dashboard on a local preview (http://localhost:...): it cannot log in to GitHub from there,
// so it works on a copy of the repository kept in this browser tab. Nothing is sent anywhere, and
// a reload starts again from the files on disk. It answers the same questions as github-commit.js.

export const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

export function createLocalStore() {
  return {
    user: async () => ({login: 'aperçu local'}),
    canWrite: async () => true
  };
}
