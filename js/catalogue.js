// Loads data/resources.json and answers questions about it.
// The catalogue format is described in docs/content-model.md.

// The four resource types, in the order module pages show them.
export const RESOURCE_TYPES = ['cours', 'td', 'tp', 'examen'];

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
  return catalogue;
}

const byOrder = (a, b) => a.order - b.order;

export function semestersOf(catalogue) {
  return [...catalogue.semesters].sort(byOrder);
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

// Build-phase sample records have an ID starting with "sample-" (docs/project-brief.md).
export function isSample(resource) {
  return resource.id.startsWith('sample-');
}

// The anchor of a semester section on the home page: "S3" -> "s3".
export function semesterAnchor(semesterId) {
  return semesterId.toLowerCase();
}
