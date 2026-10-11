// Draws a list of documents, one row per PDF: the title opens the PDF, one button downloads it,
// and a quiet line under the title gives the facts.
// What a row shows depends on the resource type; see docs/content-model.md.
import {el} from './dom.js';
import {t, typeset, formatFileSize} from './i18n.js';
import {isSample} from './catalogue.js';
import {checkFile} from './files.js';
import {reportLink} from './components.js';

// "Chapitre 2", "TD 3" or "TP 1". On a module page exams have no number, because they sit under a year heading.
// In a mixed list (search results) an exam is marked with its academic year instead.
function markerText(resource, mixed) {
  if (resource.type === 'cours') return t('marker.cours', {n: resource.chapter});
  if (resource.type === 'td' || resource.type === 'tp') return t(`marker.${resource.type}`, {n: resource.number});
  return mixed ? resource.academicYear : null;
}

function fact(content, variant = null) {
  return el('li', {class: variant ? `fact fact--${variant}` : 'fact'}, content);
}

// Facts about the document, each in words. "Avec corrigé" is the only one drawn as a badge,
// because it is the one students look for first.
function facts(resource) {
  const items = [];
  if (resource.type === 'examen') {
    // A rattrapage exam is always in the rattrapage session, so its kind would only repeat the session.
    if (resource.examKind !== 'rattrapage') items.push(fact(t(`kind.${resource.examKind}`)));
    items.push(fact(t(`session.${resource.session}`)));
  } else if (resource.academicYear) {
    items.push(fact(resource.academicYear));
  }
  if ('hasCorrection' in resource) {
    items.push(resource.hasCorrection
      ? fact(el('span', {class: 'fact__badge'}, t(resource.type === 'tp' ? 'correction.tp.yes' : 'correction.yes')))
      : fact(t('correction.no')));
  }
  if (isSample(resource)) items.push(fact(t('sample.tag')));
  return items;
}

// The file type and size: "PDF, 14 ko". It is in the row from the start and keeps a fixed
// minimum width (css/styles.css), so the row does not change height when the server answers with the size.
function sizeFact() {
  const size = el('span', {});
  return {size, node: fact([t('file.type'), size], 'size')};
}

function resourceItem(resource, mixed, context) {
  const mark = markerText(resource, mixed);
  const title = typeset(resource.title.fr);
  const heading = () => [mark && el('span', {class: 'resource__marker'}, mark), mark && ' ', el('span', {class: 'resource__title'}, title)];

  // The title is the link that opens the PDF in the browser's own viewer. The number is inside the
  // link too: a bigger target to tap, and a link that names its document in full.
  const link = el('a', {class: 'resource__link', href: resource.pdfPath, type: 'application/pdf'},
    heading(),
    el('span', {class: 'visually-hidden'}, context && `${t('list.separator')}${context}`, t('action.open'))
  );
  // The same address with the download attribute, which tells the browser to save the file instead.
  // No PDF is loaded until a click.
  // What screen readers hear after "Télécharger" or "Signaler une erreur": "ASD3, TD 3, Piles".
  const documentName = [context, mark, title].filter(Boolean).join(t('list.separator'));
  const download = el('a', {class: 'button resource__download', href: resource.pdfPath, download: true},
    t('action.download'),
    el('span', {class: 'visually-hidden'}, t('action.target', {name: documentName}))
  );
  const fileSize = sizeFact();
  const factList = el('ul', {class: 'facts', role: 'list'}, facts(resource), fileSize.node);

  const item = el('li', {class: mark ? 'resource resource--marked' : 'resource', 'data-resource': resource.id},
    link, download, factList
  );

  checkFile(resource.pdfPath).then(({state, size}) => {
    if (state === 'missing') {
      // A catalogue entry whose PDF is not on the server must not look like a working document:
      // the title stops being a link, and one message replaces the button and the facts.
      // Beside the message, a link lets the reader tell the maintainer which file is missing.
      console.warn(`Missing PDF: ${resource.pdfPath} (resource ${resource.id})`);
      item.classList.add('resource--missing');
      link.replaceWith(el('div', {class: 'resource__link'}, heading()));
      download.remove();
      factList.replaceWith(el('p', {class: 'resource__missing'},
        el('span', {class: 'resource__missing-label'}, t('file.missing')),
        reportLink({module: resource.module.toUpperCase(), document: `${documentName} (${resource.id})`, name: documentName})
      ));
    } else if (size) {
      fileSize.size.textContent = `${t('list.separator')}${formatFileSize(size)}`;
    }
  });

  return item;
}

// `mixed` is for lists that hold several types and years at once, such as search results.
// `context` names what the list belongs to (a module's code) when the page shows several lists;
// it is added to the names screen readers hear, never to what is displayed.
export function resourceList(resources, {mixed = false, context = null} = {}) {
  return el('ul', {class: 'resource-list', role: 'list'}, resources.map(resource => resourceItem(resource, mixed, context)));
}
