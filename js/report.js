// Static HTML lets Netlify detect the form at deploy time; this script adds translation,
// prefilled document details, and an inline result after submission.
import {t} from './i18n.js';
import {renderLayout, renderFooter, homeCrumb, setDescription} from './layout.js';

document.title = t('report.docTitle');
setDescription(t('report.description'));
renderLayout({breadcrumb: [homeCrumb()]});
renderFooter();

for (const [selector, key] of Object.entries({
  '[data-report-title]': 'report.title',
  '[data-report-intro]': 'report.intro',
  '[data-report-module]': 'report.module',
  '[data-report-document]': 'report.document',
  '[data-report-problem]': 'report.problem',
  '[data-report-email]': 'report.email',
  '[data-report-submit]': 'report.submit'
})) document.querySelector(selector).textContent = t(key);

const query = new URLSearchParams(location.search);
for (const field of ['module', 'document']) {
  const input = document.querySelector(`[name="${field}"]`);
  input.value = (query.get(field) ?? '').slice(0, input.maxLength);
}

const form = document.querySelector('.report-form');
const submit = form.querySelector('[type="submit"]');
const result = document.querySelector('.report-result');

form.addEventListener('submit', async event => {
  event.preventDefault();
  submit.disabled = true;
  submit.textContent = t('report.sending');
  result.hidden = true;

  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams(new FormData(form)).toString()
    });
    if (!response.ok) throw new Error(`Report submission failed: ${response.status}`);
    form.hidden = true;
    result.textContent = t('report.success');
    result.hidden = false;
    result.setAttribute('tabindex', '-1');
    result.focus();
  } catch (error) {
    result.textContent = t('report.error');
    result.hidden = false;
    submit.disabled = false;
    submit.textContent = t('report.submit');
  }
});
