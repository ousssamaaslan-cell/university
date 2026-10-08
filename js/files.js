// Checks that a PDF really exists on the server, without downloading it.
// A HEAD request asks only for the file's headers, so no PDF bytes are loaded.
//
// Answers {state, size}:
//   state  'available', 'missing' (the server says the file is not there), or
//          'unknown' (offline, or the request was blocked: we cannot tell, so the file is not blamed)
//   size   the file size in bytes when the server reports it, otherwise null
const answers = new Map();

export function checkFile(path) {
  if (!answers.has(path)) {
    answers.set(path, fetch(path, {method: 'HEAD'}).then(
      response => {
        if (response.ok) {
          const size = Number(response.headers.get('content-length'));
          return {state: 'available', size: size > 0 ? size : null};
        }
        return {state: response.status === 404 || response.status === 410 ? 'missing' : 'unknown', size: null};
      },
      () => ({state: 'unknown', size: null})
    ));
  }
  return answers.get(path);
}
