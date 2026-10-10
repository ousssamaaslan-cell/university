// "Mes documents": every document of the catalogue as GitHub holds it now, grouped by semester,
// by module and by type, in the order the site lists them, with a search box and a type filter.
// A document is changed from here, in the same form that adds one, and removed from here, alone
// or with others, after a confirmation inside the page.
import {el} from '../js/dom.js';
import {button, note, focusOn, markerOf, nameOf, sizeLabel, countLabel, TYPE_LABELS, TYPE_GROUP_LABELS, KIND_LABELS, SESSION_LABELS} from './ui.js';
import {createForm} from './form.js';

// Lower case and without accents, so "algebre" finds "Algèbre".
const fold = text => String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Everything the search box looks in: both titles, the module's code and name, the number
// ("td 3", "chapitre 2"), the year, the type, and the ID.
function searchText(resource, module) {
  return fold([
    module?.abbr, module?.title.fr, resource.title.fr, resource.title.ar, markerOf(resource), TYPE_GROUP_LABELS[resource.type],
    resource.academicYear, KIND_LABELS[resource.examKind], SESSION_LABELS[resource.session], resource.id
  ].filter(Boolean).join(' '));
}

// Turns what was typed into a test for one document. Every word must be found. As in the site's
// search, a number typed after its word ("td 3", "tp2", "chapitre 4") must be the document's own
// number, and a number alone must be a whole number of the document: "3" does not find every
// document of ASD3.
function matcherFor(query) {
  const numbered = [];
  const rest = fold(query).replace(/(^|\s)(td|tp|chapitre|cours)\s*(\d+)(?=\s|$)/g, (match, before, word, number) => {
    numbered.push({type: word === 'chapitre' ? 'cours' : word, number: Number(number)});
    return ' ';
  });
  const words = rest.split(/\s+/).filter(Boolean);
  return (resource, module) => {
    const own = resource.type === 'cours' ? resource.chapter : resource.number;
    if (!numbered.every(item => item.type === resource.type && item.number === own)) return false;
    const text = searchText(resource, module);
    const whole = text.split(/[^\p{L}\p{N}]+/u);
    return words.every(word => (/^\d+$/.test(word) ? whole.includes(word) : text.includes(word)));
  };
}

