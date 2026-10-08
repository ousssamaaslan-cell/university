// Checks that a PDF really exists on the server, without downloading it.
// A HEAD request asks only for the file's headers, so no PDF bytes are loaded.
//
// Answers 'available', 'missing' (the server says the file is not there), or
// 'unknown' (offline, or the request was blocked: we cannot tell, so the file is not blamed).
const answers = new Map();

export function checkFile(path) {
  if (!answers.has(path)) {
    answers.set(path, fetch(path, {method: 'HEAD'}).then(
      response => {
        if (response.ok) return 'available';
        return response.status === 404 || response.status === 410 ? 'missing' : 'unknown';
      },
      () => 'unknown'
    ));
  }
  return answers.get(path);
}
