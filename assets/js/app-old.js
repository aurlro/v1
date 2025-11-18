'use strict';

const STORAGE_KEYS = {
    theme: 'boite-outils-theme',
    lastPage: 'boite-outils-last-page',
    aiProvider: 'boite-outils-ai-provider', // 'gemini', 'ollama', or 'heuristic'
};

const GEMINI_STORAGE_KEYS = {
    encryptedKey: 'gemini.key.v1',
    secret: 'gemini.secret.v1',
    cooldown: 'gemini.cooldown.v1',
};

const OLLAMA_STORAGE_KEYS = {
    endpoint: 'ollama.endpoint.v1',
    model: 'ollama.model.v1',
};

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const OLLAMA_DEFAULTS = {
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
};

const COOLDOWN_DEFAULTS = {
    defaultMs: 60000, // 1 minute
    timestampThreshold: 1000000000000, // Unix timestamp in milliseconds threshold
};

const GEMINI_SYSTEM_PROMPT = `Tu es un Coach & Analyste en communication de crise interpersonnelle.
Ton utilisateur est un Product Owner / Business Analyst en crise personnelle.
Ton rôle :
1. Valider l'émotion exprimée.
2. Diagnostiquer l'ego dominant (Défensive, Sauveur, Martyr, Dernier Mot, Refus d'influence).
3. Identifier le besoin sous-jacent (user story).
4. Proposer plusieurs scripts, chacun avec un objectif stratégique clair (désescalade, poser une limite, alignement produit).
Format de réponse STRICT : JSON avec les clés suivantes :
{
  "meta": "phrase courte résumant le niveau de tension",
  "takeaways": ["liste d'insights actionnables"],
  "options": [
    { "objective": "Objectif stratégique", "script": "Script complet, ton validant" }
  ]
}`;

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toast = createToastManager();
    const modal = createModalManager();
    const encryptor = createLocalEncryptor();
    const gemini = createGeminiService({ encryptor, toast });
    const ollama = createOllamaService({ toast });
    const journalStore = createJournalStore('communicationJournal', toast);

    // --- Initialisation thèmes & navigation ---
    initTheme();
    const navigation = initNavigation();

    // --- Modules ---
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-copy-text]');
        if (!trigger) return;
        const text = trigger.getAttribute('data-copy-text');
        if (!text) return;

        event.preventDefault();

        const successMessage =
            trigger.getAttribute('data-toast-success') ||
            'Copié dans le presse-papiers.';
        const errorMessage =
            trigger.getAttribute('data-toast-error') ||
            'Impossible de copier ce contenu.';

        copyTextToClipboard(text)
            .then(() => toast.success(successMessage))
            .catch(() => toast.error(errorMessage));
    });

    const homeModule = createHomeModule({
        rootId: 'home-root',
        store: journalStore,
        toast,
        navigate: navigation.navigateTo,
    });

    const journalModule = createJournalModule({
        rootId: 'journal-root',
        store: journalStore,
        toast,
        modal,
        onChange: () => {
            homeModule.render();
        },
    });

    const manualModule = createManualAnalyzer({
        rootId: 'manual-root',
        store: journalStore,
        toast,
        onSaved: () => {
            homeModule.render();
            journalModule.render();
        },
    });

    const aiModule = createAIModule({
        rootId: 'ai-root',
        toast,
        gemini,
        ollama,
        modal,
    });

    const guideModule = createGuideModule({
        rootId: 'guide-root',
        toast,
    });

    homeModule.render();
    manualModule.render();
    journalModule.render();
    aiModule.render();
    guideModule.render();

    const fallbackPage = 'home';
    let initialPage = fallbackPage;
    try {
        const storedPage = localStorage.getItem(STORAGE_KEYS.lastPage);
        if (storedPage && document.getElementById(`page-${storedPage}`)) {
            initialPage = storedPage;
        }
    } catch (error) {
        console.debug('Lecture de la page précédente impossible :', error);
    }

    navigation.navigateTo(initialPage, { persist: false });

    window.app = {
        navigateTo: navigation.navigateTo,
        toast,
        copyText: (text, options = {}) =>
            copyTextToClipboard(text)
                .then(() => {
                    if (options.successMessage) toast.success(options.successMessage);
                    return true;
                })
                .catch((error) => {
                    if (options.errorMessage) toast.error(options.errorMessage);
                    throw error;
                }),
        store: journalStore,
        gemini,
    };

    console.log('Boîte à Outils chargée avec succès.');

    // --- Fonctions utilitaires d'initialisation ---

    function initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIconDark = document.getElementById('theme-toggle-dark-icon');
        const themeIconLight = document.getElementById('theme-toggle-light-icon');

        function applyTheme(theme) {
            const normalized = theme === 'dark' ? 'dark' : 'light';
            body.classList.toggle('dark', normalized === 'dark');
            if (themeIconDark && themeIconLight) {
                const showLightIcon = normalized === 'dark';
                themeIconLight.classList.toggle('hidden', !showLightIcon);
                themeIconDark.classList.toggle('hidden', showLightIcon);
            }
            try {
                localStorage.setItem(STORAGE_KEYS.theme, normalized);
            } catch (error) {
                console.debug('Impossible de stocker le thème :', error);
            }
        }

        let storedTheme = null;
        try {
            storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        } catch (error) {
            console.debug('Lecture du thème impossible :', error);
        }
        if (!storedTheme) {
            storedTheme =
                window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
        }
        applyTheme(storedTheme);

        themeToggle?.addEventListener('click', () => {
            const nextTheme = body.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    function initNavigation() {
        const pageSections = Array.from(document.querySelectorAll('.page-content'));
        const tabButtons = new Map(
            Array.from(document.querySelectorAll('.nav-tab')).map((button) => {
                const id = button.id.replace('tab-', '');
                return [id, button];
            }),
        );

        // Handle tab button clicks
        tabButtons.forEach((button, tabId) => {
            button.addEventListener('click', () => {
                navigateTo(tabId);
            });
        });

        document.addEventListener('click', (event) => {
            const navigateTrigger = event.target.closest('[data-navigate]');
            if (navigateTrigger) {
                const target = navigateTrigger.getAttribute('data-navigate');
                if (target) {
                    event.preventDefault();
                    navigateTo(target);
                }
            }
        });

        function navigateTo(pageId, options = {}) {
            const sectionId = `page-${pageId}`;
            const sectionToShow = document.getElementById(sectionId);
            if (!sectionToShow) {
                console.warn(`Section ${sectionId} introuvable.`);
                return;
            }

            pageSections.forEach((section) => {
                section.classList.toggle('hidden', section.id !== sectionId);
            });

            tabButtons.forEach((button, tabId) => {
                const isActive = tabId === pageId;
                button.classList.toggle('tab-active', isActive);
                button.classList.toggle('tab-inactive', !isActive);
            });

            if (options.persist !== false) {
                try {
                    localStorage.setItem(STORAGE_KEYS.lastPage, pageId);
                } catch (error) {
                    console.debug('Impossible de stocker la page courante :', error);
                }
            }
        }

        return { navigateTo };
    }
});

// --- Modules & Stores ---

