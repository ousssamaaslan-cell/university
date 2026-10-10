// Pieces the dashboard's screens share: labels, buttons, messages, and what to say when something fails.
import {el} from '../js/dom.js';
import {t, formatFileSize} from '../js/i18n.js';

// The type of one document, and the heading of a group of them, as the site names its tabs.
export const TYPE_LABELS = {cours: 'Cours', td: 'TD', tp: 'TP', examen: 'Examen'};
export const TYPE_GROUP_LABELS = {cours: 'Cours', td: 'TD', tp: 'TP', examen: 'Examens'};
export const KIND_LABELS = {controle: 'Contrôle', emd: 'EMD', final: 'Examen final', rattrapage: 'Rattrapage'};
export const SESSION_LABELS = {normal: 'Session normale', rattrapage: 'Session de rattrapage'};

// "Chapitre 2", "TD 3" or "TP 1", in the site's own words. An exam has no number.
export function markerOf(resource) {
  if (resource.type === 'cours') return t('marker.cours', {n: resource.chapter});
  if (resource.type === 'td' || resource.type === 'tp') return t(`marker.${resource.type}`, {n: resource.number});
  return null;
}

// A document named in full, for a message or a screen reader: "ASD3, TD 3, Parcours des graphes".
export function nameOf(resource, module) {
  return [module?.abbr, markerOf(resource) ?? `Examen ${resource.academicYear}`, resource.title.fr].filter(Boolean).join(', ');
}

// "PDF, 210 ko", as on the module pages.
export function sizeLabel(bytes) {
  return `PDF, ${formatFileSize(bytes)}`;
}

// "3 documents", "1 document", "Aucun document".
export function countLabel(count) {
  return count === 0 ? 'Aucun document' : count === 1 ? '1 document' : `${count} documents`;
}

// variant: 'primary' for the main action of a screen, 'danger' for a deletion that cannot be undone.
export function button(label, {variant = null, onClick = null, ...attributes} = {}) {
  const node = el('button', {class: variant ? `button button--${variant}` : 'button', type: 'button', ...attributes}, label);
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

// A message in a filled box: 'ok', 'warn', 'error' or 'info'. An error is read out at once by
// screen readers; the others when the reader pauses.
export function note(kind, {title = null, text = null, lines = [], actions = []} = {}) {
  return el('div', {class: `note note--${kind}`, role: kind === 'error' ? 'alert' : 'status'},
    title && el('p', {class: 'note__title'}, title),
    text && el('p', {}, text),
    lines.length > 0 && el('ul', {}, lines.map(line => el('li', {}, line))),
    actions.length > 0 && el('p', {class: 'note__actions'}, actions)
  );
}

// What happened and what to do next, in plain French, for an error from the login
// (netlify-auth.js), from GitHub (github-commit.js) or from the save rules (catalogue-rules.js).
// saving: the error stopped a save, so the text also says whether anything was written.
// Returns {title, text, lines, relogin}; relogin asks for a "Se reconnecter" button.
export function explain(error, {saving = false} = {}) {
  const unsaved = saving ? "Rien n'a été enregistré. " : '';
  switch (error?.kind) {
    case 'blocked':
      return {title: "La fenêtre de connexion n'a pas pu s'ouvrir.", text: 'Autorisez les fenêtres surgissantes pour ce site, puis cliquez de nouveau sur « Se connecter avec GitHub ».'};
    case 'cancelled':
      return {title: 'Connexion interrompue.', text: 'La fenêtre GitHub a été fermée avant la fin. Recommencez quand vous voulez.'};
    case 'refused':
      return {title: 'GitHub a refusé la connexion.', text: 'Recommencez. Si le refus revient, vérifiez dans Netlify que le fournisseur de connexion GitHub est toujours installé pour ce site.'};
    case 'session':
      return {title: 'Votre connexion GitHub a expiré.', text: `${unsaved}Reconnectez-vous, puis recommencez.`, relogin: true};
    case 'access':
      return {title: "Votre compte GitHub n'a pas le droit d'écrire dans le dépôt du site.", text: `${unsaved}Connectez-vous avec le compte du responsable du site, ou demandez à être ajouté au dépôt.`};
    case 'network':
      return error.uncertain
        ? {title: 'La connexion a été coupée à la dernière étape.', text: "Il n'est pas certain que la modification soit enregistrée. Ouvrez « Mes documents » et cliquez sur « Rafraîchir » pour le vérifier avant de recommencer."}
        : {title: 'GitHub est injoignable.', text: `${unsaved}Vérifiez votre connexion à Internet, puis réessayez.`};
    case 'conflict':
      return {title: "Le dépôt a changé deux fois pendant l'enregistrement.", text: `${unsaved}Cliquez sur « Rafraîchir » dans « Mes documents », puis recommencez.`};
    case 'limit':
      return {title: 'GitHub limite le nombre de demandes pour le moment.', text: `${unsaved}Réessayez dans quelques minutes.`};
    case 'path':
      return {title: 'Chemin de fichier refusé.', text: `${unsaved}${error.message}`};
    case 'catalogue':
      return {title: 'Le catalogue du dépôt est illisible.', text: error.message};
    case 'missing':
      return {title: 'Introuvable.', text: `${unsaved}${error.message}`};
    case 'github':
      return {title: 'GitHub a refusé la demande.', text: `${unsaved}${error.message}`};
    case 'stale':
    case 'duplicate':
    case 'file':
    case 'invalid':
      return {title: saving ? "Rien n'a été enregistré." : 'À corriger :', lines: error.problems ?? [error.message]};
    default:
      return {title: "Une erreur inattendue s'est produite.", text: `${unsaved}${error?.message ?? ''}`.trim()};
  }
}

// Moves the keyboard and the screen reader to a heading or a message that just appeared.
export function focusOn(node) {
  if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
  node.focus();
}
