// Draws a list of resources: one row per PDF, with its number, title, facts, and the View and Download links.
// What a row shows depends on the resource type; see docs/content-model.md.
import {el} from './dom.js';
import {t, localized, formatFileSize} from './i18n.js';
import {isSample} from './catalogue.js';
import {checkFile} from './files.js';

// "Chapitre 2", "TD 3" or "TP 1". On a module page exams have no number, because they sit under a year heading.
// In a mixed list (search results) an exam is marked "Examen" so its type is still visible.
function markerText(resource, mixed) {
  if (resource.type === 'cours') return t('marker.cours', {n: resource.chapter});
  if (resource.type === 'td' || resource.type === 'tp') return t(`marker.${resource.type}`, {n: resource.number});
  return mixed ? t('marker.examen') : null;
}

function tag(content, variant = null) {
  return el('li', {class: variant ? `tag tag--${variant}` : 'tag'}, content);
}

// Facts about the resource, each as a labelled tag so none depends on colour alone.
function tags(resource, mixed) {
  const items = [];
  if (resource.type === 'examen') {
    if (mixed) items.push(tag(el('bdi', {}, resource.academicYear)));
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

// "Voir" opens the PDF in the browser's own viewer. "Télécharger" is the same address with the
// download attribute, which tells the browser to save the file instead. No PDF is loaded until a click.
function actionLinks(resource, name) {
  const target = () => el('span', {class: 'visually-hidden'}, t('action.target', {name}));
  return [
    el('a', {class: 'button', href: resource.pdfPath, type: 'application/pdf'}, t('action.view'), target()),
    el('a', {class: 'button', href: resource.pdfPath, download: true}, t('action.download'), target())
  ];
}

function resourceItem(resource, mixed) {
  const mark = markerText(resource, mixed);
  const title = localized(resource.title);
  const tagList = el('ul', {class: 'tags', role: 'list'}, tags(resource, mixed));
  const actions = el('div', {class: 'resource__actions'}, actionLinks(resource, mark ? `${mark}, ${title}` : title));

  const item = el('li', {class: mark ? 'resource resource--marked' : 'resource', 'data-resource': resource.id},
    // TD and TP keep their Latin abbreviation in Arabic, so isolate the marker from right-to-left text.
    mark && el('p', {class: 'resource__marker'}, el('bdi', {}, mark)),
    el('div', {class: 'resource__body'}, el('p', {class: 'resource__title'}, title), tagList),
    actions
  );

  checkFile(resource.pdfPath).then(({state, size}) => {
    if (state === 'missing') {
      // A catalogue entry whose PDF is not on the server must not look like a working document.
      console.warn(`Missing PDF: ${resource.pdfPath} (resource ${resource.id})`);
      item.classList.add('resource--missing');
      actions.replaceChildren(el('p', {class: 'resource__missing'}, t('file.missing')));
    } else if (size) {
      tagList.append(tag(t('file.size', {size: formatFileSize(size)})));
    }
  });

  return item;
}

// `mixed` is for lists that hold several types and years at once, such as search results.
export function resourceList(resources, {mixed = false} = {}) {
  return el('ul', {class: 'resource-list', role: 'list'}, resources.map(resource => resourceItem(resource, mixed)));
}