function createManualAnalyzer({ rootId, store, toast, onSaved }) {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Racine manuelle "${rootId}" introuvable.`);
        return { render: () => {} };
    }

    const egoOptions = [
        "La Défensive",
        "Le Sauveur",
        "Le Martyr",
        "Le Dernier Mot",
        "Le Refus d'influence",
    ];

    const steps = [
        {
            id: 'context',
            title: '1. Constat',
            description: 'Capture le contexte brut avant de le re-écrire ou le juger.',
            fields: [
                {
                    name: 'context',
                    label: 'Qu’est-ce qui s’est passé ?',
                    type: 'textarea',
                    placeholder:
                        "Décris la scène telle qu'elle s'est déroulée, sans interprétation.",
                    required: true,
                },
                {
                    name: 'partnerSignal',
                    label: 'Quel a été le signal / trigger de ton partenaire ?',
                    type: 'textarea',
                    placeholder:
                        'Phrase, regard, ton de voix, silence... Note ce qui t’a percuté.',
                    required: true,
                },
            ],
        },
        {
            id: 'ego',
            title: '2. Ego Radar',
            description:
                "Identifie l'ego dominant pour pouvoir le désamorcer lors de la prochaine itération.",
            fields: [
                {
                    name: 'egoFocus',
                    label: "Quel type d'ego s'est activé ?",
                    type: 'select',
                    options: egoOptions,
                    required: true,
                },
                {
                    name: 'triggerNeed',
                    label: 'Quel besoin personnel n’a pas été nourri ?',
                    type: 'textarea',
                    placeholder:
                        'Reconnaissance, soutien, sécurité, clarté... note-le en mode backlog.',
                    required: true,
                },
            ],
        },
        {
            id: 'response',
            title: '3. MVP de réponse',
            description:
                'Dessine la réponse que tu aurais aimé livrer, validation comprise.',
            fields: [
                {
                    name: 'alternativeResponse',
                    label: 'Quelle réponse MVP veux-tu tester ?',
                    type: 'textarea',
                    placeholder:
                        'Rédige la réponse idéale (ton, structure, validation, plan).',
                    required: true,
                },
                {
                    name: 'validation',
                    label: 'Comment valider sa frustration en une phrase ?',
                    type: 'textarea',
                    placeholder:
                        "Ex: “Je comprends que tu... et c'est logique que ça te...”",
                    required: true,
                },
            ],
        },
        {
            id: 'action',
            title: '4. Action & Insight',
            description: 'Programme la suite et capture l’enseignement clé.',
            fields: [
                {
                    name: 'actionPlan',
                    label: 'Quel est ton plan d’action concret ?',
                    type: 'textarea',
                    placeholder:
                        'Roadmap courte : message à envoyer, rituel à planifier, limite à poser...',
                    required: true,
                },
                {
                    name: 'insight',
                    label: 'Insight clé à retenir pour la prochaine fois ?',
                    type: 'textarea',
                    placeholder:
                        'Le bug racine, l’alerte à surveiller, la ressource qui t’a aidé...',
                    required: false,
                },
            ],
        },
    ];

    const state = {
        stepIndex: 0,
        values: {
            context: '',
            partnerSignal: '',
            egoFocus: '',
            triggerNeed: '',
            alternativeResponse: '',
            validation: '',
            actionPlan: '',
            insight: '',
        },
    };

    function render() {
        const currentStep = steps[state.stepIndex];
        if (!currentStep) return;

        root.innerHTML = `
            <div class="space-y-8">
                <header class="space-y-2">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Analyse Manuelle</h2>
                    <p class="text-slate-600 dark:text-slate-400">
                        Transforme ta dernière crise en métrique actionnable. 4 étapes, zero juge, 100% introspection produit.
                    </p>
                </header>

                <div class="stepper">
                    ${steps
                        .map((step, index) => {
                            const isActive = index === state.stepIndex;
                            return `
                                <div class="stepper-item ${isActive ? 'active' : ''}">
                                    <span class="stepper-index">${index + 1}</span>
                                    <div class="font-semibold">${step.title}</div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">${step.description}</p>
                                </div>
                            `;
                        })
                        .join('')}
                </div>

                <form id="manual-form" class="space-y-6">
                    ${currentStep.fields
                        .map((field) => renderField(field, state.values[field.name] || ''))
                        .join('')}
                </form>

                <div class="wizard-actions">
                    <button type="button" class="secondary-button" data-action="prev" ${state.stepIndex === 0 ? 'disabled' : ''}>
                        ← Retour
                    </button>
                    <div class="flex gap-3">
                        ${
                            state.stepIndex < steps.length - 1
                                ? `<button type="button" class="primary-button" data-action="next">
                                        Étape suivante →
                                   </button>`
                                : `<button type="button" class="primary-button" data-action="save">
                                        Sauvegarder l'analyse
                                   </button>`
                        }
                    </div>
                </div>
            </div>
        `;

        root.querySelectorAll('textarea').forEach((textarea) => {
            autoResizeTextarea(textarea);
            textarea.addEventListener('input', () => autoResizeTextarea(textarea));
        });

        const form = root.querySelector('#manual-form');
        form?.addEventListener('input', (event) => {
            const target = event.target;
            if (!target.name) return;
            state.values[target.name] = target.value;
        });

        root.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
            if (state.stepIndex > 0) {
                state.stepIndex -= 1;
                render();
            }
        });

        root.querySelector('[data-action="next"]')?.addEventListener('click', () => {
            if (!validateCurrentStep()) return;
            if (state.stepIndex < steps.length - 1) {
                state.stepIndex += 1;
                render();
            }
        });

        root.querySelector('[data-action="save"]')?.addEventListener('click', () => {
            if (!validateAllSteps()) return;
            saveEntry();
        });
    }

    function renderField(field, value) {
        if (field.type === 'select') {
            return `
                <div class="form-group">
                    <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                    <select id="${field.name}" name="${field.name}">
                        <option value="">Sélectionne une option</option>
                        ${field.options
                            .map(
                                (option) =>
                                    `<option value="${option}" ${
                                        option === value ? 'selected' : ''
                                    }>${option}</option>`,
                            )
                            .join('')}
                    </select>
                    ${
                        field.helper
                            ? `<p class="helper-text">${field.helper}</p>`
                            : ''
                    }
                </div>
            `;
        }

        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                <textarea id="${field.name}" name="${field.name}" placeholder="${field.placeholder || ''}">${value || ''}</textarea>
                ${
                    field.helper
                        ? `<p class="helper-text">${field.helper}</p>`
                        : ''
                }
            </div>
        `;
    }

    function validateCurrentStep() {
        const currentStep = steps[state.stepIndex];
        const missing = currentStep.fields.filter(
            (field) => field.required && !state.values[field.name]?.trim(),
        );
        if (missing.length > 0) {
            toast.error(
                missing.length > 1
                    ? 'Complète les champs demandés avant de continuer.'
                    : 'Complète ce champ avant de continuer.',
            );
            return false;
        }
        return true;
    }

    function validateAllSteps() {
        const missing = steps.flatMap((step) =>
            step.fields.filter(
                (field) => field.required && !state.values[field.name]?.trim(),
            ),
        );
        if (missing.length > 0) {
            toast.error('Remplis les champs critiques avant de sauvegarder.');
            return false;
        }
        return true;
    }

    function saveEntry() {
        const now = new Date();
        const entry = {
            id: crypto.randomUUID ? crypto.randomUUID() : `entry-${now.getTime()}`,
            createdAt: now.toISOString(),
            ...state.values,
            summary: buildSummary(state.values),
        };

        const result = store.saveEntry(entry);
        if (result.success) {
            toast.success('Analyse sauvegardée dans ton journal.');
            resetState();
            render();
            onSaved?.(entry);
        } else {
            toast.error(result.message || 'Sauvegarde impossible.');
        }
    }

    function resetState() {
        state.stepIndex = 0;
        Object.keys(state.values).forEach((key) => {
            state.values[key] = '';
        });
    }

    function buildSummary(values) {
        return [
            `Contexte : ${values.context}`,
            `Signal perçu : ${values.partnerSignal}`,
            `Ego activé : ${values.egoFocus}`,
            `Besoin associé : ${values.triggerNeed}`,
            `Réponse MVP : ${values.alternativeResponse}`,
            `Validation : ${values.validation}`,
            `Plan d'action : ${values.actionPlan}`,
            values.insight ? `Insight : ${values.insight}` : null,
        ]
            .filter(Boolean)
            .join('\n\n');
    }

    return { render };
}

