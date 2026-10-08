// Loads data/resources.json and answers questions about it.
// The catalogue format is described in docs/content-model.md.

// The four resource types, in the order module pages show them.
export const RESOURCE_TYPES = ['cours', 'td', 'tp', 'examen'];

// Exam sessions, in the order the session filter lists them.
export const SESSIONS = ['normal', 'rattrapage'];

const CATALOGUE_URL = 'data/resources.json';

// "no-cache" makes the browser check for a newer catalogue on every visit,
// so a republished site shows new documents without a hard refresh.
export async function loadCatalogue() {
  const response = await fetch(CATALOGUE_URL, {cache: 'no-cache'});
  if (!response.ok) throw new Error(`Catalogue request failed with status ${response.status}`);
  const catalogue = await response.json();
  for (const key of ['semesters', 'modules', 'resources']) {
    if (!Array.isArray(catalogue[key])) throw new Error(`Catalogue has no "${key}" list`);
  }
  // When the catalogue file last changed on the server, or null if the server does not say.
  // The footer shows it as the date of the last update, so nobody has to type that date.
  const modified = new Date(response.headers.get('last-modified') ?? '');
  catalogue.lastModified = Number.isNaN(modified.getTime()) ? null : modified;
  return catalogue;
}

const byOrder = (a, b) => a.order - b.order;

export function semestersOf(catalogue) {
  return [...catalogue.semesters].sort((a, b) => byOrder(a, b) || a.label.fr.localeCompare(b.label.fr, 'fr'));
}

export function modulesOf(catalogue, semesterId) {
  return catalogue.modules
    .filter(module => module.semester === semesterId)
    .sort((a, b) => byOrder(a, b) || a.title.fr.localeCompare(b.title.fr, 'fr'));
}

export function findModule(catalogue, moduleId) {
  return catalogue.modules.find(module => module.id === moduleId) ?? null;
}

export function findSemester(catalogue, semesterId) {
  return catalogue.semesters.find(semester => semester.id === semesterId) ?? null;
}

// All resources of a module, or only those of one type.
export function resourcesOf(catalogue, moduleId, type = null) {
  return catalogue.resources.filter(resource => resource.module === moduleId && (type === null || resource.type === type));
}

const byTitle = (a, b) => a.title.fr.localeCompare(b.title.fr, 'fr');
const newestYearFirst = (a, b) => (b.academicYear ?? '').localeCompare(a.academicYear ?? '');
const bySheetNumber = (a, b) => a.number - b.number || newestYearFirst(a, b) || byOrder(a, b) || byTitle(a, b);

// Display order of each type, as tabulated in docs/content-model.md.
const displayOrder = {
  cours: (a, b) => a.chapter - b.chapter || byOrder(a, b) || byTitle(a, b),
  td: bySheetNumber,
  tp: bySheetNumber,
  examen: (a, b) => newestYearFirst(a, b) || byOrder(a, b) || byTitle(a, b)
};

// The resources of one type in a module, in the order the module page lists them.
export function sortedResources(catalogue, moduleId, type) {
  return resourcesOf(catalogue, moduleId, type).sort(displayOrder[type]);
}

// Build-phase sample records have an ID starting with "sample-" (docs/project-brief.md).
export function isSample(resource) {
  return resource.id.startsWith('sample-');
}

// The anchor of a semester section on the home page: "S3" -> "s3".
export function semesterAnchor(semesterId) {
  return semesterId.toLowerCase();
}
