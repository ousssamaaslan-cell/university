// The interface text, in French, and helpers to use it.
// To change a label, edit it here. Text that is already written in a page's HTML (the report
// form, the home page's title) is changed there.

const strings = {
  'site.name': 'Ressources L2 Informatique',
  'site.university': 'Université Mohammed Seddik Benyahia – Jijel',
  'skip': 'Aller au contenu',

  // The footer: who runs the site, when it last changed, and how to report a problem.
  'footer.status': "Site tenu par des étudiants. Ce n'est pas un site officiel de l'Université Mohammed Seddik Benyahia – Jijel.",
  'footer.updated': 'Dernière mise à jour :',
  'report.prompt': 'Un fichier manquant ou incorrect ?',
  'report.label': 'Signaler une erreur',
  // Read by screen readers only. After a link that several rows repeat ("Signaler une erreur",
  // "Examens"): which document or module this one belongs to.
  'link.target': ' : {name}',
  'report.sending': 'Envoi en cours…',
  'report.success': 'Merci, votre signalement a été envoyé.',
  'report.error': "L'envoi a échoué. Vérifiez votre connexion, puis réessayez.",

  'breadcrumb.label': "Fil d'Ariane",
  'breadcrumb.home': 'Accueil',
  'sample.title': "Données d'exemple.",
  // Short enough for one line on a phone.
  'sample.text': 'Les fichiers sont factices.',
  // The name screen readers give to the notice.
  'sample.label': "Données d'exemple",

  'home.title': 'Ressources de Licence 2 Informatique',
  'home.lede': 'Cours, TD, TP et examens, classés par semestre et par module.',
  'semester.empty.title': 'Bientôt disponible',
  'semester.empty.text': 'Les modules de ce semestre seront ajoutés ici.',

  'module.docTitle': '{abbr} {title} | Ressources L2 Informatique',
  'module.description': "Cours, TD, TP et examens du module {abbr} ({title}), Licence 2 Informatique, Université Mohammed Seddik Benyahia – Jijel.",
  'module.empty.title': "Ce module n'a pas encore de document.",
  'module.empty.text': 'Les cours, TD, TP et examens apparaîtront ici dès leur ajout.',
  'module.notFound.title': 'Module introuvable',
  'module.notFound.text': "Aucun module ne correspond à cette adresse. Vérifiez le lien, ou choisissez un module depuis l'accueil.",
  'module.notFound.action': 'Voir tous les modules',

  'notFound.title': 'Page introuvable',
  'notFound.text': 'Cette adresse ne correspond à aucune page du site. Le lien est peut-être incomplet ou ancien.',
  'notFound.action': 'Voir tous les modules',

  'tabs.label': 'Types de documents',
  'type.cours': 'Cours',
  'type.td': 'TD',
  'type.tp': 'TP',
  'type.examen': 'Examens',
  // The full names behind TD and TP. They are never shown as labels; search accepts them.
  'type.td.name': 'Travaux dirigés',
  'type.tp.name': 'Travaux pratiques',
  'empty.cours': 'Aucun cours pour le moment.',
  'empty.td': 'Aucun TD pour le moment.',
  'empty.tp': 'Aucun TP pour le moment.',
  'empty.examen': 'Aucun examen pour le moment.',
  'empty.text': 'Les documents apparaîtront ici dès leur ajout.',

  // What a resource row shows: its number, then facts about it.
  'marker.cours': 'Chapitre {n}',
  'marker.td': 'TD {n}',
  'marker.tp': 'TP {n}',
  'correction.yes': 'Avec corrigé',
  'correction.tp.yes': 'Avec corrigé ou code',
  'correction.no': 'Sans corrigé',
  'session.normal': 'Session normale',
  'session.rattrapage': 'Session de rattrapage',
  'kind.emd': 'EMD',
  'kind.final': 'Examen final',
  'kind.controle': 'Contrôle',
  'sample.tag': 'Exemple',
  'file.missing': 'Fichier indisponible',
  'file.type': 'PDF',
  'action.download': 'Télécharger',
  // Read by screen readers only. After a document title: what the link does.
  'action.open': ', ouvrir le PDF',
  // After "Télécharger": which document the button saves.
  'action.target': ' : {name} (PDF)',

  'search.label': 'Rechercher un module ou un document',
  'search.placeholder': 'Ex. : ASD3, examen',
  'search.submit': 'Rechercher',
  'search.docTitle': 'Recherche | Ressources L2 Informatique',
  'search.docTitle.query': '« {query} » | Recherche | Ressources L2 Informatique',
  'search.title': 'Recherche',
  'search.prompt.title': 'Que cherchez-vous ?',
  'search.prompt.text': "Tapez l'abréviation ou le nom d'un module (ASD3, Architecture…), ou un mot du titre d'un document.",
  'search.short.title': 'Tapez au moins 2 caractères.',
  'search.status': '{summary} pour « {query} »',
  'search.none.title': 'Aucun résultat pour « {query} ».',
  'search.none.text': "Vérifiez l'orthographe, essayez l'abréviation du module (ASD3, POO1…) ou un mot plus court.",
  'search.none.action': 'Voir tous les modules',
  'search.modules': 'Modules',
  'search.documents': 'Documents',
  'search.capped': 'Seuls les {shown} premiers documents sont affichés. Ajoutez un mot pour préciser la recherche.',
  'marker.examen': 'Examen',
  'list.separator': ', ',

  'filter.legend': 'Filtrer les examens',
  // The label above each list says what it filters, so the choices stay short enough for a phone.
  'filter.year': 'Année universitaire',
  'filter.session': 'Session',
  'filter.all': 'Toutes',
  'filter.session.normal': 'Normale',
  'filter.session.rattrapage': 'Rattrapage',
  'filter.reset': 'Réinitialiser les filtres',
  'filter.none.title': 'Aucun examen ne correspond à ces filtres.',
  'filter.none.text': "Changez l'année ou la session, ou réinitialisez les filtres.",

  'loading': 'Chargement…',
  // Page heading and title when a module page cannot load, since the module's name is not known.
  'error.heading': 'Chargement impossible',
  'error.title': "La liste des documents n'a pas pu être chargée.",
  'error.text': 'Vérifiez votre connexion, puis rechargez la page.',
  'error.action': 'Recharger la page',

  'count.modules': {one: '{count} module', other: '{count} modules'},
  'count.documents': {zero: 'Aucun document', one: '{count} document', other: '{count} documents'},
  'count.exams': {zero: 'Aucun examen', one: '{count} examen', other: '{count} examens'}
};