function createJournalModule({ rootId, store, toast, modal, onChange }) {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Racine journal "${rootId}" introuvable.`);
        return { render: () => {} };
    }

    const egoFilters = [
        { id: 'all', label: 'Tous les types' },
        { id: "La Défensive", label: 'Défensive' },
        { id: 'Le Sauveur', label: 'Sauveur' },
        { id: 'Le Martyr', label: 'Martyr' },
        { id: 'Le Dernier Mot', label: 'Dernier Mot' },
        { id: "Le Refus d'influence", label: "Refus d'influence" },
    ];

    const state = {
        filter: 'all',
    };

    let eventsBound = false;

    function render() {
        const entries = store.getAll();
        const filteredEntries =
            state.filter === 'all'
                ? entries
                : entries.filter((entry) => entry.egoFocus === state.filter);

        root.innerHTML = `
            <div class="space-y-6">
                <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Mon Journal</h2>
                        <p class="text-slate-600 dark:text-slate-400 text-sm">
                            Toutes tes analyses sauvegardées. Filtre, relis et recycle tes scripts gagnants.
                        </p>
                    </div>
                    <div class="journal-actions">
                        <button type="button" class="journal-card-button" data-action="export">
                            📤 Exporter (JSON)
                        </button>
                        <label class="journal-card-button cursor-pointer">
                            📥 Importer (JSON)
                            <input type="file" accept="application/json" data-import-input class="hidden">
                        </label>
                        <button type="button" class="journal-card-button" data-action="clear" ${entries.length === 0 ? 'disabled' : ''}>
                            🗑️ Vider le journal
                        </button>
                    </div>
                </header>

                <div class="flex gap-2 flex-wrap">
                    ${egoFilters
                        .map((filter) => {
                            const isActive = state.filter === filter.id;
                            return `
                                <button
                                    type="button"
                                    class="journal-card-button ${isActive ? 'bg-cyan-600 text-white border-transparent' : ''}"
                                    data-action="filter"
                                    data-filter="${filter.id}"
                                >
                                    ${filter.label}
                                </button>
                            `;
                        })
                        .join('')}
                </div>

                <div id="journal-list" class="space-y-4">
                    ${
                        filteredEntries.length === 0
                            ? renderEmptyState(entries.length)
                            : filteredEntries.map(renderEntryCard).join('')
                    }
                </div>
            </div>
        `;

        if (!eventsBound) {
            root.addEventListener('click', handleAction);
            root
                .querySelector('[data-import-input]')
                ?.addEventListener('change', handleImport);
            eventsBound = true;
        }
    }

    function handleAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const action = button.getAttribute('data-action');
        const entryId = button.getAttribute('data-entry-id');

        switch (action) {
            case 'filter':
                state.filter = button.getAttribute('data-filter') || 'all';
                render();
                break;
            case 'view':
                viewEntry(entryId);
                break;
            case 'copy':
                copyEntry(entryId);
                break;
            case 'delete':
                deleteEntry(entryId);
                break;
            case 'export':
                exportJournal();
                break;
            case 'clear':
                clearJournal();
                break;
            case 'start-analysis':
                document.querySelector('[data-navigate="analyzer-manual"]')?.click();
                break;
            default:
                break;
        }
    }

    function handleImport(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!Array.isArray(parsed)) {
                    throw new Error('Format JSON inattendu.');
                }
                const imported = store.importEntries(parsed);
                toast.success(`Import réussi : ${imported.count} entrées fusionnées.`);
                event.target.value = '';
                render();
                onChange?.();
            } catch (error) {
                toast.error(error.message || 'Import impossible.');
            }
        };
        reader.readAsText(file);
    }

    function viewEntry(entryId) {
        const entry = store.getById(entryId);
        if (!entry) {
            toast.error('Entrée introuvable.');
            return;
        }

        const formattedDate = formatFullDate(entry.createdAt);
        const content = `
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>Analyse du ${formattedDate}</span>
                    <span class="badge" data-ego="${entry.egoFocus}">${entry.egoFocus}</span>
                </div>
                <article class="space-y-3 text-sm leading-relaxed">
                    ${entry.summary
                        .split('\n\n')
                        .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
                        .join('')}
                </article>
            </div>
        `;

        modal.show({
            targetId: 'journal-modal',
            title: 'Analyse détaillée',
            html: content,
            actions: [
                {
                    label: 'Copier le résumé',
                    variant: 'primary',
                    onClick: () => {
                        copyTextToClipboard(entry.summary)
                            .then(() => toast.success('Analyse copiée.'))
                            .catch(() => toast.error('Impossible de copier ce texte.'));
                    },
                },
                {
                    label: 'Fermer',
                    onClick: () => modal.hide('journal-modal'),
                },
            ],
        });
    }

    function copyEntry(entryId) {
        const entry = store.getById(entryId);
        if (!entry) {
            toast.error('Entrée introuvable.');
            return;
        }
        copyTextToClipboard(entry.summary)
            .then(() => toast.success('Analyse copiée dans le presse-papiers.'))
            .catch(() => toast.error('Impossible de copier cette analyse.'));
    }

    function deleteEntry(entryId) {
        if (!entryId) return;
        if (!window.confirm('Supprimer définitivement cette analyse ?')) {
            return;
        }
        const result = store.deleteEntry(entryId);
        if (result.success) {
            toast.info('Analyse supprimée.');
            render();
            onChange?.();
        } else {
            toast.error(result.message || 'Suppression impossible.');
        }
    }

    function exportJournal() {
        const entries = store.getAll();
        if (entries.length === 0) {
            toast.info('Journal vide : rien à exporter.');
            return;
        }
        const blob = new Blob([JSON.stringify(entries, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `journal-communication-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Export JSON généré.');
    }

    function clearJournal() {
        const entries = store.getAll();
        if (entries.length === 0) {
            toast.info('Le journal est déjà vide.');
            return;
        }
        if (!window.confirm('Tu es sûr de vouloir tout effacer ?')) {
            return;
        }
        store.clear();
        toast.warning('Journal remis à zéro.');
        render();
        onChange?.();
    }

    function renderEmptyState(totalEntries) {
        if (totalEntries === 0) {
            return `
                <div class="journal-empty">
                    <h3 class="text-lg font-semibold mb-2">Aucune analyse enregistrée (encore).</h3>
                    <p>Capture ta prochaine dispute pour transformer l’ego en insight exploitable.</p>
                    <button type="button" data-action="start-analysis">Commencer une analyse</button>
                </div>
            `;
        }

        return `
            <div class="journal-empty">
                <h3 class="text-lg font-semibold mb-2">Aucun résultat pour ce filtre.</h3>
                <p>Essaie un autre type d'ego pour revoir toutes tes entrées.</p>
            </div>
        `;
    }

    function renderEntryCard(entry) {
        const formattedDate = formatDateShort(entry.createdAt);
        const preview = entry.summary.split('\n')[0];
        return `
            <article class="journal-card">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                        <h3 class="font-semibold text-slate-800 dark:text-slate-100">Analyse du ${formattedDate}</h3>
                        <p class="text-xs uppercase tracking-wide text-slate-400">Snapshot ego & réponse MVP</p>
                    </div>
                    <span class="badge" data-ego="${entry.egoFocus}">${entry.egoFocus}</span>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">${escapeHTML(preview)}</p>
                <div class="journal-card-buttons">
                    <button type="button" class="journal-card-button" data-action="view" data-entry-id="${
                        entry.id
                    }">🗂️ Voir</button>
                    <button type="button" class="journal-card-button" data-action="copy" data-entry-id="${
                        entry.id
                    }">📋 Copier</button>
                    <button type="button" class="journal-card-button" data-action="delete" data-entry-id="${
                        entry.id
                    }">🗑️ Supprimer</button>
                </div>
            </article>
        `;
    }

    return { render };
}