export function createDocumentsView(app) {
  const filters = {query: '', type: ''};
  // The modules the maintainer folded. Kept here so they stay folded when the list is drawn again.
  const folded = new Set();
  // The IDs of the documents ticked for a deletion together.
  const selected = new Set();

  const search = el('input', {id: 'doc-search', type: 'search', placeholder: 'Titre, module, numéro ou année', autocomplete: 'off', enterkeyhint: 'search'});
  const type = el('select', {id: 'doc-type'},
    el('option', {value: ''}, 'Tous les types'),
    app.rules.TYPES.map(value => el('option', {value}, TYPE_GROUP_LABELS[value]))
  );
  const refresh = button('Rafraîchir');
  const status = el('p', {class: 'doc-status', role: 'status'});
  const messages = el('div', {class: 'doc-messages'});
  const groups = el('div', {class: 'doc-groups'});

  // Shown while documents are ticked. It stays at the top of the window, so it is at hand
  // wherever the ticked rows are in a long list.
  const selectionCount = el('p', {class: 'selection-bar__count', 'aria-live': 'polite'});
  const deleteSelection = button('Supprimer la sélection', {variant: 'danger'});
  const clearSelection = button('Tout désélectionner');
  const selectionBar = el('div', {class: 'selection-bar', role: 'region', 'aria-label': 'Documents sélectionnés', hidden: true}, selectionCount, deleteSelection, clearSelection);

  // The confirmation, a dialog inside the page: what will be removed, then the two answers.
  const confirmTitle = el('h2', {class: 'confirm__title', id: 'confirm-title'});
  const confirmList = el('ul', {class: 'confirm__list', role: 'list'});
  const confirmText = el('p', {id: 'confirm-text'});
  const confirmProblem = el('div', {});
  const cancel = button('Annuler');
  const confirm = button('Supprimer définitivement', {variant: 'danger'});
  const dialog = el('dialog', {class: 'confirm', 'aria-labelledby': 'confirm-title', 'aria-describedby': 'confirm-text'},
    confirmTitle, confirmList, confirmText, confirmProblem, el('div', {class: 'confirm__actions'}, cancel, confirm)
  );
  // The deletion being confirmed: {documents, opener}, opener being the button to go back to.
  let asked = null;
  let deleting = false;

  const tools = el('div', {class: 'doc-tools'},
    el('div', {class: 'field doc-tools__search'}, el('label', {for: 'doc-search'}, 'Rechercher'), search),
    el('div', {class: 'field'}, el('label', {for: 'doc-type'}, 'Type'), type),
    refresh
  );
  // The form of the document being changed. While it is open it takes the place of the list.
  const editor = el('div', {class: 'doc-editor', hidden: true});
  let edited = null;
  const node = el('div', {class: 'documents'}, messages, tools, status, selectionBar, groups, editor, dialog);

  function openEditor(resource) {
    const module = app.snapshot.catalogue.modules.find(item => item.id === resource.module);
    const name = nameOf(resource, module);
    const heading = el('h3', {class: 'doc-editor__title'}, `Modifier : ${name}`);
    const form = createForm(app, {
      resource,
      onCancel: () => closeEditor(resource.id),
      onSaved: result => closeEditor(resource.id, result.changed
        ? note('ok', {
          title: `Modifications enregistrées : ${nameOf(result.plan.record, module)}.`,
          text: app.local
            ? "Aperçu local : rien n'a été envoyé à GitHub."
            : `${result.plan.writes.length ? 'Le PDF a été remplacé et sa fiche mise à jour, en un seul enregistrement.' : 'La fiche a été mise à jour.'} Le site public se met à jour dans environ une minute.`,
          lines: result.listIsOld ? ["La liste n'a pas pu être relue : cliquez sur « Rafraîchir »."] : []
        })
        : note('info', {title: 'Rien à enregistrer.', text: 'Le fichier choisi est le même que le fichier actuel, et la fiche est inchangée.'}))
    });
    edited = {id: resource.id, form};
    editor.replaceChildren(
      el('p', {}, button('Retour à la liste sans enregistrer', {onClick: () => closeEditor(resource.id)})),
      heading,
      form.node
    );
    for (const part of [tools, status, selectionBar, groups]) part.hidden = true;
    messages.replaceChildren();
    editor.hidden = false;
    focusOn(heading);
  }

  // Back to the list: with a message after a save, or on the row's button after "Annuler".
  function closeEditor(id, message = null) {
    edited = null;
    editor.hidden = true;
    editor.replaceChildren();
    for (const part of [tools, status, groups]) part.hidden = false;
    draw();
    if (message) {
      messages.replaceChildren(message);
      focusOn(message);
    } else {
      groups.querySelector(`.doc[data-id="${CSS.escape(id)}"] .button--edit`)?.focus();
    }
  }

  search.addEventListener('input', () => { filters.query = search.value; draw(); });
  type.addEventListener('change', () => { filters.type = type.value; draw(); });
  refresh.addEventListener('click', async () => {
    refresh.disabled = true;
    refresh.textContent = 'Lecture en cours…';
    messages.replaceChildren();
    try {
      await app.reload();
    } catch (error) {
      messages.replaceChildren(app.errorNote(error));
    }
    refresh.disabled = false;
    refresh.textContent = 'Rafraîchir';
  });

  function clearFilters() {
    filters.query = '';
    filters.type = '';
    search.value = '';
    type.value = '';
    draw();
    search.focus();
  }

  function drawSelection() {
    selectionBar.hidden = selected.size === 0;
    selectionCount.textContent = selected.size === 1 ? '1 document sélectionné' : `${selected.size} documents sélectionnés`;
  }

  clearSelection.addEventListener('click', () => {
    selected.clear();
    draw();
    search.focus();
  });
  deleteSelection.addEventListener('click', () => {
    // In the order of the list, whatever the order of the ticks.
    askToDelete(app.snapshot.catalogue.resources.filter(resource => selected.has(resource.id)), deleteSelection);
  });

  // Opens the confirmation for one document or several.
  function askToDelete(documents, opener) {
    const modules = new Map(app.snapshot.catalogue.modules.map(module => [module.id, module]));
    const several = documents.length > 1;
    asked = {documents, opener};
    confirmTitle.textContent = several ? `Supprimer ces ${documents.length} documents ?` : 'Supprimer ce document ?';
    confirmList.replaceChildren(...documents.map(resource => {
      const module = modules.get(resource.module);
      return el('li', {},
        el('strong', {}, [markerOf(resource), resource.title.fr].filter(Boolean).join(' — ')),
        el('span', {}, `Module : ${module ? `${module.abbr}, ${module.title.fr}` : resource.module}`),
        el('span', {}, `Type : ${TYPE_LABELS[resource.type]}${resource.academicYear ? `, ${resource.academicYear}` : ''}`)
      );
    }));
    confirmText.textContent = several
      ? 'Chaque PDF et sa fiche dans le catalogue seront supprimés, en un seul enregistrement. Ces documents disparaîtront du site. Cette suppression ne peut pas être annulée depuis cette page.'
      : 'Le PDF et sa fiche dans le catalogue seront supprimés tous les deux. Le document disparaîtra du site. Cette suppression ne peut pas être annulée depuis cette page.';
    confirmProblem.replaceChildren();
    confirm.disabled = false;
    dialog.showModal();
    // The safe answer has the focus: Enter does not delete.
    cancel.focus();
  }

  cancel.addEventListener('click', () => dialog.close());
  // Escape closes the dialog, except while the deletion is being saved.
  dialog.addEventListener('cancel', event => { if (deleting) event.preventDefault(); });
  dialog.addEventListener('close', () => {
    const opener = asked?.opener;
    asked = null;
    if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus();
  });

  confirm.addEventListener('click', async () => {
    const {documents} = asked;
    const modules = new Map(app.snapshot.catalogue.modules.map(module => [module.id, module]));
    deleting = true;
    confirm.disabled = true;
    cancel.disabled = true;
    confirm.textContent = 'Suppression en cours…';
    confirmProblem.replaceChildren();
    let result = null;
    let outdated = false;
    try {
      result = await app.publish({action: 'delete', documents});
    } catch (error) {
      const problem = app.errorNote(error, {saving: true});
      confirmProblem.replaceChildren(problem);
      focusOn(problem);
      // The list on screen no longer matches the repository: read it again behind the dialog.
      // What the dialog shows is then out of date too, so it can only be closed.
      outdated = error.kind === 'stale';
      if (outdated) app.reload().catch(() => {});
    }
    deleting = false;
    cancel.disabled = false;
    confirm.textContent = 'Supprimer définitivement';
    confirm.disabled = outdated;
    if (result === null) return;

    for (const resource of documents) selected.delete(resource.id);
    asked.opener = null;
    dialog.close();
    draw();
    const done = note('ok', {
      title: documents.length > 1 ? `${documents.length} documents supprimés.` : `Supprimé : ${nameOf(documents[0], modules.get(documents[0].module))}.`,
      text: app.local
        ? "Aperçu local : rien n'a été envoyé à GitHub."
        : `${documents.length > 1 ? 'Les PDF et leurs fiches ont été retirés' : 'Le PDF et sa fiche ont été retirés'} du dépôt en un seul enregistrement. Le site public se met à jour dans environ une minute.`,
      lines: result.listIsOld ? ["La liste n'a pas pu être relue : cliquez sur « Rafraîchir »."] : []
    });
    messages.replaceChildren(done);
    focusOn(done);
  });

  // The facts under a title: year, exam kind and session, the correction badge, the file size, the ID.
  function factsOf(resource, file) {
    const facts = [];
    if (resource.academicYear) facts.push(resource.academicYear);
    if (resource.type === 'examen') {
      if (resource.examKind !== 'rattrapage') facts.push(KIND_LABELS[resource.examKind]);
      facts.push(SESSION_LABELS[resource.session]);
    }
    if (resource.hasCorrection) facts.push(el('span', {class: 'fact__badge'}, resource.type === 'tp' ? 'Avec corrigé ou code' : 'Avec corrigé'));
    facts.push(file ? sizeLabel(file.size) : el('span', {class: 'doc__missing'}, 'PDF absent du dépôt'));
    facts.push(el('span', {class: 'doc__id'}, resource.id));
    return facts;
  }

  function row(resource, module, file) {
    const marker = markerOf(resource);
    const name = nameOf(resource, module);
    // Several rows have the same buttons, so screen readers also hear which document each one acts on.
    const about = () => el('span', {class: 'visually-hidden'}, ` : ${name}`);
    const tick = el('input', {type: 'checkbox', checked: selected.has(resource.id), 'aria-label': `Sélectionner ${name}`});
    tick.addEventListener('change', () => {
      if (tick.checked) selected.add(resource.id);
      else selected.delete(resource.id);
      drawSelection();
    });
    const view = button(['Voir', about()], {disabled: !file});
    view.addEventListener('click', () => app.openPdf(resource, messages));
    const edit = button(['Modifier', about()], {class: 'button button--edit'});
    edit.addEventListener('click', () => openEditor(resource));
    const remove = button(['Supprimer', about()], {class: 'button button--remove'});
    remove.addEventListener('click', () => askToDelete([resource], remove));
    return el('li', {class: 'doc', 'data-id': resource.id},
      el('label', {class: 'doc__select'}, tick),
      el('div', {class: 'doc__text'},
        el('p', {class: 'doc__title'}, marker && el('span', {class: 'resource__marker'}, marker), marker && ' ', resource.title.fr),
        el('p', {class: 'doc__title-ar', lang: 'ar', dir: 'rtl'}, resource.title.ar),
        el('ul', {class: 'facts', role: 'list'}, factsOf(resource, file).map(fact => el('li', {class: 'fact'}, fact)))
      ),
      el('div', {class: 'doc__actions'}, view, edit, remove)
    );
  }

  function draw() {
    const {catalogue, files, readAt} = app.snapshot;
    const modulesById = new Map(catalogue.modules.map(module => [module.id, module]));
    const ids = new Set(catalogue.resources.map(resource => resource.id));
    for (const id of [...selected]) if (!ids.has(id)) selected.delete(id);
    const found = matcherFor(filters.query);
    const filtering = filters.query.trim() !== '' || filters.type !== '';
    const matches = resource => (!filters.type || resource.type === filters.type) && found(resource, modulesById.get(resource.module));
    let shown = 0;

    function moduleGroup(module) {
      const total = catalogue.resources.filter(resource => resource.module === module.id).length;
      const byType = app.rules.TYPES
        .map(value => [value, app.rules.sortedResources(catalogue, module.id, value).filter(matches)])
        .filter(([, documents]) => documents.length > 0);
      const count = byType.reduce((sum, [, documents]) => sum + documents.length, 0);
      if (filtering && count === 0) return null;
      shown += count;
      const group = el('details', {class: 'module-group', open: !folded.has(module.id)},
        el('summary', {class: 'module-group__head'},
          el('bdi', {class: 'module-code'}, module.abbr),
          el('span', {class: 'module-group__title'}, module.title.fr),
          el('span', {class: 'module-group__count'}, filtering ? `${count} sur ${total}` : countLabel(total))
        ),
        total === 0
          ? el('div', {class: 'module-group__empty'},
            el('p', {}, 'Aucun document'),
            button(['Ajouter un document', el('span', {class: 'visually-hidden'}, ` dans ${module.abbr}`)], {onClick: () => app.startAdding(module)})
          )
          : byType.map(([value, documents]) => el('section', {class: 'type-group'},
            el('h4', {class: 'type-group__title'}, TYPE_GROUP_LABELS[value], ' ', el('span', {class: 'type-group__count'}, `(${documents.length})`)),
            el('ul', {class: 'doc-list', role: 'list'}, documents.map(resource => row(resource, module, files.get(resource.pdfPath))))
          ))
      );
      group.addEventListener('toggle', () => {
        if (group.open) folded.delete(module.id);
        else folded.add(module.id);
      });
      return group;
    }

    const semesters = [...catalogue.semesters].sort((a, b) => a.order - b.order);
    const sections = semesters.map(semester => {
      const modules = app.rules.modulesInOrder(catalogue).filter(module => module.semester === semester.id);
      const visible = modules.map(moduleGroup).filter(Boolean);
      if (filtering && visible.length === 0) return null;
      return el('section', {class: 'semester-group'},
        el('h3', {class: 'semester-group__title'}, semester.label.fr),
        modules.length === 0 ? el('p', {class: 'hint'}, "Aucun module pour l'instant.") : visible
      );
    }).filter(Boolean);

    const total = catalogue.resources.length;
    const time = readAt.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
    status.textContent = `${filtering ? `${shown} sur ${countLabel(total).toLowerCase()}` : countLabel(total)}. ${app.local ? 'Copie de cet onglet' : `Liste lue sur GitHub à ${time}`}.`;
    groups.replaceChildren(...(filtering && shown === 0
      ? [el('div', {class: 'empty'},
        el('p', {class: 'empty__title'}, 'Aucun document ne correspond à cette recherche.'),
        el('p', {}, button('Effacer la recherche et le filtre', {onClick: clearFilters}))
      )]
      : sections));
    drawSelection();
    // The open form follows the catalogue too, and the bar of ticked rows stays out of its way.
    if (edited) {
      selectionBar.hidden = true;
      edited.form.draw();
    }
  }

  return {node, draw};
}
