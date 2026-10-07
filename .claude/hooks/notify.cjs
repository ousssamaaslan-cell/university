// Template-authored optional local terminal notification. No external messaging.
const {input} = require('./lib.cjs');
(async () => {
  const data = await input();
  const type = typeof data.notification_type === 'string' ? data.notification_type.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) : 'notification';
  console.error('[university] Claude Code: ' + type);
})().catch(() => {});
