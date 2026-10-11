// The former admin form, now at /admin/decap: Decap CMS, set up for this catalogue.
// It is kept for a while as a backup of the dashboard at /admin (README, "The Decap backup").
//
// Decap provides the login with GitHub and the form. Three things are added here:
//   1. The form is built from the published catalogue, so its Semestre and Module lists always
//      match data/resources.json and nothing is typed twice.
//   2. On save, catalogue-rules.js completes and checks the documents, and names each PDF.
//   3. github-commit.js writes the catalogue and the PDFs to GitHub in one commit.
// Decap alone would save an uploaded file under its original name in one shared folder.
(function () {
  'use strict';

  const rules = window.L2CatalogueRules;
  const REPOSITORY = 'ousssamaaslan-cell/university';
  const BRANCH = 'main';
  // A local preview (python -m http.server) cannot log in to GitHub. It works on a copy of the
  // catalogue held in this tab instead: nothing is sent anywhere, and a reload starts again.
  const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  const KIND_LABELS = {emd: 'EMD', final: 'Examen final', rattrapage: 'Rattrapage', controle: 'Contrôle'};
  const SESSION_LABELS = {normal: 'Session normale', rattrapage: 'Session de rattrapage'};

  function formFields(catalogue) {
    const modules = rules.modulesInOrder(catalogue);
    const semesters = [...catalogue.semesters].sort((a, b) => a.order - b.order);
    // While only one semester has modules, it is chosen in advance. A wrong pair is refused on save.
    const withModules = semesters.filter(semester => modules.some(module => module.semester === semester.id));

    const id = {name: 'id', widget: 'hidden'};
    const semester = {
      name: 'semester', label: 'Semestre', widget: 'select',
      options: semesters.map(item => ({label: `${item.id} — ${item.label}`, value: item.id})),
      ...(withModules.length === 1 ? {default: withModules[0].id} : {})
    };
    const module = {
      name: 'module', label: 'Module', widget: 'select',
      options: modules.map(item => ({label: `${item.abbr} — ${item.title} (${item.semester})`, value: item.id}))
    };
    const title = hint => ({name: 'title', label: 'Titre', widget: 'string', hint});
    const year = required => ({
      name: 'academicYear', label: 'Année universitaire', widget: 'select', required,
      options: rules.academicYears(new Date(), catalogue.resources),
      ...(required ? {} : {hint: "À choisir seulement s'il existe plusieurs versions du même document."})
    });
    const sheetNumber = label => ({name: 'number', label, widget: 'number', value_type: 'int', min: 1, step: 1});
    const correction = label => ({name: 'hasCorrection', label, widget: 'boolean', default: false, required: false});
    const pdf = {
      name: 'pdfPath', label: 'Fichier PDF', widget: 'file', choose_url: false,
      media_library: {allow_multiple: false, config: {max_file_size: rules.MAX_PDF_BYTES}},
      hint: "Choisissez le fichier sur votre ordinateur. Il est rangé dans le dossier du module et renommé à l'enregistrement."
    };
    const order = {
      name: 'order', label: "Ordre d'affichage", widget: 'number', value_type: 'int', min: 0, step: 1, required: false,
      hint: "Départage deux documents de même numéro ou de même année. Laissé vide, il est rempli à l'enregistrement."
    };

    const sheetHint = 'Le sujet de la série. Sans « TD 3 » ni « TP 2 » : la page ajoute le numéro.';
    return [
      {
        name: 'cours', label: 'Cours', widget: 'object',
        summary: '{{fields.module | upper}} · Cours, chapitre {{fields.chapter}} · {{fields.title}}',
        fields: [
          id, semester, module,
          {name: 'chapter', label: 'Numéro du chapitre', widget: 'number', value_type: 'int', min: 0, step: 1},
          title('Le sujet du chapitre. Sans « Chapitre 2 » : la page ajoute le numéro.'),
          year(false), pdf, order
        ]
      },
      {
        name: 'td', label: 'TD', widget: 'object',
        summary: '{{fields.module | upper}} · TD {{fields.number}} · {{fields.title}}',
        fields: [id, semester, module, sheetNumber('Numéro du TD'), title(sheetHint), correction('Le PDF contient le corrigé'), year(false), pdf, order]
      },
      {
        name: 'tp', label: 'TP', widget: 'object',
        summary: '{{fields.module | upper}} · TP {{fields.number}} · {{fields.title}}',
        fields: [id, semester, module, sheetNumber('Numéro du TP'), title(sheetHint), correction('Le PDF contient le corrigé ou le code'), year(false), pdf, order]
      },
      {
        name: 'examen', label: 'Examen', widget: 'object',
        summary: '{{fields.module | upper}} · Examen {{fields.academicYear}} · {{fields.title}}',
        fields: [
          id, semester, module, year(true),
          {name: 'session', label: 'Session', widget: 'select', options: rules.SESSIONS.map(value => ({label: SESSION_LABELS[value], value}))},
          {name: 'examKind', label: "Nature de l'examen", widget: 'select', options: rules.EXAM_KINDS.map(value => ({label: KIND_LABELS[value], value}))},
          title("Un nom court, par exemple « Examen de janvier 2025 »."),
          correction('Le PDF contient le corrigé'), pdf, order
        ]
      }
    ];
  }

  function cmsConfig(catalogue, backendName) {
    return {
      // Everything is set here; there is no config.yml to keep in step with the catalogue.
      load_config_file: false,
      backend: LOCAL ? {name: backendName} : {
        name: backendName,
        repo: REPOSITORY,
        branch: BRANCH,
        // The repository is public, so the login asks GitHub for public repositories only.
        auth_scope: 'public_repo'
      },
      locale: 'fr',
      site_url: new URL('../../', document.baseURI).href,
      // Where Decap stages a chosen file until the save moves it to pdfs/<semester>/<module>/.
      media_folder: 'pdfs',
      public_folder: 'pdfs',
      show_preview_links: false,
      collections: [{
        name: 'catalogue',
        label: 'Catalogue',
        editor: {preview: false},
        files: [{
          name: 'documents',
          label: 'Documents : Cours, TD, TP et Examens',
          file: rules.CATALOGUE_PATH,
          fields: [
            {name: 'loadedFrom', widget: 'hidden'},
            {
              name: 'resources', label: 'Documents', label_singular: 'document', widget: 'list',
              typeKey: 'type', types: formFields(catalogue), add_to_top: true, collapsed: true
            }
          ]
        }]
      }]
    };
  }

  const trimSlash = value => value.replace(/^\/+/, '');

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(',') + 1));
      reader.onerror = () => reject(new Error(`Le fichier « ${file.name} » n'a pas pu être lu.`));
      reader.readAsDataURL(file);
    });
  }

  // A PDF starts with "%PDF-". The doctor makes the same test on every build.
  async function describeUpload(asset) {
    const start = new Uint8Array(await asset.fileObj.slice(0, 5).arrayBuffer());
    return {path: asset.path, name: asset.fileObj.name, size: asset.fileObj.size, isPdf: String.fromCharCode(...start) === '%PDF-'};
  }

  // Notes stay at the bottom left of the window until closed: the local-preview notice, what a save
  // stored, and why a save was refused. Decap's own messages disappear after a few seconds, too
  // soon to correct several fields or to copy a document's ID.
  function showNote(kind, text, lines = []) {
    const note = document.createElement('div');
    note.className = `admin-note admin-note--${kind}`;
    note.setAttribute('role', kind === 'problem' ? 'alert' : 'status');
    const body = note.appendChild(document.createElement('div'));
    body.appendChild(document.createElement('p')).textContent = text;
    if (lines.length) {
      const list = body.appendChild(document.createElement('ul'));
      for (const line of lines) list.appendChild(document.createElement('li')).textContent = line;
    }
    const close = note.appendChild(document.createElement('button'));
    close.type = 'button';
    close.textContent = 'Fermer';
    close.addEventListener('click', () => note.remove());
    document.querySelector('[data-admin-notes]').append(note);
  }

  async function commitChange(store, entry) {
    const file = entry && Array.isArray(entry.dataFiles) && entry.dataFiles.length === 1 ? entry.dataFiles[0] : null;
    if (!file || file.path !== rules.CATALOGUE_PATH || !Array.isArray(entry.assets)) {
      throw new Error('Le formulaire a envoyé autre chose que le catalogue.');
    }
    const next = JSON.parse(file.raw);
    const current = await store.read();
    if (next.loadedFrom !== await rules.fingerprint(current.raw)) {
      throw new Error("Le catalogue a changé depuis l'ouverture de ce formulaire. Rechargez la page, puis refaites votre modification.");
    }
    const plan = rules.prepareSave(current.raw, next, await Promise.all(entry.assets.map(describeUpload)));
    if (plan.errors.length) throw Object.assign(new Error('Corrigez les points listés en bas de la fenêtre, puis publiez de nouveau.'), {problems: plan.errors});
    if (!plan.changed) return;
    const assets = new Map(entry.assets.map(asset => [trimSlash(asset.path), asset]));
    await store.commit({
      head: current.head,
      raw: plan.raw,
      writes: plan.writes.map(({from, to}) => ({path: to, asset: assets.get(from)})),
      deletes: plan.deletes,
      message: rules.commitMessage(plan)
    });
    showNote('saved', LOCAL ? 'Enregistré dans cet onglet seulement.' : 'Enregistré sur GitHub. Le site public est republié dans une minute ou deux.', [
      ...plan.added.map(id => `Ajouté : ${id}`),
      ...plan.updated.map(id => `Modifié : ${id}`),
      ...plan.removed.map(id => `Supprimé : ${id}`),
      ...plan.writes.map(write => `PDF enregistré : ${write.to}`)
    ]);
  }

  // Called by Decap in place of its own save, with the file it would write and the files chosen in the form.
  async function save(store, entry) {
    for (const note of document.querySelectorAll('.admin-note--problem, .admin-note--saved')) note.remove();
    try {
      await commitChange(store, entry);
    } catch (error) {
      showNote('problem', "Rien n'a été enregistré.", error.problems ?? [error.message]);
      // Decap prints the error after "Échec de l'enregistrement" ; without a name, only the message is printed.
      error.name = '';
      throw error;
    }
  }

  // True while Decap would ask "leave this page?". It answers the browser's beforeunload event
  // that way for as long as the form holds unsaved changes; the event sent here leaves nothing.
  function formHasUnsavedChanges() {
    try {
      const probe = document.createEvent('BeforeUnloadEvent');
      probe.initEvent('beforeunload', false, true);
      window.dispatchEvent(probe);
      return typeof probe.returnValue === 'string' && probe.returnValue !== '';
    } catch {
      return false;
    }
  }

  // After a save Decap keeps showing what was typed, but the catalogue now holds more: each new
  // document's ID, its PDF path and its place in the list. Leaving the form and coming straight
  // back makes Decap read the catalogue again, so a second change starts from what was saved.
  const reopening = {
    waiting: false,
    // Called when Decap reads the catalogue: the form now shows what was saved.
    done() { this.waiting = false; },
    start() {
      this.waiting = true;
      const form = location.hash;
      const deadline = Date.now() + 20000;
      const attempt = () => {
        // Nothing to do once the catalogue was read again, or once the maintainer went elsewhere.
        if (!this.waiting || location.hash !== form) { this.waiting = false; return; }
        if (Date.now() > deadline) {
          this.waiting = false;
          showNote('notice', 'Rechargez la page avant de faire une autre modification.');
          return;
        }
        // Decap marks the form as saved a moment after the save (it first lists the files again
        // when a PDF was added). Leaving before that would make it ask for confirmation.
        if (formHasUnsavedChanges()) { setTimeout(attempt, 100); return; }
        location.replace('#/collections/catalogue');
        setTimeout(() => {
          location.replace(form);
          setTimeout(attempt, 1500);
        }, 100);
      };
      setTimeout(attempt, 0);
    }
  };

  function gitHubStore(inner, config) {
    const github = window.L2GitHubStore.create({
      fetch: window.fetch.bind(window),
      apiRoot: config.backend.api_root || 'https://api.github.com',
      repo: config.backend.repo,
      branch: config.backend.branch,
      getToken: () => inner.getToken()
    });
    return {
      read: github.read,
      commit: async ({head, raw, writes, deletes, message}) => github.commit({
        head, raw, deletes, message,
        files: await Promise.all(writes.map(async ({path, asset}) => ({path, base64: await toBase64(asset.fileObj)})))
      })
    };
  }

  // The local preview keeps its copy of the repository in Decap's test backend.
  function localStore(decap) {
    return {
      read: async () => ({head: null, raw: (await decap.getEntry(rules.CATALOGUE_PATH)).data}),
      async commit({raw, writes, deletes, message}) {
        for (const {path, asset} of writes) asset.path = path;
        await decap.persistEntry({dataFiles: [{path: rules.CATALOGUE_PATH, slug: 'documents', raw}], assets: writes.map(write => write.asset)}, {commitMessage: message});
        if (deletes.length) await decap.deleteFiles(deletes, message);
      }
    };
  }

  // Decap's own backend, with reading and saving the catalogue replaced.
  function registerBackend() {
    const innerName = LOCAL ? 'test-repo' : 'github';
    const name = `l2-${innerName}`;
    window.CMS.registerBackend(name, function (config, options) {
      const inner = window.CMS.getBackend(innerName).init(config, options);
      const decap = {
        getEntry: inner.getEntry.bind(inner),
        entriesByFiles: inner.entriesByFiles.bind(inner),
        persistEntry: inner.persistEntry.bind(inner),
        deleteFiles: inner.deleteFiles.bind(inner)
      };
      const store = LOCAL ? localStore(decap) : gitHubStore(inner, config);
      // The form gets the catalogue as the branch holds it now, read the same way the save reads it
      // again. The two fingerprints then differ only when the file really changed in between.
      const forForm = async entry => (entry.file.path === rules.CATALOGUE_PATH ? {...entry, data: await rules.forForm((await store.read()).raw)} : entry);
      // A PDF belongs to a document. Outside a document's form there is no record to name it after.
      const refuse = async () => {
        throw Object.assign(new Error("Ajoutez, remplacez et supprimez les PDF depuis le formulaire d'un document, pas depuis la médiathèque."), {name: ''});
      };
      inner.getEntry = async path => {
        const entry = await forForm(await decap.getEntry(path));
        if (path === rules.CATALOGUE_PATH) reopening.done();
        return entry;
      };
      inner.entriesByFiles = async files => Promise.all((await decap.entriesByFiles(files)).map(forForm));
      inner.persistEntry = entry => save(store, entry);
      inner.persistMedia = refuse;
      inner.deleteFiles = refuse;
      return inner;
    });
    return name;
  }

  async function start() {
    // The published catalogue gives the Semestre and Module lists. It is also the local preview's starting copy.
    const response = await fetch('../../data/resources.json', {cache: 'no-cache'});
    if (!response.ok) throw new Error(`Catalogue request failed with status ${response.status}`);
    const raw = await response.text();
    showNote('notice', "Ancien formulaire (Decap), gardé provisoirement en secours. Le tableau de bord habituel est à l'adresse /admin/.");
    if (LOCAL) {
      window.repoFiles = {data: {'resources.json': {content: raw}}};
      showNote('notice', "Aperçu local : les modifications restent dans cet onglet et disparaissent au rechargement. Rien n'est envoyé à GitHub.");
    }
    const config = cmsConfig(JSON.parse(raw), registerBackend());
    // Decap calls this once a save has gone through.
    window.CMS.registerEventListener({name: 'postSave', handler: () => reopening.start()});
    window.CMS.init({config});
  }

  start().catch(error => {
    console.error(error);
    showNote('problem', "L'administration n'a pas pu démarrer : le catalogue du site est introuvable ou illisible. Vérifiez votre connexion, puis rechargez la page.");
  });
})();