const pluralRules = new Intl.PluralRules('fr');

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => values[name] ?? placeholder);
}

// French puts a space before ? ! : ; and » and after « and "n°". On the page that space must not
// break, or a narrow screen leaves the mark alone at the start of a line. The texts above and the
// catalogue are typed with ordinary spaces; this turns those spaces into no-break spaces.
// The dash in "Benyahia – Jijel" keeps its two neighbours on its line.
// Pages pass catalogue text (a module's name, a document's title) through it before showing it.
export function typeset(text) {
  return text
    .replace(/ – /g, ' – ')
    .replace(/ ([?!:;»])/g, ' $1')
    .replace(/(«|n°) /g, '$1 ');
}

// Returns the label for a key, with {name} placeholders filled from values.
export function t(key, values = {}) {
  return typeset(fill(strings[key] ?? key, values));
}

// "14 ko" or "1,4 Mo".
export function formatFileSize(bytes) {
  const inMegabytes = bytes >= 1000 * 1000;
  return new Intl.NumberFormat('fr-DZ', {
    style: 'unit',
    unit: inMegabytes ? 'megabyte' : 'kilobyte',
    unitDisplay: 'short',
    maximumFractionDigits: inMegabytes ? 1 : 0
  }).format(inMegabytes ? bytes / (1000 * 1000) : Math.max(1, bytes / 1000));
}

// "8 octobre 2026".
// The day is the one in Algeria, so every reader sees the same date whatever their device's clock zone.
export function formatDate(date) {
  return new Intl.DateTimeFormat('fr-DZ', {dateStyle: 'long', timeZone: 'Africa/Algiers'}).format(date);
}

// Returns a counted label such as "3 documents", in the right plural form.
export function tCount(key, count) {
  const forms = strings[key];
  const form = (count === 0 && forms.zero) || forms[pluralRules.select(count)] || forms.other;
  return form.replace('{count}', count);
}

// Builds a relative link to a page of the site, with its parameters and its #fragment.
export function pageUrl(page, params = {}, hash = '') {
  const search = new URLSearchParams(params).toString();
  return page + (search ? `?${search}` : '') + (hash ? `#${hash}` : '');
}
