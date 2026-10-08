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
    // Short enough for one line on a phone.
    'sample.text': 'Les fichiers sont factices.',

    'home.docTitle': 'Ressources L2 Informatique | Université Mohammed Seddik Benyahia – Jijel',
    'home.title': 'Ressources de Licence 2 Informatique',
    'home.lede': 'Cours, TD, TP et examens, classés par semestre et par module.',
    'semester.empty.title': 'Bientôt disponible',
    'semester.empty.text': 'Les modules de ce semestre seront ajoutés ici.',

    'module.docTitle': '{abbr} {title} | Ressources L2 Informatique',
    'module.empty.title': 'Aucun document pour ce module pour le moment.',
    'module.empty.text': 'Les cours, TD, TP et examens apparaîtront ici dès leur ajout.',
    'module.notFound.title': 'Module introuvable',
    'module.notFound.text': "Aucun module ne correspond à cette adresse. Vérifiez le lien, ou choisissez un module depuis l'accueil.",
    'module.notFound.action': 'Voir tous les modules',

    'notFound.docTitle': 'Page introuvable | Ressources L2 Informatique',
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
    'file.size': 'PDF, {size}',
    'action.view': 'Voir',
    'action.download': 'Télécharger',
    // Read by screen readers after "Voir" or "Télécharger", so each link says which document it opens.
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
    'error.title': "La liste des documents n'a pas pu être chargée.",
    'error.text': 'Vérifiez votre connexion, puis rechargez la page.',
    'error.action': 'Recharger la page',

    'count.modules': {one: '{count} module', other: '{count} modules'},
    'count.documents': {zero: 'Aucun document', one: '{count} document', other: '{count} documents'},
    'count.exams': {zero: 'Aucun examen', one: '{count} examen', other: '{count} examens'}
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
    'sample.text': 'الملفات وهمية.',

    'home.docTitle': 'موارد السنة الثانية ليسانس إعلام آلي | جامعة محمد الصديق بن يحيى – جيجل',
    'home.title': 'موارد السنة الثانية ليسانس إعلام آلي',
    'home.lede': 'دروس وأعمال موجهة وأعمال تطبيقية وامتحانات، مرتبة حسب السداسي والمقياس.',
    'semester.empty.title': 'قريبًا',
    'semester.empty.text': 'ستُضاف مقاييس هذا السداسي هنا.',

    'module.docTitle': '{abbr} {title} | موارد السنة الثانية ليسانس إعلام آلي',
    'module.empty.title': 'لا توجد وثائق لهذا المقياس حاليًا.',
    'module.empty.text': 'ستظهر الدروس والأعمال الموجهة والأعمال التطبيقية والامتحانات هنا فور إضافتها.',
    'module.notFound.title': 'المقياس غير موجود',
    'module.notFound.text': 'لا يوجد مقياس يطابق هذا العنوان. تحقق من الرابط، أو اختر مقياسًا من الصفحة الرئيسية.',
    'module.notFound.action': 'عرض كل المقاييس',

    'notFound.docTitle': 'الصفحة غير موجودة | موارد السنة الثانية ليسانس إعلام آلي',
    'notFound.title': 'الصفحة غير موجودة',
    'notFound.text': 'هذا العنوان لا يطابق أي صفحة في الموقع. قد يكون الرابط ناقصًا أو قديمًا.',
    'notFound.action': 'عرض كل المقاييس',

    'tabs.label': 'أنواع الوثائق',
    'type.cours': 'دروس',
    // The tabs keep the abbreviations students say aloud, which also fit four across on a phone.
    'type.td': 'TD',
    'type.tp': 'TP',
    'type.examen': 'امتحانات',
    'type.td.name': 'أعمال موجهة',
    'type.tp.name': 'أعمال تطبيقية',
    'empty.cours': 'لا توجد دروس حاليًا.',
    'empty.td': 'لا توجد أعمال موجهة حاليًا.',
    'empty.tp': 'لا توجد أعمال تطبيقية حاليًا.',
    'empty.examen': 'لا توجد امتحانات حاليًا.',
    'empty.text': 'ستظهر الوثائق هنا فور إضافتها.',

    'marker.cours': 'الفصل {n}',
    'marker.td': 'TD {n}',
    'marker.tp': 'TP {n}',
    'correction.yes': 'مع التصحيح',
    'correction.tp.yes': 'مع التصحيح أو الكود',
    'correction.no': 'بدون تصحيح',
    'session.normal': 'الدورة العادية',
    'session.rattrapage': 'الدورة الاستدراكية',
    'kind.emd': 'امتحان متوسط المدة (EMD)',
    'kind.final': 'الامتحان النهائي',
    'kind.controle': 'مراقبة مستمرة',
    'sample.tag': 'تجريبي',
    'file.missing': 'الملف غير متوفر',
    'file.size': 'PDF، {size}',
    'action.view': 'عرض',
    'action.download': 'تحميل',
    'action.target': ': {name} (PDF)',

    'search.label': 'ابحث عن مقياس أو وثيقة',
    'search.placeholder': 'مثال: ASD3، امتحان',
    'search.submit': 'بحث',
    'search.docTitle': 'البحث | موارد السنة الثانية ليسانس إعلام آلي',
    'search.docTitle.query': '«{query}» | البحث | موارد السنة الثانية ليسانس إعلام آلي',
    'search.title': 'البحث',
    'search.prompt.title': 'عمّ تبحث؟',
    'search.prompt.text': 'اكتب اختصار المقياس أو اسمه (ASD3، بنية الحواسيب…)، أو كلمة من عنوان الوثيقة.',
    'search.short.title': 'اكتب حرفين على الأقل.',
    'search.status': '{summary} لـ «{query}»',
    'search.none.title': 'لا توجد نتائج لـ «{query}».',
    'search.none.text': 'تحقق من الكتابة، أو جرّب اختصار المقياس (ASD3، POO1…)، أو كلمة أقصر.',
    'search.none.action': 'عرض كل المقاييس',
    'search.modules': 'المقاييس',
    'search.documents': 'الوثائق',
    'search.capped': 'تُعرض أول {shown} وثيقة فقط. أضف كلمة لتدقيق البحث.',
    'marker.examen': 'امتحان',
    'list.separator': '، ',

    'filter.legend': 'تصفية الامتحانات',
    'filter.year': 'السنة الجامعية',
    'filter.session': 'الدورة',
    'filter.all': 'الكل',
    'filter.session.normal': 'العادية',
    'filter.session.rattrapage': 'الاستدراكية',
    'filter.reset': 'إعادة ضبط التصفية',
    'filter.none.title': 'لا يوجد امتحان يطابق هذه التصفية.',
    'filter.none.text': 'غيّر السنة أو الدورة، أو أعد ضبط التصفية.',

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
    },
    'count.exams': {
      zero: 'لا توجد امتحانات',
      one: 'امتحان واحد',
      two: 'امتحانان',
      few: '{count} امتحانات',
      many: '{count} امتحانًا',
      other: '{count} امتحان'
    }
  }
};

const pluralRules = new Intl.PluralRules(lang);

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (placeholder, name) => values[name] ?? placeholder);
}

// Returns the label for a key, with {name} placeholders filled from values.
export function t(key, values = {}) {
  return fill(strings[lang][key] ?? strings[DEFAULT_LANG][key] ?? key, values);
}

// The same label in every language. Search uses it, because a reader may type in either language.
export function everyLanguage(key, values = {}) {
  return languages.map(language => fill(strings[language.code][key], values));
}

// "14 ko" or "1,4 Mo". Digits stay Western in Arabic, as elsewhere on the site.
export function formatFileSize(bytes) {
  const inMegabytes = bytes >= 1000 * 1000;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'unit',
    unit: inMegabytes ? 'megabyte' : 'kilobyte',
    unitDisplay: 'short',
    maximumFractionDigits: inMegabytes ? 1 : 0
  }).format(inMegabytes ? bytes / (1000 * 1000) : Math.max(1, bytes / 1000));
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
// It starts from the page's own path, so it also works on 404.html, which sets a <base>.
export function languageUrl(code) {
  const url = new URL(location.href);
  url.searchParams.set('lang', code);
  return url.pathname + url.search + url.hash;
}
