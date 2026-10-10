// "Mes documents": every document of the catalogue as GitHub holds it now, grouped by semester,
// by module and by type, in the order the site lists them, with a search box and a type filter.
import {el} from '../js/dom.js';
import {button, markerOf, nameOf, sizeLabel, countLabel, TYPE_GROUP_LABELS, KIND_LABELS, SESSION_LABELS} from './ui.js';

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

  const search = el('input', {id: 'doc-search', type: 'search', placeholder: 'Titre, module, numéro ou année', autocomplete: 'off', enterkeyhint: 'search'});
  const type = el('select', {id: 'doc-type'},
    el('option', {value: ''}, 'Tous les types'),
    app.rules.TYPES.map(value => el('option', {value}, TYPE_GROUP_LABELS[value]))
  );
  const refresh = button('Rafraîchir');
  const status = el('p', {class: 'doc-status', role: 'status'});
  const messages = el('div', {class: 'doc-messages'});
  const groups = el('div', {class: 'doc-groups'});
  const node = el('div', {class: 'documents'},
    messages,
    el('div', {class: 'doc-tools'},
      el('div', {class: 'field doc-tools__search'}, el('label', {for: 'doc-search'}, 'Rechercher'), search),
      el('div', {class: 'field'}, el('label', {for: 'doc-type'}, 'Type'), type),
      refresh
    ),
    status,
    groups
  );

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
    const view = button(['Voir', about()], {disabled: !file});
    view.addEventListener('click', () => app.openPdf(resource, messages));
    return el('li', {class: 'doc', 'data-id': resource.id},
      el('div', {class: 'doc__text'},
        el('p', {class: 'doc__title'}, marker && el('span', {class: 'resource__marker'}, marker), marker && ' ', resource.title.fr),
        el('p', {class: 'doc__title-ar', lang: 'ar', dir: 'rtl'}, resource.title.ar),
        el('ul', {class: 'facts', role: 'list'}, factsOf(resource, file).map(fact => el('li', {class: 'fact'}, fact)))
      ),
      el('div', {class: 'doc__actions'}, view)
    );
  }

  function draw() {
    const {catalogue, files, readAt} = app.snapshot;
    const modulesById = new Map(catalogue.modules.map(module => [module.id, module]));
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
  }

  return {node, draw};
}