function createHomeModule({ rootId, store, toast, navigate }) {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Racine home "${rootId}" introuvable.`);
        return { render: () => {} };
    }

    function render() {
        const entries = store.getAll();
        const stats = calculateJournalStats(entries);

        root.innerHTML = `
            <div class="space-y-8">
                <section class="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Pilotage émotionnel</h2>
                            <p class="text-slate-600 dark:text-slate-400 text-sm">
                                Tu as ${stats.totalEntries} analyses sauvegardées. ${
                                    stats.lastEntry
                                        ? `Dernière entrée : ${formatRelativeTime(
                                              stats.lastEntry.createdAt,
                                          )}.`
                                        : 'Commence par une analyse manuelle pour alimenter le dashboard.'
                                }
                            </p>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button type="button" class="primary-button text-sm" data-navigate="analyzer-manual">
                                📝 Nouvelle analyse
                            </button>
                            <button type="button" class="secondary-button text-sm" data-navigate="analyzer-ai">
                                🤖 Analyse IA
                            </button>
                        </div>
                    </div>
                </section>

                <section class="dashboard-grid">
                    <div class="dashboard-card space-y-2">
                        <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">Entrées totales</h3>
                        <div class="dashboard-metric">${stats.totalEntries}</div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Ton backlog émotionnel.</p>
                    </div>
                    <div class="dashboard-card space-y-2">
                        <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">Ego dominant</h3>
                        <div class="dashboard-metric">${stats.topEgo || '—'}</div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                            ${
                                stats.topEgo
                                    ? `${stats.topEgoPercentage}% de tes analyses`
                                    : 'Analyse encore quelques cas pour obtenir un signal.'
                            }
                        </p>
                    </div>
                    <div class="dashboard-card space-y-2">
                        <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wide">Streak sans "Défensive"</h3>
                        <div class="dashboard-metric">${stats.daysSinceDefensive ?? '—'}</div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Jours depuis ton dernier réflexe défensif.</p>
                    </div>
                </section>

                <section class="dashboard-card space-y-4">
                    <header>
                        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Dernières synthèses</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">3 derniers apprentissages extraits de ton journal.</p>
                    </header>
                    <div class="dashboard-list">
                        ${
                            stats.latestEntries.length === 0
                                ? '<p class="text-sm text-slate-500 dark:text-slate-400">Aucun insight enregistré pour l’instant.</p>'
                                : stats.latestEntries
                                      .map(
                                          (entry) => `
                                    <div class="dashboard-list-item">
                                        <strong>${formatRelativeTime(entry.createdAt)} · ${
                                              entry.egoFocus
                                          }</strong>
                                        <p class="text-sm text-slate-600 dark:text-slate-300">${escapeHTML(extractInsight(entry))}</p>
                                        <button class="journal-card-button mt-2 text-xs" data-toast="Entrée ouverte dans le journal." data-navigate="journal">Afficher dans le journal</button>
                                    </div>
                                `,
                                      )
                                      .join('')
                        }
                    </div>
                </section>

                <section class="dashboard-card space-y-3">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Raccourcis d’intervention</h3>
                    <div class="grid gap-2 sm:grid-cols-2">
                        ${[
                            {
                                label: 'Plan d’urgence (Pause)',
                                body: 'Respiration, cadrage, script radicaux de validation.',
                                target: 'home',
                                toast: 'Astuce : fabrique ton kit de crise dans le Dojo.',
                            },
                            {
                                label: 'Relire ton dernier MVP',
                                body: 'Rejoue la réponse idéale pour préparer le prochain sprint.',
                                target: 'journal',
                                toast: null,
                            },
                            {
                                label: 'Booster ton Intégration',
                                body: 'Utilise l’IA pour analyser un message chaud.',
                                target: 'analyzer-ai',
                                toast: null,
                            },
                            {
                                label: 'Revoir les concepts clés',
                                body: 'Glossaire Ego, Double Contrainte, Validation.',
                                target: 'guide',
                                toast: null,
                            },
                        ]
                            .map(
                                (card) => `
                                    <button type="button" class="journal-card-button justify-between text-left" data-navigate="${card.target}" ${
                                        card.toast ? `data-toast="${card.toast}"` : ''
                                    }>
                                        <span>
                                            <strong class="block">${card.label}</strong>
                                            <span class="text-xs text-slate-500 dark:text-slate-400">${card.body}</span>
                                        </span>
                                        →
                                    </button>
                                `,
                            )
                            .join('')}
                    </div>
                </section>
            </div>
        `;

        root.querySelectorAll('[data-toast]').forEach((button) => {
            button.addEventListener('click', () => {
                const message = button.getAttribute('data-toast');
                if (message) toast.info(message);
            });
        });
    }

    function extractInsight(entry) {
        if (entry.insight) return entry.insight;
        const lastParagraph = entry.summary.split('\n\n').pop();
        return lastParagraph || 'Analyse enregistrée.';
    }

    return { render };
}

function createGeminiService({ encryptor, toast }) {
    let cachedPayload;
    const listeners = new Set();

    function readPayload() {
        if (typeof cachedPayload !== 'undefined') return cachedPayload;
        try {
            const raw = localStorage.getItem(GEMINI_STORAGE_KEYS.encryptedKey);
            cachedPayload = raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.debug('Clé Gemini illisible, purge en cours.', error);
            localStorage.removeItem(GEMINI_STORAGE_KEYS.encryptedKey);
            cachedPayload = null;
        }
        return cachedPayload;
    }

    function writePayload(payload) {
        try {
            localStorage.setItem(
                GEMINI_STORAGE_KEYS.encryptedKey,
                JSON.stringify(payload),
            );
            cachedPayload = payload;
        } catch (error) {
            console.debug('Impossible de stocker la clé Gemini.', error);
            cachedPayload = payload;
        }
        emit();
    }

    function clearPayload() {
        cachedPayload = null;
        try {
            localStorage.removeItem(GEMINI_STORAGE_KEYS.encryptedKey);
        } catch (error) {
            console.debug('Suppression clé Gemini impossible.', error);
        }
        emit();
    }

    function emit(change) {
        listeners.forEach((listener) => {
            try {
                listener(change);
            } catch (error) {
                console.debug('Listener Gemini', error);
            }
        });
    }

    function getCooldownTimestamp() {
        try {
            const raw = localStorage.getItem(GEMINI_STORAGE_KEYS.cooldown);
            if (!raw) return null;
            const value = Number.parseInt(raw, 10);
            if (Number.isNaN(value) || value <= Date.now()) {
                localStorage.removeItem(GEMINI_STORAGE_KEYS.cooldown);
                return null;
            }
            return value;
        } catch (error) {
            console.debug('Lecture cooldown Gemini impossible :', error);
            return null;
        }
    }

    function setCooldownTimestamp(timestamp) {
        if (!timestamp) {
            localStorage.removeItem(GEMINI_STORAGE_KEYS.cooldown);
            emit({ type: 'cooldown-cleared' });
            return;
        }
        try {
            localStorage.setItem(
                GEMINI_STORAGE_KEYS.cooldown,
                String(Math.max(timestamp, Date.now())),
            );
        } catch (error) {
            console.debug('Impossible de stocker le cooldown Gemini', error);
        }
        emit({ type: 'cooldown-set', until: timestamp });
    }

    function sanitizeApiKey(value) {
        return (value || '').replace(/\s/g, '');
    }

    function ensureConfiguredPayload() {
        const payload = readPayload();
        if (!payload) return null;
        if (!payload.cipher) {
            clearPayload();
            return null;
        }
        return payload;
    }

    function createError(code, message, extra = {}) {
        const error = new Error(message);
        error.code = code;
        Object.assign(error, extra);
        return error;
    }

    async function decryptKey() {
        const payload = ensureConfiguredPayload();
        if (!payload) throw createError('NO_KEY', 'Aucune clé Gemini enregistrée.');
        try {
            return await encryptor.decrypt(payload);
        } catch (error) {
            console.error('Échec du déchiffrement de la clé Gemini.', error);
            throw createError('INVALID_KEY', 'Clé Gemini invalide ou corrompue.');
        }
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }

    return {
        isConfigured() {
            return Boolean(ensureConfiguredPayload());
        },

        getKeyStatus() {
            const payload = ensureConfiguredPayload();
            const cooldown = getCooldownTimestamp();
            return {
                configured: Boolean(payload),
                hint: payload?.hint || null,
                cooldown,
                isFallback: encryptor.isFallback || false,
            };
        },

        async saveKey(rawKey) {
            const sanitized = sanitizeApiKey(rawKey);
            if (!sanitized) throw new Error('Clé Gemini vide.');
            if (sanitized.length < 20) {
                throw new Error('La clé Gemini semble invalide.');
            }
            const payload = await encryptor.encrypt(sanitized);
            payload.version = 1;
            payload.hint = sanitized.slice(-4);
            writePayload(payload);
            setCooldownTimestamp(null);
            return payload;
        },

        async deleteKey() {
            clearPayload();
            setCooldownTimestamp(null);
        },

        async fetchAnalysis(prompt) {
            const text = (prompt || '').trim();
            if (!text) throw createError('EMPTY_PROMPT', 'Message vide.');

            const cooldownUntil = getCooldownTimestamp();
            if (cooldownUntil) {
                throw createError('COOLDOWN', 'Quota Gemini en pause.', {
                    cooldownUntil,
                });
            }

            const apiKey = await decryptKey();
            const requestBody = buildGeminiRequest(text);
            let response;
            try {
                response = await fetch(GEMINI_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(requestBody),
                });
            } catch (error) {
                throw createError('NETWORK', "L'appel Gemini a échoué.", { cause: error });
            }

            const quota = readQuotaHeaders(response.headers);
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw createError(
                        'INVALID_KEY',
                        'Clé Gemini refusée. Vérifie la clé dans la configuration.',
                        { status: response.status },
                    );
                }
                if (response.status === 429) {
                    const retryAfterHeader =
                        response.headers.get('Retry-After') ||
                        response.headers.get('retry-after');
                    const retryAfterSeconds = retryAfterHeader
                        ? Number.parseInt(retryAfterHeader, 10)
                        : null;
                    const cooldown =
                        retryAfterSeconds && !Number.isNaN(retryAfterSeconds)
                            ? Date.now() + retryAfterSeconds * 1000
                            : Date.now() + COOLDOWN_DEFAULTS.defaultMs;
                    setCooldownTimestamp(cooldown);
                    throw createError(
                        'QUOTA',
                        'Quota Gemini atteint. Patiente avant de relancer.',
                        { cooldownUntil: cooldown, retryAfter: retryAfterSeconds },
                    );
                }

                let errorBody = null;
                try {
                    errorBody = await response.json();
                } catch (error) {
                    // ignore json parse
                }
                throw createError('API_ERROR', 'Réponse Gemini invalide.', {
                    status: response.status,
                    body: errorBody,
                });
            }

            try {
                const data = await response.json();
                const parsed = parseGeminiResponse(data);
                parsed.source = 'gemini';
                parsed.quota = quota;
                if (quota?.resetMs && quota.resetMs <= Date.now()) {
                    setCooldownTimestamp(null);
                }
                emit({ type: 'analysis-success', quota });
                return parsed;
            } catch (error) {
                throw createError('PARSE_ERROR', 'Impossible de lire la réponse Gemini.', {
                    cause: error,
                });
            }
        },

        subscribe,
    };
}

function createOllamaService({ toast }) {
    function getConfig() {
        try {
            const endpoint = localStorage.getItem(OLLAMA_STORAGE_KEYS.endpoint) || OLLAMA_DEFAULTS.endpoint;
            const model = localStorage.getItem(OLLAMA_STORAGE_KEYS.model) || OLLAMA_DEFAULTS.model;
            return { endpoint, model };
        } catch (error) {
            console.debug('Lecture config Ollama impossible :', error);
            return { endpoint: OLLAMA_DEFAULTS.endpoint, model: OLLAMA_DEFAULTS.model };
        }
    }

    function saveConfig(endpoint, model) {
        try {
            localStorage.setItem(OLLAMA_STORAGE_KEYS.endpoint, endpoint);
            localStorage.setItem(OLLAMA_STORAGE_KEYS.model, model);
            return true;
        } catch (error) {
            console.debug('Impossible de sauvegarder la config Ollama.', error);
            return false;
        }
    }

    async function fetchAnalysis(prompt) {
        const text = (prompt || '').trim();
        if (!text) throw new Error('Message vide.');

        const config = getConfig();
        const url = `${config.endpoint}/api/generate`;

        const requestBody = {
            model: config.model,
            prompt: `${GEMINI_SYSTEM_PROMPT}\n\nUtilisateur: ${text}`,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
            },
        };

        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
        } catch (error) {
            throw new Error(`Impossible de contacter Ollama sur ${config.endpoint}. Assure-toi qu'Ollama est lancé.`);
        }

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Erreur inconnue');
            throw new Error(`Ollama erreur ${response.status}: ${errorText}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('Réponse Ollama invalide (pas du JSON).');
        }

        if (!data.response) {
            throw new Error('Réponse Ollama vide.');
        }

        // Essayer de parser le JSON de la réponse
        let parsed;
        try {
            // Chercher du JSON dans la réponse
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Pas de JSON trouvé');
            }
        } catch (error) {
            // Si pas de JSON valide, créer une réponse structurée à partir du texte
            console.debug('Ollama réponse non-JSON, fallback structuré :', error);
            parsed = {
                meta: 'Analyse Ollama (format libre)',
                takeaways: [
                    'Prends le temps de valider les émotions exprimées',
                    'Identifie le besoin sous-jacent avant de proposer une solution',
                ],
                options: [
                    {
                        objective: 'Réponse proposée',
                        script: data.response.substring(0, 500), // Limiter la longueur
                    },
                ],
            };
        }

        parsed.meta = parsed.meta || 'Analyse Ollama';
        parsed.takeaways = Array.isArray(parsed.takeaways) ? parsed.takeaways : [];
        parsed.options = Array.isArray(parsed.options) ? parsed.options : [];
        parsed.source = 'ollama';
        parsed.model = config.model;

        return parsed;
    }

    return {
        getConfig,
        saveConfig,
        fetchAnalysis,
        isConfigured() {
            return true; // Ollama est toujours "configuré" (même avec valeurs par défaut)
        },
    };
}

function createAIModule({ rootId, toast, gemini, ollama, modal }) {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Racine IA "${rootId}" introuvable.`);
        return { render: () => {} };
    }

    const state = {
        isLoading: false,
        lastResult: null,
    };
    let unsubscribeGemini = null;

    function getAIProvider() {
        try {
            return localStorage.getItem(STORAGE_KEYS.aiProvider) || 'heuristic';
        } catch (error) {
            return 'heuristic';
        }
    }

    function setAIProvider(provider) {
        try {
            localStorage.setItem(STORAGE_KEYS.aiProvider, provider);
        } catch (error) {
            console.debug('Impossible de sauvegarder le provider IA');
        }
    }

    function ensureSubscription() {
        if (unsubscribeGemini) return;
        unsubscribeGemini = gemini.subscribe(() => {
            if (!state.isLoading) render();
        });
    }

    function render() {
        ensureSubscription();
        const currentProvider = getAIProvider();
        const geminiStatus = gemini.getKeyStatus();
        const ollamaConfig = ollama.getConfig();

        let statusInfo = '';
        let configButtons = '';

        // Construire le status selon le provider sélectionné
        if (currentProvider === 'gemini') {
            const statusBadge = geminiStatus.configured
                ? `<span class="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
                        ✓ Gemini actif${geminiStatus.hint ? ` • ****${geminiStatus.hint}` : ''}
                   </span>`
                : `<span class="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
                        ⚠ Gemini non configuré
                   </span>`;
            const cooldownInfo = geminiStatus.cooldown
                ? `<p class="text-xs text-amber-500">Pause jusqu'à ${formatCountdown(geminiStatus.cooldown)}</p>`
                : '';
            statusInfo = `${statusBadge}${cooldownInfo}`;
            configButtons = '<button type="button" class="secondary-button text-sm" data-action="configure-gemini">⚙️ Config Gemini</button>';
        } else if (currentProvider === 'ollama') {
            statusInfo = `<span class="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                    🤖 Ollama • ${ollamaConfig.model}
               </span>
               <p class="text-xs text-slate-500">${ollamaConfig.endpoint}</p>`;
            configButtons = '<button type="button" class="secondary-button text-sm" data-action="configure-ollama">⚙️ Config Ollama</button>';
        } else {
            statusInfo = `<span class="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                    📊 Analyse locale (heuristique)
               </span>
               <p class="text-xs text-slate-500">Aucune IA externe • Gratuit</p>`;
        }

        root.innerHTML = `
            <div class="space-y-6">
                <header class="space-y-3">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Analyse IA</h2>
                    <p class="text-slate-600 dark:text-slate-400 text-sm">
                        Parse un message ou une situation pour obtenir des scripts prêts à l'emploi.
                    </p>

                    <div class="form-group">
                        <label for="ai-provider-select">Provider IA</label>
                        <select id="ai-provider-select" class="w-full sm:w-auto">
                            <option value="heuristic" ${currentProvider === 'heuristic' ? 'selected' : ''}>🔍 Analyse locale (gratuit)</option>
                            <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>🤖 Ollama (LLM local)</option>
                            <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>✨ Gemini API</option>
                        </select>
                    </div>

                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div class="space-y-1">
                            ${statusInfo}
                        </div>
                        <div class="flex gap-2">
                            ${configButtons}
                        </div>
                    </div>
                </header>

                <section class="ai-panel">
                    <div class="form-group">
                        <label for="ai-input">Message ou situation</label>
                        <textarea id="ai-input" rows="6" placeholder="Colle ici le message reçu ou décris la scène..."></textarea>
                    </div>

                    <div class="ai-dropzone" data-dropzone>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                            Glisse-dépose une capture (optionnel) — la fonctionnalité multimodale arrive avec l’API Gemini.
                        </p>
                        <input type="file" accept="image/*" data-file-input class="hidden" multiple>
                        <button type="button" class="journal-card-button mt-3" data-action="trigger-file">
                            📎 Ajouter des images
                        </button>
                        <div data-thumbnails class="flex gap-3 flex-wrap mt-3"></div>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <button type="button" class="primary-button" data-action="analyze">
                            <span class="analyze-label">Analyser la situation</span>
                        </button>
                        <button type="button" class="secondary-button" data-action="reset">
                            Réinitialiser
                        </button>
                    </div>
                </section>

                <section id="ai-results" class="ai-results hidden"></section>
            </div>
        `;

        const textarea = root.querySelector('#ai-input');
        autoResizeTextarea(textarea);
        textarea?.addEventListener('input', () => autoResizeTextarea(textarea));

        // Provider selector
        const providerSelect = root.querySelector('#ai-provider-select');
        providerSelect?.addEventListener('change', (event) => {
            setAIProvider(event.target.value);
            render();
        });

        const dropzone = root.querySelector('[data-dropzone]');
        const fileInput = root.querySelector('[data-file-input]');
        const thumbnails = root.querySelector('[data-thumbnails]');

        dropzone?.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropzone.classList.add('drag');
        });
        dropzone?.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag');
        });
        dropzone?.addEventListener('drop', (event) => {
            event.preventDefault();
            dropzone.classList.remove('drag');
            const files = Array.from(event.dataTransfer.files || []);
            previewFiles(files);
        });

        root.addEventListener('click', (event) => {
            const action = event.target.getAttribute('data-action');
            if (!action) return;

            switch (action) {
                case 'trigger-file':
                    fileInput?.click();
                    break;
                case 'analyze':
                    analyze();
                    break;
                case 'reset':
                    reset();
                    break;
                case 'configure-gemini':
                    openGeminiModal();
                    break;
                case 'configure-ollama':
                    openOllamaModal();
                    break;
                default:
                    break;
            }
        });

        fileInput?.addEventListener('change', (event) => {
            const files = Array.from(event.target.files || []);
            previewFiles(files);
        });

        function previewFiles(files) {
            if (!files.length) return;
            thumbnails.innerHTML = files
                .slice(0, 4)
                .map(
                    (file) => `
                        <span class="badge">${file.name}</span>
                    `,
                )
                .join('');
            toast.info('Images attachées (prévisualisation).');
        }

        function reset() {
            textarea.value = '';
            autoResizeTextarea(textarea);
            thumbnails.innerHTML = '';
            fileInput.value = '';
            state.lastResult = null;
            root.querySelector('#ai-results').classList.add('hidden');
            root.querySelector('#ai-results').innerHTML = '';
        }

        function analyze() {
            const text = textarea.value.trim();
            if (!text) {
                toast.error('Ajoute un message ou une description à analyser.');
                return;
            }
            if (state.isLoading) return;

            const provider = getAIProvider();
            setLoading(true);

            (async () => {
                let result;

                if (provider === 'gemini') {
                    const status = gemini.getKeyStatus();
                    if (!status.configured) {
                        toast.warning('Gemini non configuré. Configure-le ou change de provider.');
                        openGeminiModal();
                        return runLocalHeuristics(text);
                    }
                    if (status.cooldown) {
                        toast.warning(`Gemini en cooldown. Fallback local.`);
                        result = runLocalHeuristics(text);
                        result.source = 'heuristic';
                        return result;
                    }
                    toast.info('Analyse Gemini en cours...');
                    try {
                        result = await gemini.fetchAnalysis(text);
                        result.meta = result.meta || "Analyse Gemini";
                        result.source = 'gemini';
                        toast.success('Analyse Gemini générée.');
                    } catch (error) {
                        result = handleGeminiError(error, text);
                    }
                } else if (provider === 'ollama') {
                    toast.info('Analyse Ollama en cours...');
                    try {
                        result = await ollama.fetchAnalysis(text);
                        toast.success(`Analyse générée par ${result.model}`);
                    } catch (error) {
                        console.error('Ollama error:', error);
                        toast.error(error.message || 'Erreur Ollama. Fallback local.');
                        result = runLocalHeuristics(text);
                        result.source = 'heuristic';
                    }
                } else {
                    // Heuristic
                    toast.info('Analyse heuristique locale...');
                    result = runLocalHeuristics(text);
                    result.source = 'heuristic';
                }

                setResult(result);
            })()
                .catch((error) => {
                    console.error('Analyse IA', error);
                    toast.error('Analyse impossible pour le moment.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }

        function handleGeminiError(error, promptText) {
            console.debug('Gemini error', error);
            switch (error.code) {
                case 'NO_KEY':
                    toast.info('Configure la clé Gemini pour activer l’IA.');
                    openGeminiModal();
                    break;
                case 'INVALID_KEY':
                    toast.error('Clé Gemini invalide. Mets-la à jour.');
                    openGeminiModal();
                    break;
                case 'COOLDOWN':
                case 'QUOTA': {
                    const until = error.cooldownUntil || Date.now() + COOLDOWN_DEFAULTS.defaultMs;
                    toast.warning(
                        `Quota Gemini atteint. Fallback local (${formatCountdown(until)}).`,
                    );
                    break;
                }
                case 'PARSE_ERROR':
                    toast.warning('Réponse Gemini inattendue. Utilisation de l’heuristique.');
                    break;
                case 'NETWORK':
                case 'API_ERROR':
                    toast.warning('API Gemini indisponible. Analyse locale utilisée.');
                    break;
                default:
                    toast.warning("Analyse Gemini interrompue. Fallback heuristique.");
            }
            const fallback = runLocalHeuristics(promptText);
            fallback.source = 'heuristic';
            return fallback;
        }

        function setResult(result) {
            if (!result) return;
            state.lastResult = result;
            const container = root.querySelector('#ai-results');
            if (!container) return;
            container.classList.remove('hidden');

            const safeTakeaways =
                Array.isArray(result.takeaways) && result.takeaways.length > 0
                    ? result.takeaways
                    : ['Analyse locale : reprends la validation émotionnelle avant de répondre.'];
            const safeOptions =
                Array.isArray(result.options) && result.options.length > 0
                    ? result.options
                    : [
                          {
                              objective: 'Désescalade',
                              script:
                                  "Je t'entends, je veux qu'on reprenne calmement. Donne-moi 15 minutes et je reviens avec un plan clair.",
                          },
                      ];

            let title = 'Analyse locale';
            let badgeClass = 'bg-slate-200 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200';
            let badgeLabel = 'Heuristique';

            if (result.source === 'gemini') {
                title = 'Analyse Gemini';
                badgeClass = 'bg-emerald-100 text-emerald-700';
                badgeLabel = 'Gemini';
            } else if (result.source === 'ollama') {
                title = `Analyse Ollama (${result.model || 'LLM'})`;
                badgeClass = 'bg-blue-100 text-blue-700';
                badgeLabel = 'Ollama';
            }
            const quotaInfo = result.quota
                ? `<div class="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                        <span>Quota restant : ${
                            typeof result.quota.remaining === 'number'
                                ? result.quota.remaining
                                : '—'
                        }/${result.quota.limit ?? '—'}</span>
                        ${
                            result.quota.resetMs
                                ? `<span>Reset ${
                                      formatCountdown(result.quota.resetMs)
                                  }</span>`
                                : ''
                        }
                   </div>`
                : '';

            container.innerHTML = `
                <div class="space-y-4">
                    <header class="space-y-2">
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">${title}</h3>
                            <span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}">
                                ${badgeLabel}
                            </span>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${escapeHTML(
                            result.meta || '',
                        )}</p>
                        ${quotaInfo}
                    </header>
                    <article class="space-y-3">
                        <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Insights clés</h4>
                        <ul class="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            ${safeTakeaways
                                .map((item) => `<li>${escapeHTML(item)}</li>`)
                                .join('')}
                        </ul>
                    </article>
                    <article class="space-y-3">
                        <h4 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Scripts proposés</h4>
                        <div class="space-y-3">
                            ${safeOptions
                                .map(
                                    (option) => `
                                        <div class="journal-card">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="badge">${escapeHTML(
                                                    option.objective || 'Option',
                                                )}</span>
                                                <button type="button" class="journal-card-button" data-copy-text="${escapeHTML(
                                                    option.script || '',
                                                )}" data-toast-success="Script copié.">
                                                    📋 Copier
                                                </button>
                                            </div>
                                            <p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                ${escapeHTML(option.script || '')}
                                            </p>
                                        </div>
                                    `,
                                )
                                .join('')}
                        </div>
                    </article>
                </div>
            `;
        }

        function setLoading(isLoading) {
            state.isLoading = isLoading;
            const button = root.querySelector('[data-action="analyze"]');
            if (!button) return;
            button.disabled = isLoading;
            button.classList.toggle('opacity-70', isLoading);
            const label = button.querySelector('.analyze-label');
            if (label) {
                label.textContent = isLoading
                    ? 'Analyse en cours...'
                    : 'Analyser la situation';
            }
        }

        function openGeminiModal() {
            const status = gemini.getKeyStatus();
            const html = `
                <form id="gemini-config-form" class="space-y-4">
                    <div class="form-group">
                        <label for="gemini-key">Clé API Gemini</label>
                        <input type="password" id="gemini-key" name="gemini-key" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" placeholder="AIza..." autocomplete="off">
                        <p class="helper-text">
                            La clé est stockée chiffrée sur cet appareil${
                                status.hint ? ` (actuelle : ****${status.hint})` : ''
                            }.
                        </p>
                    </div>
                </form>
            `;

            const actions = [
                {
                    label: status.configured ? 'Mettre à jour' : 'Enregistrer',
                    variant: 'primary',
                    onClick: async () => {
                        const form = document.getElementById('gemini-config-form');
                        const input = form?.querySelector('#gemini-key');
                        const value = input?.value.trim();
                        if (!value) {
                            toast.error('Colle ta clé Gemini avant de valider.');
                            input?.focus();
                            return;
                        }
                        try {
                            await gemini.saveKey(value);
                            toast.success('Clé Gemini enregistrée.');
                            modal.hide('gemini-modal');
                        } catch (error) {
                            toast.error(error.message || 'Impossible de sauvegarder la clé.');
                        }
                    },
                },
            ];

            if (status.configured) {
                actions.push({
                    label: 'Supprimer la clé',
                    variant: 'secondary',
                    onClick: async () => {
                        await gemini.deleteKey();
                        toast.info('Clé Gemini supprimée.');
                        modal.hide('gemini-modal');
                    },
                });
            }

            actions.push({
                label: 'Fermer',
                onClick: () => modal.hide('gemini-modal'),
            });

            modal.show({
                targetId: 'gemini-modal',
                title: 'Configuration Gemini',
                html,
                actions,
            });
        }

        function openOllamaModal() {
            const config = ollama.getConfig();
            const html = `
                <form id="ollama-config-form" class="space-y-4">
                    <div class="form-group">
                        <label for="ollama-endpoint">Endpoint Ollama</label>
                        <input type="text" id="ollama-endpoint" name="ollama-endpoint" value="${config.endpoint}" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" placeholder="http://localhost:11434">
                        <p class="helper-text">
                            URL de ton serveur Ollama local (par défaut http://localhost:11434)
                        </p>
                    </div>
                    <div class="form-group">
                        <label for="ollama-model">Modèle</label>
                        <input type="text" id="ollama-model" name="ollama-model" value="${config.model}" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" placeholder="llama3.2">
                        <p class="helper-text">
                            Nom du modèle Ollama à utiliser (ex: llama3.2, mistral, qwen2.5:7b)
                        </p>
                    </div>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                        <p class="text-blue-900 dark:text-blue-100 font-semibold mb-1">💡 Installation Ollama</p>
                        <p class="text-blue-700 dark:text-blue-300 text-xs">
                            Pour installer Ollama : <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">brew install ollama</code> puis <code class="bg-blue-100 dark:bg-blue-900 px-1 rounded">ollama run llama3.2</code>
                        </p>
                    </div>
                </form>
            `;

            const actions = [
                {
                    label: 'Enregistrer',
                    variant: 'primary',
                    onClick: () => {
                        const form = document.getElementById('ollama-config-form');
                        const endpointInput = form?.querySelector('#ollama-endpoint');
                        const modelInput = form?.querySelector('#ollama-model');
                        const endpoint = endpointInput?.value.trim() || OLLAMA_DEFAULTS.endpoint;
                        const model = modelInput?.value.trim() || OLLAMA_DEFAULTS.model;

                        ollama.saveConfig(endpoint, model);
                        toast.success('Configuration Ollama sauvegardée.');
                        modal.hide('ollama-modal');
                        render();
                    },
                },
                {
                    label: 'Fermer',
                    onClick: () => modal.hide('ollama-modal'),
                },
            ];

            modal.show({
                targetId: 'ollama-modal',
                title: 'Configuration Ollama',
                html,
                actions,
            });
        }
    }

    return { render };
}

