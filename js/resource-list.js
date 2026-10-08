// Draws a list of resources: one row per PDF, with its number, title and facts.
// What a row shows depends on the resource type; see docs/content-model.md.
import {el} from './dom.js';
import {t, localized} from './i18n.js';
import {isSample} from './catalogue.js';
import {checkFile} from './files.js';

// "Chapitre 2", "TD 3" or "TP 1". Exams have no number; they are grouped by year instead.
function marker(resource) {
  if (resource.type === 'cours') return t('marker.cours', {n: resource.chapter});
  // TD and TP keep their Latin abbreviation in Arabic, so isolate them from the right-to-left text.
  if (resource.type === 'td' || resource.type === 'tp') return el('bdi', {}, t(`marker.${resource.type}`, {n: resource.number}));
  return null;
}

function tag(content, variant = null) {
  return el('li', {class: variant ? `tag tag--${variant}` : 'tag'}, content);
}

// Facts about the resource, each as a labelled tag so none depends on colour alone.
function tags(resource) {
  const items = [];
  if (resource.type === 'examen') {
    // A rattrapage exam is always in the rattrapage session, so its kind would only repeat the session tag.
    if (resource.examKind !== 'rattrapage') items.push(tag(t(`kind.${resource.examKind}`)));
    items.push(tag(t(`session.${resource.session}`)));
  } else if (resource.academicYear) {
    items.push(tag(el('bdi', {}, resource.academicYear)));
  }
  if ('hasCorrection' in resource) {
    items.push(resource.hasCorrection
      ? tag(t(resource.type === 'tp' ? 'correction.tp.yes' : 'correction.yes'), 'ok')
      : tag(t('correction.no')));
  }
  if (isSample(resource)) items.push(tag(t('sample.tag'), 'sample'));
  return items;
}

function resourceItem(resource) {
  const mark = marker(resource);
  // The end of the row. It stays empty unless the PDF turns out to be missing.
  const actions = el('div', {class: 'resource__actions'});
  const item = el('li', {class: mark ? 'resource resource--marked' : 'resource', 'data-resource': resource.id},
    mark && el('p', {class: 'resource__marker'}, mark),
    el('div', {class: 'resource__body'},
      el('p', {class: 'resource__title'}, localized(resource.title)),
      el('ul', {class: 'tags', role: 'list'}, tags(resource))
    ),
    actions
  );

  // A catalogue entry whose PDF is not on the server must not look like a working document.
  checkFile(resource.pdfPath).then(answer => {
    if (answer !== 'missing') return;
    console.warn(`Missing PDF: ${resource.pdfPath} (resource ${resource.id})`);
    item.classList.add('resource--missing');
    actions.replaceChildren(el('p', {class: 'resource__missing'}, t('file.missing')));
  });

  return item;
}

export function resourceList(resources) {
  return el('ul', {class: 'resource-list', role: 'list'}, resources.map(resourceItem));
}
