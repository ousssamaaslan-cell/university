// Interface text in French and Arabic, and helpers to use it.
// js/lang.js has already set <html lang>, so this module only reads it.
//
// The Arabic text is a draft awaiting the maintainer's review (docs/project-brief.md).
// To change a label, edit it here; keep the same keys in both languages.

export const DEFAULT_LANG = 'fr';
export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'fr';

// Each language is named in its own script, so a reader who cannot read the current page can still find theirs.
export const languages = [
  {code: 'fr', name: 'Français'},
  {code: 'ar', name: 'العربية'}
];

const strings = {
  fr: {
    'site.name': 'Ressources L2 Informatique',
    'site.university': 'Université Mohammed Seddik Benyahia – Jijel',
    'site.about': 'Cours, TD, TP et examens de Licence 2 Informatique.',
    'skip': 'Aller au contenu',
    'lang.label': 'Langue',
    'breadcrumb.label': "Fil d'Ariane",
    'breadcrumb.home': 'Accueil',
    'sample.title': "Données d'exemple.",
    'sample.text': 'Les documents listés sont des fichiers factices, utilisés pendant la construction du site.',

    'home.docTitle': 'Ressources L2 Informatique | Université Mohammed Seddik Benyahia – Jijel',
    'home.title': 'Ressources de Licence 2 Informatique',
    'home.lede': 'Cours, TD, TP et examens, classés par semestre et par module.',
    'semester.empty.title': 'Bientôt disponible',
    'semester.empty.text': 'Les modules de ce semestre seront ajoutés ici.',

    'module.docTitle': '{abbr} {title} | Ressources L2 Informatique',
    'module.types.title': 'Documents par type',
    'module.notFound.title': 'Module introuvable',
    'module.notFound.text': "Aucun module ne correspond à cette adresse. Vérifiez le lien, ou choisissez un module depuis l'accueil.",
    'module.notFound.action': 'Voir tous les modules',

    'type.cours': 'Cours',
    'type.td': 'TD',
    'type.tp': 'TP',
    'type.examen': 'Examens',

    'loading': 'Chargement…',
    'error.title': "La liste des documents n'a pas pu être chargée.",
    'error.text': 'Vérifiez votre connexion, puis rechargez la page.',
    'error.action': 'Recharger la page',

    'count.modules': {one: '{count} module', other: '{count} modules'},
    'count.documents': {zero: 'Aucun document', one: '{count} document', other: '{count} documents'}
  },

  ar: {
    'site.name': 'موارد السنة الثانية ليسانس إعلام آلي',
    'site.university': 'جامعة محمد الصديق بن يحيى – جيجل',
    'site.about': 'دروس وأعمال موجهة وأعمال تطبيقية وامتحانات السنة الثانية ليسانس إعلام آلي.',
    'skip': 'انتقل إلى المحتوى',
    'lang.label': 'اللغة',
    'breadcrumb.label': 'مسار التصفح',
    'breadcrumb.home': 'الرئيسية',
    'sample.title': 'بيانات تجريبية.',
    'sample.text': 'الوثائق المعروضة ملفات وهمية تُستعمل أثناء إنشاء الموقع.',

    'home.docTitle': 'موارد السنة الثانية ليسانس إعلام آلي | جامعة محمد الصديق بن يحيى – جيجل',
    'home.title': 'موارد السنة الثانية ليسانس إعلام آلي',
    'home.lede': 'دروس وأعمال موجهة وأعمال تطبيقية وامتحانات، مرتبة حسب السداسي والمقياس.',
    'semester.empty.title': 'قريبًا',
    'semester.empty.text': 'ستُضاف مقاييس هذا السداسي هنا.',

    'module.docTitle': '{abbr} {title} | موارد السنة الثانية ليسانس إعلام آلي',
    'module.types.title': 'الوثائق حسب النوع',
    'module.notFound.title': 'المقياس غير موجود',
    'module.notFound.text': 'لا يوجد مقياس يطابق هذا العنوان. تحقق من الرابط، أو اختر مقياسًا من الصفحة الرئيسية.',
    'module.notFound.action': 'عرض كل المقاييس',

    'type.cours': 'دروس',
    'type.td': 'أعمال موجهة (TD)',
    'type.tp': 'أعمال تطبيقية (TP)',
    'type.examen': 'امتحانات',

    'loading': 'جارٍ التحميل…',
    'error.title': 'تعذّر تحميل قائمة الوثائق.',
    'error.text': 'تحقق من اتصالك بالإنترنت ثم أعد تحميل الصفحة.',
    'error.action': 'أعد تحميل الصفحة',

    // Arabic has six plural forms; Intl.PluralRules picks the right one for each number.
    'count.modules': {
      one: 'مقياس واحد',
      two: 'مقياسان',
      few: '{count} مقاييس',
      many: '{count} مقياسًا',
      other: '{count} مقياس'
    },
    'count.documents': {
      zero: 'لا توجد وثائق',
      one: 'وثيقة واحدة',
      two: 'وثيقتان',
      few: '{count} وثائق',
      many: '{count} وثيقة',
      other: '{count} وثيقة'
    }
  }
};

const pluralRules = new Intl.PluralRules(lang);

// Returns the label for a key, with {name} placeholders filled from values.
export function t(key, values = {}) {
  const template = strings[lang][key] ?? strings[DEFAULT_LANG][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => values[name] ?? placeholder);
}

// Returns a counted label such as "3 documents", in the right plural form for the language.
// Numbers stay in Western digits in Arabic, as is usual in Algeria.
export function tCount(key, count) {
  const forms = strings[lang][key];
  const form = (count === 0 && forms.zero) || forms[pluralRules.select(count)] || forms.other;
  return form.replace('{count}', count);
}

// Picks the current language from a catalogue text such as { "fr": "...", "ar": "..." }.
export function localized(text) {
  return text[lang] || text[DEFAULT_LANG];
}

// Builds a relative link to a page of the site. It keeps the reader's language by adding
// ?lang= when it is not the default, so a shared link opens in the same language.
export function pageUrl(page, params = {}, hash = '') {
  const query = new URLSearchParams(params);
  if (lang !== DEFAULT_LANG) query.set('lang', lang);
  const search = query.toString();
  return page + (search ? `?${search}` : '') + (hash ? `#${hash}` : '');
}

// Link to the page the reader is on, in another language.
export function languageUrl(code) {
  const url = new URL(location.href);
  url.searchParams.set('lang', code);
  return url.search + url.hash;
}