function createGuideModule({ rootId, toast }) {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Racine guide "${rootId}" introuvable.`);
        return { render: () => {} };
    }

    function render() {
        root.innerHTML = `
            <div class="space-y-6">
                <header>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Playbook</h2>
                    <p class="text-slate-600 dark:text-slate-400 text-sm">
                        Les fondamentaux de la Boîte à Outils : persona IA, glossaire et quick wins de désescalade.
                    </p>
                </header>

                <section class="dashboard-card space-y-4">
                    <header>
                        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">System Prompt (Persona IA)</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                            Brief initial pour garder la même dynamique lors d’un échange avec ton IA préférée.
                        </p>
                    </header>
                    <pre class="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">${escapeHTML(
                        getSystemPromptExcerpt(),
                    )}</pre>
                    <button type="button" class="primary-button self-start" data-copy-text="${escapeHTML(
                        getSystemPromptExcerpt(),
                    )}" data-toast-success="Persona copié.">
                        📋 Copier la persona
                    </button>
                </section>

                <section class="dashboard-card space-y-4">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Glossaire Ego Radar</h3>
                    <div class="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        ${renderGlossary()}
                    </div>
                </section>

                <section class="dashboard-card space-y-4">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Framework de réponse MVP</h3>
                    <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <li>Pause et respiration (30s) pour recharger ton cortex.</li>
                        <li>Valide explicitement la frustration ou la peur exprimée.</li>
                        <li>Réponds au besoin métier (User Story) en une proposition concrète.</li>
                        <li>Propose la suite : MVP livré + itération planifiée.</li>
                    </ol>
                </section>
            </div>
        `;
    }

    function getSystemPromptExcerpt() {
        return `Tu es un Coach & Analyste en communication de crise interpersonnelle. Ta méthodologie : 
