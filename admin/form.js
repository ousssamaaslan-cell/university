// The form that adds a document, step by step on one page, and that changes one already
// published. It offers only what docs/content-model.md allows: lists and number fields for every
// fixed value. admin/catalogue-rules.js checks everything again when the change is saved.
import {el} from '../js/dom.js';
import {t} from '../js/i18n.js';
import {button, note, focusOn, countLabel, markerOf, sizeLabel, TYPE_LABELS, TYPE_GROUP_LABELS, KIND_LABELS} from './ui.js';

const MEMORY_KEY = 'l2-admin-last-choice';
// The kinds of exam, in the order they are sat in a year.
const KINDS = ['controle', 'emd', 'final', 'rattrapage'];
const SESSION_CHOICES = {normal: 'Normale', rattrapage: 'Rattrapage'};
const TITLE_HINTS = {
  cours: 'Le sujet du chapitre. Sans « Chapitre 2 » : la page ajoute le numéro.',
  td: 'Le sujet de la série. Sans « TD 3 » : la page ajoute le numéro.',
  tp: 'Le sujet du TP. Sans « TP 2 » : la page ajoute le numéro.',
  examen: 'Un nom court, par exemple « Examen de janvier 2025 ».'
};

// The last semester, module and type used, so the next visit starts there. A convenience only:
// the form works the same when the browser gives no storage.
function recall() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEMORY_KEY)) ?? {};
    return {semester: String(saved.semester ?? ''), module: String(saved.module ?? ''), type: String(saved.type ?? '')};
  } catch {
    return {};
  }
}

function remember(choice) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(choice)); } catch { /* not remembered this time */ }
}

const emptyValues = () => ({
  semester: '', module: '', type: '', chapter: '', number: '', academicYear: '', session: '', examKind: '',
  hasCorrection: false, title: '',
  // The chosen PDF: {file, name, size, isPdf, warning}.
  file: null,
  // The maintainer agreed to publish beside the similar documents shown.
  acknowledged: false
});

const valuesOf = resource => ({
  ...emptyValues(),
  semester: resource.semester, module: resource.module, type: resource.type,
  chapter: String(resource.chapter ?? ''), number: String(resource.number ?? ''),
  academicYear: resource.academicYear ?? '', session: resource.session ?? '', examKind: resource.examKind ?? '',
  hasCorrection: resource.hasCorrection === true, title: resource.title
});

// A whole number of one or two digits, at least `minimum`: a chapter or a sheet number.
const isWhole = (text, minimum) => /^\d{1,2}$/.test(String(text).trim()) && Number(text) >= minimum;

// One choice among a few, drawn as a large button: a radio button underneath, so the arrow keys
// and screen readers treat the group as the single choice it is.
function choice({name, value, checked, disabled = false, variant = null, content, onPick}) {
  const input = el('input', {class: 'choice__input', type: 'radio', name, value, checked, disabled});
  input.addEventListener('change', () => onPick(value));
  return el('label', {class: variant ? `choice choice--${variant}` : 'choice'}, input, el('span', {class: 'choice__body'}, content));
}