1. Valider l'émotion.
2. Diagnostiquer l'ego (Défensive, Sauveur, Martyr, Dernier Mot, Refus d'influence).
3. Identifier le besoin caché (user story).
4. Proposer 2-3 scripts de réponse (objectif : désescalade, limite, alignement produit).`;
    }

    function renderGlossary() {
        const items = [
            {
                label: 'La Défensive',
                description:
                    "Réflexe de justification instantanée. Antidote : accepter le feedback sans contre-attaque, 2 phrases maximum.",
            },
            {
                label: 'Le Sauveur',
                description:
                    "Tu veux réparer au lieu d'écouter. Antidote : active la validation radicale avant de proposer un plan.",
            },
            {
                label: 'Le Martyr',
                description:
                    'Tu fais la comptabilité de tes efforts. Antidote : traite chaque sujet comme une user story indépendante.',
            },
            {
                label: 'Le Dernier Mot',
                description:
                    'Besoin de gagner le débat logique. Antidote : silence stratégique, puis question ouverte.',
            },
            {
                label: "Refus d'influence",
                description:
                    "Tu rejètes la méthode de l'autre par principe. Antidote : tester sa proposition 24h en mode MVP.",
            },
        ];

        return items
            .map(
                (item) => `
                    <div>
                        <strong class="text-slate-800 dark:text-slate-100">${item.label}</strong>
                        <p>${item.description}</p>
                    </div>
                `,
            )
            .join('');
    }

    return { render };
}

// --- Store ---

function createJournalStore(storageKey, toast) {
    const fallback = [];

    function getAll() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return [...fallback];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [...fallback];
            return parsed.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        } catch (error) {
            console.debug('Lecture du journal impossible :', error);
            return [...fallback];
        }
    }

    function saveAll(entries) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(entries));
            return true;
        } catch (error) {
            console.debug('Écriture du journal impossible :', error);
            fallback.length = 0;
            fallback.push(...entries);
            toast?.warning?.('Stockage local indisponible, données conservées en mémoire.');
            return false;
        }
    }

    function saveEntry(entry) {
        const entries = getAll();
        entries.unshift(entry);
        const success = saveAll(entries);
        return success
            ? { success: true, entry }
            : { success: false, message: 'Impossible de persister cette analyse.' };
    }

    function deleteEntry(entryId) {
        const entries = getAll();
        const nextEntries = entries.filter((entry) => entry.id !== entryId);
        if (nextEntries.length === entries.length) {
            return { success: false, message: 'Entrée introuvable.' };
        }
        saveAll(nextEntries);
        return { success: true };
    }

    function clear() {
        saveAll([]);
    }

    function getById(entryId) {
        return getAll().find((entry) => entry.id === entryId) || null;
    }

    function importEntries(list) {
        const sanitized = list
            .filter((entry) => entry && entry.id && entry.createdAt)
            .map((entry) => ({
                ...entry,
                createdAt: entry.createdAt,
            }));
        const current = getAll();
        const merged = [...sanitized, ...current].reduce((map, entry) => {
            map.set(entry.id, entry);
            return map;
        }, new Map());
        const nextEntries = Array.from(merged.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        saveAll(nextEntries);
        return { success: true, count: sanitized.length };
    }

    return {
        getAll,
        saveEntry,
        deleteEntry,
        clear,
        getById,
        importEntries,
    };
}

// --- Utils & Helpers ---

function createLocalEncryptor() {
    const subtle = window.crypto?.subtle;
    const isSecure = Boolean(subtle) && (window.isSecureContext ?? true);
    if (!isSecure) {
        const fallbackKey =
            localStorage.getItem(GEMINI_STORAGE_KEYS.secret) ||
            (() => {
                const generated = Array.from({ length: 16 }, () =>
                    Math.floor(Math.random() * 36).toString(36),
                ).join('');
                try {
                    localStorage.setItem(GEMINI_STORAGE_KEYS.secret, generated);
                } catch (error) {
                    console.debug('Impossible de stocker la clé fallback.', error);
                }
                return generated;
            })();

        const xor = (text) => {
            const key = fallbackKey;
            return Array.from(text)
                .map((char, index) =>
                    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length)),
                )
                .join('');
        };

        return {
            isFallback: true,
            async encrypt(plainText) {
                const cipher = btoa(xor(plainText));
                return {
                    cipher,
                    iv: '',
                    createdAt: new Date().toISOString(),
                };
            },
            async decrypt(payload) {
                const decoded = atob(payload.cipher || '');
                return xor(decoded);
            },
        };
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let cryptoKeyPromise = null;

    async function getCryptoKey() {
        if (cryptoKeyPromise) return cryptoKeyPromise;
        cryptoKeyPromise = (async () => {
            try {
                const stored = localStorage.getItem(GEMINI_STORAGE_KEYS.secret);
                if (stored) {
                    const raw = fromBase64(stored);
                    return await subtle.importKey(
                        'raw',
                        raw,
                        { name: 'AES-GCM' },
                        false,
                        ['encrypt', 'decrypt'],
                    );
                }
            } catch (error) {
                console.debug('Lecture clé AES échouée.', error);
            }
            const rawKey = window.crypto.getRandomValues(new Uint8Array(32));
            try {
                localStorage.setItem(GEMINI_STORAGE_KEYS.secret, toBase64(rawKey.buffer));
            } catch (error) {
                console.debug('Impossible de stocker la clé AES.', error);
            }
            return subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
                'encrypt',
                'decrypt',
            ]);
        })();
        return cryptoKeyPromise;
    }

    return {
        isFallback: false,
        async encrypt(plainText) {
            const key = await getCryptoKey();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const cipherBuffer = await subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                key,
                encoder.encode(plainText),
            );
            return {
                cipher: toBase64(cipherBuffer),
                iv: toBase64(iv.buffer),
                createdAt: new Date().toISOString(),
            };
        },
        async decrypt(payload) {
            const key = await getCryptoKey();
            const cipher = fromBase64(payload.cipher || '');
            const iv = payload.iv ? fromBase64(payload.iv) : new Uint8Array(12);
            const plainBuffer = await subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                key,
                cipher.buffer,
            );
            return decoder.decode(plainBuffer);
        },
    };
}

function createToastManager(rootId = 'toast-root') {
    const root = document.getElementById(rootId);
    if (!root) {
        console.warn(`Toast root "${rootId}" introuvable.`);
        return {
            show: (message) => console.log('Toast:', message),
            success: (message) => console.log('Toast success:', message),
            error: (message) => console.error('Toast error:', message),
            info: (message) => console.info('Toast info:', message),
            warning: (message) => console.warn('Toast warning:', message),
        };
    }

    const DEFAULT_DURATION = 3200;
    const toasts = new Set();

    function show(message, options = {}) {
        const { type = 'info', duration = DEFAULT_DURATION } = options;
        const toastElement = document.createElement('div');
        toastElement.className = `toast toast-${type}`;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'toast-icon';
        iconSpan.textContent = resolveIcon(type);

        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Fermer la notification');
        closeButton.innerHTML = '&times;';

        toastElement.append(iconSpan, messageSpan, closeButton);
        root.appendChild(toastElement);

        requestAnimationFrame(() => {
            toastElement.classList.add('show');
        });

        const hide = () => {
            if (toasts.has(toastElement)) {
                toastElement.classList.add('hide');
                setTimeout(() => {
                    root.removeChild(toastElement);
                    toasts.delete(toastElement);
                }, 220);
            }
        };

        closeButton.addEventListener('click', hide);
        toasts.add(toastElement);

        if (duration !== Infinity) {
            setTimeout(hide, duration);
        }

        return hide;
    }

    function resolveIcon(type) {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '⚠️';
            case 'warning':
                return '⚡';
            default:
                return '💬';
        }
    }

    return {
        show,
        success: (message, options = {}) => show(message, { ...options, type: 'success' }),
        error: (message, options = {}) => show(message, { ...options, type: 'error' }),
        info: (message, options = {}) => show(message, { ...options, type: 'info' }),
        warning: (message, options = {}) => show(message, { ...options, type: 'warning' }),
    };
}

function createModalManager() {
    const active = new Map();

    document.addEventListener('click', (event) => {
        if (event.target.matches('[data-modal-backdrop]')) {
            const modalId = event.target.getAttribute('data-modal-target');
            if (modalId) hide(modalId);
        }
        if (event.target.matches('[data-modal-close]')) {
            const modalId = event.target.getAttribute('data-modal-target');
            if (modalId) hide(modalId);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const [last] = Array.from(active.keys()).slice(-1);
            if (last) hide(last);
        }
    });

    function show({ targetId = 'journal-modal', title = '', html = '', actions = [] }) {
        const root = document.getElementById(targetId);
        if (!root) {
            console.warn(`Modal "${targetId}" introuvable.`);
            return;
        }

        const actionButtons = actions
            .map(
                (action, index) => `
                    <button type="button"
                        class="${action.variant === 'primary' ? 'primary-button' : 'secondary-button'}"
                        data-modal-action="${index}"
                        data-modal-target="${targetId}"
                    >
                        ${action.label}
                    </button>
                `,
            )
            .join('');

        root.innerHTML = `
            <div class="modal-backdrop" data-modal-backdrop data-modal-target="${targetId}"></div>
            <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="${targetId}-title">
                <div class="flex justify-between items-start gap-4 mb-4">
                    <h3 id="${targetId}-title" class="text-xl font-semibold text-slate-800 dark:text-slate-100">${title}</h3>
                    <button type="button" class="toast-close text-2xl leading-none" data-modal-close data-modal-target="${targetId}">×</button>
                </div>
                <div class="space-y-4 text-sm text-slate-700 dark:text-slate-300">${html}</div>
                ${
                    actions.length > 0
                        ? `<div class="flex justify-end gap-3 mt-6">${actionButtons}</div>`
                        : ''
                }
            </div>
        `;
        root.classList.remove('hidden');
        active.set(targetId, { root, actions });

        root.querySelectorAll('[data-modal-action]').forEach((button) => {
            const actionIndex = Number.parseInt(
                button.getAttribute('data-modal-action'),
                10,
            );
            const config = actions[actionIndex];
            if (!config) return;
            button.addEventListener('click', () => {
                config.onClick?.();
            });
        });
    }

    function hide(targetId = 'journal-modal') {
        const entry = active.get(targetId);
        if (!entry) return;
        entry.root.classList.add('hidden');
        entry.root.innerHTML = '';
        active.delete(targetId);
    }

    return { show, hide };
}

function buildGeminiRequest(prompt) {
    return {
        systemInstruction: {
            role: 'system',
            parts: [{ text: GEMINI_SYSTEM_PROMPT }],
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: 0.65,
            topP: 0.9,
            topK: 32,
            maxOutputTokens: 1024,
        },
    };
}

function parseGeminiResponse(data) {
    const candidates = data?.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('Réponse Gemini vide.');
    }

    const parts = candidates
        .map((candidate) => candidate?.content?.parts || [])
        .flat()
        .map((part) => part?.text || '')
        .filter(Boolean);

    if (!parts.length) {
        throw new Error('Réponse Gemini sans texte.');
    }

    const rawText = parts.join('').trim();
    if (!rawText) {
        throw new Error('Texte Gemini vide.');
    }

    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch (error) {
        throw new Error('Réponse Gemini non JSON.');
    }

    parsed.meta = typeof parsed.meta === 'string' ? parsed.meta : '';
    parsed.takeaways = Array.isArray(parsed.takeaways) ? parsed.takeaways : [];
    parsed.options = Array.isArray(parsed.options) ? parsed.options : [];
    return parsed;
}

function readQuotaHeaders(headers) {
    if (!headers?.get) return null;
    const limitHeader = headers.get('x-ratelimit-limit');
    const remainingHeader = headers.get('x-ratelimit-remaining');
    const limit = limitHeader != null ? Number.parseInt(limitHeader, 10) : null;
    const remaining = remainingHeader != null ? Number.parseInt(remainingHeader, 10) : null;
    const resetHeader = headers.get('x-ratelimit-reset') || headers.get('x-ratelimit-reset-ms');
    let resetMs = null;
    if (resetHeader) {
        const resetValue = Number.parseInt(resetHeader, 10);
        if (!Number.isNaN(resetValue)) {
            resetMs = resetValue > COOLDOWN_DEFAULTS.timestampThreshold ? resetValue : resetValue * 1000;
        }
    }
    const hasLimit = limit != null && !Number.isNaN(limit);
    const hasRemaining = remaining != null && !Number.isNaN(remaining);
    const hasReset = resetMs != null && !Number.isNaN(resetMs);
    if (!hasLimit && !hasRemaining && !hasReset) {
        return null;
    }
    return {
        limit: hasLimit ? limit : null,
        remaining: hasRemaining ? remaining : null,
        resetMs,
    };
}

function formatCountdown(timestamp) {
    const diff = Math.max(0, timestamp - Date.now());
    const seconds = Math.round(diff / 1000);
    if (seconds <= 1) return 'dans 1 seconde';
    if (seconds < 60) return `dans ${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `dans ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `dans ${hours} h`;
    const days = Math.round(hours / 24);
    return `dans ${days} j`;
}

function toBase64(buffer) {
    const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    uint8Array.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function fromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function copyTextToClipboard(text) {
    const value = text ?? '';
    if (!value) {
        return Promise.reject(new Error('Texte vide'));
    }

    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(value);
    }

    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const success = document.execCommand('copy');
            if (!success) throw new Error('execCommand a échoué');
            resolve(true);
        } catch (error) {
            reject(error);
        } finally {
            document.body.removeChild(textarea);
        }
    });
}

function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function calculateJournalStats(entries) {
    const totalEntries = entries.length;
    const lastEntry = entries[0] || null;
    const egoCounts = entries.reduce((map, entry) => {
        const key = entry.egoFocus || 'Indéfini';
        map[key] = (map[key] || 0) + 1;
        return map;
    }, {});

    let topEgo = null;
    let topCount = 0;
    Object.entries(egoCounts).forEach(([ego, count]) => {
        if (count > topCount) {
            topEgo = ego;
            topCount = count;
        }
    });

    const defensiveEntries = entries.filter(
        (entry) => (entry.egoFocus || '').toLowerCase().includes('défensive'),
    );
    const lastDefensive = defensiveEntries[0] || null;
    const daysSinceDefensive = lastDefensive
        ? Math.max(
              0,
              Math.round(
                  (Date.now() - new Date(lastDefensive.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24),
              ),
          )
        : null;

    return {
        totalEntries,
        lastEntry,
        topEgo,
        topEgoPercentage:
            totalEntries > 0 ? Math.round((topCount / totalEntries) * 100) : 0,
        daysSinceDefensive,
        latestEntries: entries.slice(0, 3),
    };
}

function runLocalHeuristics(text) {
    const lower = text.toLowerCase();
    const tensionIndicators = ['tu ne', 'toujours', 'encore', 'pourquoi', 'fais'];
    const validationNeed = ['écoute', 'compris', 'soutiens', 'présent', 'merci'];
    const limitNeed = ['stop', 'limite', 'respecte', 'ne peux pas'];

    const tensionScore = tensionIndicators.reduce(
        (score, word) => score + (lower.includes(word) ? 1 : 0),
        0,
    );

    const meta =
        tensionScore >= 3
            ? 'Chaleur élevée : privilégie une réponse courte, validante, avec option pause.'
            : tensionScore === 2
            ? 'Tension modérée : une validation claire + proposition de plan peut suffire.'
            : 'Tension faible : opportunité de co-construction.';

    const needsValidation = validationNeed.some((word) => lower.includes(word));
    const needsBoundaries = limitNeed.some((word) => lower.includes(word));

    const takeaways = [
        tensionScore >= 3
            ? "Ton ego Défensif risque de réagir. Ralentis avant de dérouler ton script."
            : "Continue de valider avant de proposer la moindre solution.",
        needsBoundaries
            ? 'Une limite claire semble nécessaire. Prépare-la en mode MVP.'
            : 'Propose un plan d’action concret pour la suite.',
        needsValidation
            ? "La validation émotionnelle doit être la première brique de ta réponse."
            : "Ressors la user story cachée pour faire redescendre la tension.",
    ];

    const options = [
        {
            objective: 'Désescalade immédiate',
            script:
                "Je t'entends. Ce que tu décris est fatigant/ blessant et c'est normal que ça te prenne autant de place. Je propose qu'on fasse une pause de 15 minutes pour que je revienne vers toi avec un plan plus clair, ok ?",
        },
        {
            objective: needsBoundaries ? 'Poser une limite' : 'Clarifier le besoin',
            script: needsBoundaries
                ? "Je veux vraiment qu'on avance, et j'ai besoin qu'on évite les généralités type “toujours/jamais”. Ce soir, j'ai l'énergie pour écouter et poser une limite claire : si on dépasse ce ton, je stoppe la discussion et on reprend demain calmement."
                : "Ce que je comprends : tu as besoin de sentir que je m'implique autant que toi. Voici ce que je te propose : [action concrète], et on fait un point dimanche pour mesurer si ça te soulage.",
        },
        {
            objective: 'Alignement produit',
            script:
                "Scenario 1 : je fais [action], scenario 2 : on pose ensemble une autre manière de gérer [sujet]. Donne-moi ton feedback : quel MVP te semble le plus aligné avec ton besoin là tout de suite ?",
        },
    ];

    return {
        meta,
        takeaways,
        options,
    };
}

function formatDateShort(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Date inconnue';
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatRelativeTime(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Date inconnue';
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks < 5) return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
    return formatDateShort(d);
}

function formatFullDate(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Date inconnue';
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