// resource: the document to change; without it the form adds one.
// onSaved(result): called after an edit was saved. onCancel: called by "Annuler" on an edit.
export function createForm(app, {resource = null, onSaved = () => {}, onCancel = null} = {}) {
  const rules = app.rules;
  const editing = resource !== null;
  const id = name => `${editing ? 'edit' : 'add'}-${name}`;
  const values = editing ? valuesOf(resource) : {...emptyValues(), ...recall()};
  // The fields a "what is missing" line can send the keyboard to.
  const controls = {};
  // Why the last chosen file was refused.
  let fileProblem = null;
  // The documents already at the place this one describes.
  let similar = [];
  let similarShown = '';
  let missingShown = null;
  let saving = false;
  // An edit refused because the document changed elsewhere: this form can no longer be saved.
  let outdated = false;

  let stepNumber = 0;
  const step = (title, ...content) => el('fieldset', {class: 'step'},
    el('legend', {class: 'step__title'}, editing ? title : `${++stepNumber}. ${title}`),
    ...content
  );

  // ----- Steps 1 to 3: where the document goes. Locked on an edit.
  const semesterChoices = el('div', {class: 'choices'});
  const semesterNote = el('p', {class: 'hint', hidden: true});
  const moduleChoices = el('div', {class: 'choices choices--modules'});
  const typeChoices = el('div', {class: 'choices choices--types'});

  function drawSemesters() {
    const {catalogue} = app.snapshot;
    const semesters = [...catalogue.semesters].sort((a, b) => a.order - b.order);
    const empty = semesters.filter(semester => !catalogue.modules.some(module => module.semester === semester.id));
    semesterChoices.replaceChildren(...semesters.map(semester => choice({
      name: id('semester'), value: semester.id, checked: values.semester === semester.id, disabled: empty.includes(semester),
      content: [el('strong', {}, semester.id), ' ', el('span', {class: 'choice__detail'}, semester.label)],
      onPick: value => {
        values.semester = value;
        if (catalogue.modules.find(module => module.id === values.module)?.semester !== value) values.module = '';
        drawModules();
        changed();
      }
    })));
    semesterNote.hidden = empty.length === 0;
    semesterNote.textContent = empty.length ? `${empty.map(semester => semester.label).join(', ')} : aucun module pour l'instant.` : '';
    controls.semester = semesterChoices.querySelector('input:checked') ?? semesterChoices.querySelector('input:not(:disabled)');
  }

  function drawModules() {
    const {catalogue} = app.snapshot;
    if (!values.semester) {
      moduleChoices.replaceChildren(el('p', {class: 'hint'}, "Choisissez d'abord le semestre."));
      controls.module = controls.semester;
      return;
    }
    moduleChoices.replaceChildren(...rules.modulesInOrder(catalogue).filter(module => module.semester === values.semester).map(module => choice({
      name: id('module'), value: module.id, checked: values.module === module.id, variant: 'module',
      content: [
        el('span', {class: 'module-code'}, module.abbr),
        el('span', {class: 'choice__name'}, module.title),
        el('span', {class: 'choice__detail'}, countLabel(catalogue.resources.filter(item => item.module === module.id).length))
      ],
      onPick: value => { values.module = value; changed(); }
    })));
    controls.module = moduleChoices.querySelector('input:checked') ?? moduleChoices.querySelector('input');
  }

  function drawTypes() {
    typeChoices.replaceChildren(...rules.TYPES.map(type => choice({
      name: id('type'), value: type, checked: values.type === type, variant: 'type', content: TYPE_LABELS[type],
      onPick: value => { values.type = value; drawDetails(); changed(); }
    })));
    controls.type = typeChoices.querySelector('input:checked') ?? typeChoices.querySelector('input');
  }

  // Keeps the three choices possible: a module that left the catalogue is forgotten, a module
  // brings its semester, and the only semester that has modules is chosen in advance.
  function settle() {
    const {catalogue} = app.snapshot;
    const usable = catalogue.semesters.filter(semester => catalogue.modules.some(module => module.semester === semester.id)).map(semester => semester.id);
    const module = catalogue.modules.find(item => item.id === values.module);
    if (module) values.semester = module.semester;
    else values.module = '';
    if (!usable.includes(values.semester)) values.semester = usable.length === 1 ? usable[0] : '';
    if (!rules.TYPES.includes(values.type)) values.type = '';
  }

  // ----- Step 4: the fields of the chosen type.
  const details = el('div', {class: 'detail-fields'});

  function numberField(name, label, minimum) {
    const error = el('p', {class: 'field__error', id: id(`${name}-error`)});
    const input = el('input', {id: id(name), type: 'number', inputmode: 'numeric', min: String(minimum), max: '99', step: '1', value: values[name], 'aria-describedby': id(`${name}-error`)});
    const check = () => {
      const wrong = input.validity.badInput || (input.value !== '' && !isWhole(input.value, minimum));
      error.textContent = wrong ? `Un nombre entier, de ${minimum} à 99.` : '';
      input.setAttribute('aria-invalid', String(wrong));
    };
    input.addEventListener('input', () => { values[name] = input.value; check(); update(); });
    check();
    controls[name] = input;
    return el('div', {class: 'field'}, el('label', {for: id(name)}, label), input, error);
  }

  function yearField(required) {
    const years = rules.academicYears(new Date(), app.snapshot.catalogue.resources);
    const select = el('select', {id: id('year'), 'aria-describedby': required ? null : id('year-hint')},
      el('option', {value: ''}, required ? 'Choisir…' : 'Aucune'),
      years.map(year => el('option', {value: year, selected: values.academicYear === year}, year))
    );
    select.addEventListener('change', () => { values.academicYear = select.value; update(); });
    controls.year = select;
    return el('div', {class: 'field'},
      el('label', {for: id('year')}, required ? 'Année universitaire' : 'Année universitaire (facultatif)'),
      select,
      !required && el('p', {class: 'hint', id: id('year-hint')}, "Seulement s'il existe plusieurs versions du même document.")
    );
  }

  // The session, as two buttons. A rattrapage exam is always in the rattrapage session.
  const sessionGroup = el('div', {class: 'option-group', role: 'radiogroup', 'aria-labelledby': id('session-label')});
  function drawSession() {
    const forced = values.examKind === 'rattrapage';
    if (forced) values.session = 'rattrapage';
    sessionGroup.replaceChildren(...[
      el('span', {class: 'option-group__label', id: id('session-label')}, 'Session'),
      el('div', {class: 'choices choices--inline'}, rules.SESSIONS.map(session => choice({
        name: id('session'), value: session, checked: values.session === session, disabled: forced && session === 'normal',
        content: SESSION_CHOICES[session], onPick: value => { values.session = value; update(); }
      }))),
      forced && el('p', {class: 'hint'}, 'Un examen de rattrapage appartient à la session de rattrapage.')
    ].filter(Boolean));
    controls.session = sessionGroup.querySelector('input:checked') ?? sessionGroup.querySelector('input:not(:disabled)');
  }

  function kindField() {
    const select = el('select', {id: id('kind')},
      el('option', {value: ''}, 'Choisir…'),
      KINDS.map(kind => el('option', {value: kind, selected: values.examKind === kind}, KIND_LABELS[kind]))
    );
    select.addEventListener('change', () => { values.examKind = select.value; drawSession(); update(); });
    controls.kind = select;
    return el('div', {class: 'field'}, el('label', {for: id('kind')}, "Nature de l'examen"), select);
  }

  function correctionSwitch() {
    const input = el('input', {class: 'switch__input', type: 'checkbox', role: 'switch', id: id('correction'), checked: values.hasCorrection});
    input.addEventListener('change', () => { values.hasCorrection = input.checked; update(); });
    return el('label', {class: 'switch'},
      input,
      el('span', {class: 'switch__track', 'aria-hidden': 'true'}),
      el('span', {}, values.type === 'tp' ? 'Le PDF contient le corrigé ou le code' : 'Le PDF contient le corrigé')
    );
  }

  function drawDetails() {
    for (const name of ['chapter', 'number', 'year', 'kind', 'session']) controls[name] = null;
    const type = values.type;
    if (!type) {
      details.replaceChildren(el('p', {class: 'hint'}, "Choisissez d'abord le type de document."));
      return;
    }
    const parts = [];
    if (type === 'cours') parts.push(numberField('chapter', 'Numéro du chapitre', 0));
    if (type === 'td' || type === 'tp') parts.push(numberField('number', `Numéro du ${TYPE_LABELS[type]}`, 1));
    if (type === 'examen') {
      drawSession();
      parts.push(yearField(true), kindField(), sessionGroup);
    }
    if (type !== 'cours') parts.push(correctionSwitch());
    if (type !== 'examen') parts.push(yearField(false));
    details.replaceChildren(...parts);
    titleHint.textContent = TITLE_HINTS[type];
  }

  // ----- Step 5: the title.
  const titleHint = el('p', {class: 'hint', id: id('title-hint')}, 'Le sujet du document.');
  const titleInput = el('input', {id: id('title'), type: 'text', maxlength: '150', autocomplete: 'off', value: values.title, 'aria-describedby': id('title-hint')});
  titleInput.addEventListener('input', () => { values.title = titleInput.value; update(); });
  controls.title = titleInput;

  // ----- Step 6: the PDF. A zone to drop the file on, and a button that opens the file chooser.
  const fileInput = el('input', {class: 'visually-hidden', type: 'file', accept: 'application/pdf,.pdf', tabindex: '-1', 'aria-hidden': 'true'});
  const chooseFile = button('Choisir un fichier', {onClick: () => fileInput.click()});
  const fileBox = el('div', {class: 'file-box'});
  const dropzone = el('div', {class: 'dropzone'},
    el('p', {class: 'dropzone__text'}, editing ? 'Pour remplacer le PDF, déposez le nouveau fichier ici, ou' : 'Déposez le PDF ici, ou'),
    chooseFile,
    el('p', {class: 'hint'}, `Un seul fichier PDF, ${rules.MAX_PDF_BYTES / 1e6} Mo au maximum.`),
    fileInput
  );
  controls.file = chooseFile;

  // Looks at a chosen file before anything is sent: its name, its size, and its first bytes.
  async function takeFile(file) {
    let isPdf = false;
    try {
      isPdf = window.L2AdminFlow.startsLikePdf(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
    } catch { /* unreadable: refused below as not being a PDF */ }
    const facts = {name: file.name, size: file.size, isPdf};
    const verdict = rules.checkPdf(facts);
    values.file = verdict.error ? null : {file, ...facts, warning: verdict.warning};
    fileProblem = verdict.error;
    drawFile();
    update();
  }

  function refuseFiles(reason) {
    values.file = null;
    fileProblem = reason;
    drawFile();
    update();
  }

  function drawFile() {
    const current = editing ? app.snapshot.files.get(resource.pdfPath) : null;
    const chosen = values.file;
    fileBox.replaceChildren(...[
      editing && el('p', {class: 'file-line'},
        el('span', {}, chosen ? 'Fichier actuel, qui sera remplacé : ' : 'Fichier actuel : '),
        el('strong', {}, `${resource.id}.pdf`),
        current ? ` · ${sizeLabel(current.size)}` : ' · absent du dépôt'
      ),
      chosen && el('p', {class: 'file-line', role: 'status'},
        el('span', {}, editing ? 'Nouveau fichier : ' : 'Fichier choisi : '),
        el('strong', {class: 'file-line__name'}, chosen.name),
        ` · ${sizeLabel(chosen.size)} `,
        button(editing ? 'Garder le fichier actuel' : 'Retirer le fichier', {onClick: () => {
          values.file = null;
          fileProblem = null;
          drawFile();
          update();
          chooseFile.focus();
        }})
      ),
      chosen && editing && el('p', {class: 'hint'}, `Le nouveau fichier prendra le même nom : ${resource.id}.pdf.`),
      chosen?.warning && note('warn', {text: chosen.warning}),
      fileProblem && note('error', {title: 'Fichier refusé.', text: fileProblem})
    ].filter(Boolean));
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length === 1) takeFile(fileInput.files[0]);
    // Emptied so that choosing the same file again, after a correction, is noticed.
    fileInput.value = '';
  });
  for (const type of ['dragenter', 'dragover']) {
    dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.classList.add('dropzone--over');
    });
  }
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone--over'));
  dropzone.addEventListener('drop', event => {
    event.preventDefault();
    dropzone.classList.remove('dropzone--over');
    if (saving) return;
    const dropped = event.dataTransfer?.files ?? [];
    if (dropped.length === 1) takeFile(dropped[0]);
    else if (dropped.length > 1) refuseFiles('Déposez un seul fichier à la fois.');
  });

  // ----- Step 7: what will be published, before it is.
  const previewBox = el('div', {class: 'preview'});

  // The document's row as the module page will draw it, with the site's own classes and labels.
  // It is a picture of the row: nothing in it can be clicked.
  function previewRow() {
    const type = values.type;
    const number = type === 'cours' ? values.chapter : values.number;
    const marker = type === 'examen' ? null : t(`marker.${type}`, {n: isWhole(number, type === 'cours' ? 0 : 1) ? Number(number) : '…'});
    const title = values.title.trim();
    const facts = [];
    if (type === 'examen') {
      if (values.examKind && values.examKind !== 'rattrapage') facts.push(t(`kind.${values.examKind}`));
      if (values.session) facts.push(t(`session.${values.session}`));
    } else if (values.academicYear) {
      facts.push(values.academicYear);
    }
    if (type !== 'cours') {
      facts.push(values.hasCorrection ? el('span', {class: 'fact__badge'}, t(type === 'tp' ? 'correction.tp.yes' : 'correction.yes')) : t('correction.no'));
    }
    const size = values.file?.size ?? (editing ? app.snapshot.files.get(resource.pdfPath)?.size : null);
    facts.push(size ? sizeLabel(size) : 'PDF');
    return el('div', {class: 'preview__page'},
      type === 'examen' && el('p', {class: 'year-group__title'}, values.academicYear || '…'),
      el('div', {class: marker ? 'resource resource--marked' : 'resource'},
        el('div', {class: 'resource__link'},
          marker && el('span', {class: 'resource__marker'}, marker),
          marker && ' ',
          el('span', {class: 'resource__title'}, title || '(titre)')
        ),
        el('span', {class: 'button resource__download', 'aria-hidden': 'true'}, t('action.download')),
        el('ul', {class: 'facts', role: 'list'}, facts.map(fact => el('li', {class: 'fact'}, fact)))
      )
    );
  }

  function drawPreview() {
    const {catalogue} = app.snapshot;
    const draft = editing ? {id: resource.id, pdfPath: resource.pdfPath} : rules.draftId(catalogue, fields());
    const module = catalogue.modules.find(item => item.id === values.module);
    // An edited document keeps its ID and file name even when its number or year no longer matches them.
    const renamedIf = editing ? rules.draftId({...catalogue, resources: catalogue.resources.filter(item => item.id !== resource.id)}, fields()) : null;
    previewBox.replaceChildren(...[
      el('dl', {class: 'preview__facts'},
        el('dt', {}, 'Identifiant'),
        el('dd', {}, draft ? el('code', {}, draft.id) : 'Connu dès que le module, le type et le numéro sont choisis.'),
        el('dt', {}, 'Fichier PDF'),
        el('dd', {}, draft ? el('code', {}, draft.pdfPath) : '—')
      ),
      renamedIf && renamedIf.id !== resource.id && el('p', {class: 'hint'}, `Ce document garde son identifiant et son nom de fichier d'origine. Pour qu'ils suivent le nouveau numéro ou la nouvelle année, supprimez-le, puis ajoutez-le de nouveau.`),
      values.type && module && el('p', {class: 'preview__caption'}, `Sur la page du module ${module.abbr}, onglet ${TYPE_GROUP_LABELS[values.type]} :`),
      values.type && module && previewRow()
    ].filter(Boolean));
  }

  // ----- The warning about a document already at the same place.
  const similarBox = el('div', {});

  function drawSimilar() {
    const {catalogue} = app.snapshot;
    const draft = editing ? null : rules.draftId(catalogue, fields());
    const shown = `${similar.map(item => item.id).join(' ')}|${draft?.id ?? ''}`;
    if (shown === similarShown) return;
    similarShown = shown;
    controls.acknowledge = null;
    if (similar.length === 0) {
      similarBox.replaceChildren();
      return;
    }
    const agree = el('input', {type: 'checkbox', id: id('acknowledge'), checked: values.acknowledged});
    agree.addEventListener('change', () => { values.acknowledged = agree.checked; update(); });
    controls.acknowledge = agree;
    similarBox.replaceChildren(el('div', {class: 'note note--warn', role: 'status'},
      el('p', {class: 'note__title'}, similar.length > 1 ? 'Des documents semblables existent déjà.' : 'Un document semblable existe déjà.'),
      el('ul', {}, similar.map(item => el('li', {},
        `${markerOf(item) ?? `Examen ${item.academicYear}`} : « ${item.title} »`,
        item.type !== 'examen' && item.academicYear ? `, ${item.academicYear}` : '',
        ' (', el('code', {}, item.id), ')'
      ))),
      el('p', {}, editing
        ? 'Après cette modification, les deux documents auront le même numéro sur la page du module.'
        : `Le nouveau document sera publié à côté, sous l'identifiant ${draft?.id ?? '…'}.${values.type !== 'examen' ? " S'il s'agit d'une autre année, choisissez plutôt son année universitaire." : ''}`),
      el('label', {class: 'check'}, agree, el('span', {}, editing ? 'Continuer : enregistrer quand même' : 'Continuer : publier quand même ce document'))
    ));
  }

  // ----- "Publier", and the list of what is still missing.
  const missingBox = el('div', {class: 'publish__missing', id: id('missing'), role: 'status'});
  const problemBox = el('div', {});
  const publishButton = button(editing ? 'Enregistrer les modifications' : 'Publier', {variant: 'primary', 'aria-describedby': id('missing')});
  const cancelButton = onCancel && button('Annuler', {onClick: onCancel});
  publishButton.addEventListener('click', submit);

  // What the form holds, as catalogue-rules.js reads it.
  function fields() {
    return {
      semester: values.semester, module: values.module, type: values.type,
      chapter: values.chapter, number: values.number, academicYear: values.academicYear,
      session: values.session, examKind: values.examKind, hasCorrection: values.hasCorrection,
      title: values.title
    };
  }

  function change() {
    const pdf = values.file ? {name: values.file.name, size: values.file.size, isPdf: values.file.isPdf} : null;
    const acknowledged = values.acknowledged ? similar.map(item => item.id) : [];
    return editing
      ? {action: 'edit', id: resource.id, base: resource, fields: fields(), pdf, acknowledged}
      : {action: 'add', fields: fields(), pdf, acknowledged};
  }

  // What stops the save, each with the field to go to. Empty when everything is ready.
  function missing() {
    const list = [];
    const need = (text, control) => list.push({text, control});
    const type = values.type;
    if (outdated) return [{text: 'Ce document a changé ailleurs : revenez à la liste et ouvrez-le de nouveau', control: cancelButton}];
    if (!editing) {
      if (!values.semester) need('Choisissez le semestre', controls.semester);
      if (!values.module) need('Choisissez le module', controls.module);
      if (!type) need('Choisissez le type de document', controls.type);
    }
    if (type === 'cours' && !isWhole(values.chapter, 0)) need('Indiquez le numéro du chapitre', controls.chapter);
    if ((type === 'td' || type === 'tp') && !isWhole(values.number, 1)) need(`Indiquez le numéro du ${TYPE_LABELS[type]}`, controls.number);
    if (type === 'examen') {
      if (!values.academicYear) need("Choisissez l'année universitaire", controls.year);
      if (!values.examKind) need("Choisissez la nature de l'examen", controls.kind);
      if (!values.session) need('Choisissez la session', controls.session);
    }
    if (!values.title.trim()) need('Écrivez le titre', titleInput);
    if (!editing && !values.file) need(fileProblem ? 'Choisissez un autre fichier PDF' : 'Choisissez le fichier PDF', chooseFile);
    if (similar.length > 0 && !values.acknowledged) need('Confirmez que vous voulez publier à côté du document semblable', controls.acknowledge);
    if (list.length > 0) return list;
    // Everything looks filled in: let the save rules have the last word, on the catalogue as last read.
    const dry = rules.planChange(app.snapshot.raw, change());
    for (const error of dry.errors) need(error.replace(/\.$/, ''), null);
    if (editing && dry.errors.length === 0 && !dry.changed) need("Aucune modification à enregistrer pour l'instant", titleInput);
    return list;
  }

  function drawMissing(list) {
    const shown = saving ? 'saving' : list.map(item => item.text).join('|');
    if (shown === missingShown) return;
    missingShown = shown;
    if (saving) {
      missingBox.replaceChildren(el('p', {}, app.local ? 'Enregistrement dans cet onglet…' : 'Envoi à GitHub en cours… Gardez cette page ouverte.'));
      return;
    }
    if (list.length === 0) {
      missingBox.replaceChildren(el('p', {class: 'publish__ready'}, editing ? 'Tout est prêt : vous pouvez enregistrer.' : 'Tout est prêt : vous pouvez publier.'));
      return;
    }
    missingBox.replaceChildren(
      el('p', {}, editing ? "Avant d'enregistrer :" : 'Avant de publier, il manque :'),
      el('ul', {}, list.map(item => {
        if (!item.control) return el('li', {}, item.text);
        // A press on the line goes to the field it names.
        const go = el('button', {class: 'link-button', type: 'button'}, item.text);
        go.addEventListener('click', () => {
          const target = item.control.isConnected ? item.control : null;
          if (target) {
            target.focus();
            target.scrollIntoView({block: 'center'});
          }
        });
        return el('li', {}, go);
      }))
    );
  }

  // Called after every change in the form: the warning, the preview, the missing list, the button.
  function update() {
    const found = rules.similarDocuments(app.snapshot.catalogue, fields(), editing ? resource : null);
    // A warning that was accepted counts only for the documents it showed.
    if (found.map(item => item.id).join(' ') !== similar.map(item => item.id).join(' ')) values.acknowledged = false;
    similar = found;
    drawSimilar();
    drawPreview();
    const list = missing();
    drawMissing(list);
    publishButton.disabled = saving || list.length > 0;
    publishButton.textContent = saving ? (editing ? 'Enregistrement en cours…' : 'Publication en cours…') : (editing ? 'Enregistrer les modifications' : 'Publier');
  }

  function changed() {
    if (!editing) remember({semester: values.semester, module: values.module, type: values.type});
    update();
  }

  // ----- The page of the form.
  const steps = el('div', {class: 'steps'}, ...[
    editing
      ? el('div', {class: 'form-locked'},
        el('p', {}, el('strong', {}, 'Emplacement : '), `${resource.semester} · ${app.snapshot.catalogue.modules.find(module => module.id === resource.module)?.abbr ?? resource.module} · ${TYPE_LABELS[resource.type]}`),
        el('p', {class: 'hint'}, "Le semestre, le module et le type ne se modifient pas : l'identifiant et le nom du fichier en dépendent. Pour les changer, supprimez ce document, puis ajoutez-le de nouveau.")
      )
      : [
        step('Semestre', semesterChoices, semesterNote),
        step('Module', moduleChoices),
        step('Type de document', typeChoices)
      ],
    step(editing ? 'Détails' : 'Numéro et détails', details),
    step('Titre',
      el('div', {class: 'field field--title'}, el('label', {for: id('title')}, 'Titre du document'), titleInput, titleHint)
    ),
    // On an edit the current file is named first, then the zone that replaces it.
    editing ? step('Fichier PDF (facultatif)', fileBox, dropzone) : step('Fichier PDF', dropzone, fileBox),
    el('section', {class: 'step'},
      el('h3', {class: 'step__title'}, editing ? 'Aperçu avant enregistrement' : `${++stepNumber}. Aperçu avant publication`),
      previewBox
    )
  ].flat());
  const body = el('div', {class: 'doc-form'},
    steps,
    similarBox,
    el('div', {class: 'publish'}, missingBox, problemBox, el('div', {class: 'publish__actions'}, publishButton, cancelButton))
  );
  const donePanel = el('div', {class: 'form-done', hidden: true});
  const node = el('div', {}, body, donePanel);

  async function submit() {
    if (saving || missing().length > 0) return;
    const chosen = values.file;
    saving = true;
    steps.inert = true;
    problemBox.replaceChildren();
    update();
    let result = null;
    let failure = null;
    try {
      result = await app.publish(change(), chosen && (async () => {
        try {
          return new Uint8Array(await chosen.file.arrayBuffer());
        } catch {
          throw Object.assign(new Error('unreadable'), {kind: 'file', problems: [`Le fichier « ${chosen.name} » ne peut plus être lu sur cet appareil. Choisissez-le de nouveau.`]});
        }
      }));
    } catch (error) {
      failure = error;
      // Somebody else's change is the reason: read the catalogue again, so the form shows it.
      if (error.kind === 'duplicate' || error.kind === 'stale') await app.reload().catch(() => {});
      if (error.kind === 'stale' && editing) outdated = true;
    }
    saving = false;
    steps.inert = false;
    update();
    if (failure) {
      const problem = app.errorNote(failure, {saving: true});
      problemBox.replaceChildren(problem);
      focusOn(problem);
      return;
    }
    if (editing) onSaved(result);
    else showDone(result);
  }

  // After a successful publication: the confirmation, the link to the module page, and the next step.
  function showDone(result) {
    const saved = result.plan.record;
    const module = app.snapshot.catalogue.modules.find(item => item.id === saved.module);
    const done = note('ok', {
      title: 'Publié.',
      // This sentence becomes "En ligne ✓" once the public site shows the document.
      text: app.deployLine('Visible sur le site dans environ une minute.'),
      lines: result.listIsOld ? ["La liste n'a pas pu être relue : cliquez sur « Rafraîchir » dans « Mes documents »."] : []
    });
    donePanel.replaceChildren(
      done,
      el('dl', {class: 'preview__facts'},
        el('dt', {}, 'Identifiant'), el('dd', {}, el('code', {}, saved.id)),
        el('dt', {}, 'Fichier PDF'), el('dd', {}, el('code', {}, saved.pdfPath))
      ),
      el('p', {}, el('a', {class: 'action-link', href: `../module.html?id=${encodeURIComponent(saved.module)}&type=${saved.type}`, target: '_blank', rel: 'noopener'},
        `Voir la page du module ${module?.abbr ?? saved.module}`, el('span', {class: 'visually-hidden'}, ' (nouvel onglet)')
      )),
      el('p', {class: 'note__actions'},
        button('Ajouter un autre document dans ce module', {variant: 'primary', onClick: () => another()}),
        button('Voir mes documents', {onClick: () => app.openList()})
      )
    );
    body.hidden = true;
    donePanel.hidden = false;
    focusOn(done);
  }

  // Empties the form but keeps the semester, the module and the type.
  function another() {
    Object.assign(values, emptyValues(), {semester: values.semester, module: values.module, type: values.type});
    fileProblem = null;
    titleInput.value = '';
    problemBox.replaceChildren();
    drawDetails();
    drawFile();
    draw();
    donePanel.hidden = true;
    body.hidden = false;
    (controls.chapter ?? controls.number ?? controls.year ?? titleInput).focus();
  }

  // Draws what depends on the catalogue: the semesters, the modules and their counts. Called at
  // the start and after each new read of the repository; what was typed stays.
  function draw() {
    if (!editing) {
      settle();
      drawSemesters();
      drawModules();
      drawTypes();
    }
    update();
  }

  // Starts a new document in a given module, from the shortcut of an empty module.
  function startIn(module) {
    if (!donePanel.hidden) another();
    values.semester = module.semester;
    values.module = module.id;
    remember({semester: values.semester, module: values.module, type: values.type});
    draw();
    (controls.type ?? titleInput).focus();
  }

  drawDetails();
  drawFile();
  draw();
  return {node, draw, startIn, focus: () => (editing ? titleInput : controls.semester ?? titleInput).focus()};
}
