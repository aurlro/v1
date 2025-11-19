'use strict';

// 🛡️ GLOBAL SAFETY NET (Error Boundary)
// Capture les erreurs critiques pour éviter l écran blanc
window.onerror = function(msg, url, lineNo, columnNo, error) {
    if (msg.includes('ResizeObserver')) return false; // Ignorer erreurs bénignes
    console.error('🔥 CRASH DETECTED:', { msg, error });

    // Essayer d utiliser le toast système si disponible
    if (window.app?.toast) {
        window.app.toast.error(`Erreur système : ${msg}. Tentez de rafraîchir.`);
    }
    return false;
};

window.onunhandledrejection = function(event) {
    console.error('🔥 ASYNC ERROR:', event.reason);
    // Feedback utilisateur uniquement si c est critique (pas une annulation)
    if (window.app?.toast && event.reason?.name !== 'AbortError') {
        console.warn('Opération en arrière-plan échouée');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderIcons();
    const body = document.body;
    const toast = createToastManager();
    const modal = createModalManager();

    // 🟢 SYSTEM HEALTH CHECK: Vérifier la santé du système au démarrage
    const healthStatus = getSystemHealthStatus();
    if (healthStatus.status === 'error') {
        console.error('❌ Système critique:', healthStatus.issues);
        healthStatus.issues.forEach(issue => {
            toast.error(issue);
        });
    } else if (healthStatus.status === 'warning') {
        console.warn('⚠️ Avertissements système:', healthStatus.issues);
        healthStatus.issues.forEach(issue => {
            toast.warning(issue);
        });
    }

    const encryptor = createLocalEncryptor();
    const gemini = createGeminiService({ encryptor, toast });
    const ollama = createOllamaService({ toast });
    const journalStore = createJournalStore('communicationJournal', toast);
    const notifications = createNotificationManager();

    // --- NOUVELLE UI: Initialisation de la Navigation Sidebar ---
    initTheme();
    const navManager = createNavigationManager();
    const commandPalette = createCommandPalette({ navigation: navManager, toast });

    // --- Gestion Sidebar Mobile ---
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const fab = document.getElementById('fab');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar?.classList.remove('open');
        });
    }

    // Navigation items
    document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navManager.navigateTo(page);
        });
    });

    // FAB (Mobile) - Nouvelle analyse rapide
    if (fab) {
        fab.addEventListener('click', () => {
            navManager.navigateTo('analyzer-quick');
        });
    }

    // Bouton "Nouvelle Analyse" dans sidebar
    const quickAnalyzeBtn = document.querySelector('.quick-action-btn');
    if (quickAnalyzeBtn) {
        quickAnalyzeBtn.addEventListener('click', () => {
            navManager.navigateTo('analyzer-quick');
        });
    }

    // --- Page Header Buttons: Search & Notifications ---
    // Search button (opens Command Palette)
    const searchButton = document.querySelector('.page-actions button:nth-of-type(1)');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            commandPalette.open();
        });
    }

    // Notifications button - Opens Notifications Panel
    const notificationsButton = document.querySelector('.page-actions button:nth-of-type(2)');
    if (notificationsButton) {
        // Update badge on init
        notifications.updateBadge();

        notificationsButton.addEventListener('click', () => {
            openNotificationsPanel();
        });
    }

    // Add sample notifications
    notifications.add({
        type: notifications.TYPES.TIP,
        title: 'Astuce',
        message: 'Utilisez ⌘K pour ouvrir la palette de commande.',
        dismissible: true,
    });
    notifications.add({
        type: notifications.TYPES.FEATURE,
        title: 'Nouveau',
        message: 'Vous pouvez maintenant tester les providers IA.',
        dismissible: true,
    });

    // Add sample notifications
    notifications.add({
        type: notifications.TYPES.SUCCESS,
        title: 'Bienvenue !',
        message: 'Votre tableau de bord est prêt.',
        dismissible: true,
    });
    notifications.add({
        type: notifications.TYPES.TIP,
        title: 'Astuce',
        message: 'Utilisez ⌘K pour ouvrir la palette de commande.',
        dismissible: true,
    });


    // Notifications Panel Modal
    function openNotificationsPanel() {
        const allNotifications = notifications.getAll();
        const unreadCount = notifications.getUnreadCount();

        if (allNotifications.length === 0) {
            toast.info('📬 Aucune notification pour le moment.');
            return;
        }

        const notificationsList = allNotifications
            .map(
                (notif) => `
                    <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-notif-id="${notif.id}">
                        <div class="notification-header">
                            <span class="notification-icon">${notifications.getIcon(notif.type)}</span>
                            <div class="notification-meta">
                                <h4 class="notification-title">${escapeHTML(notif.title)}</h4>
                                <span class="notification-time">${notifications.formatTime(notif.timestamp)}</span>
                            </div>
                            ${ 
                                notif.dismissible
                                    ? `<button type="button" class="notification-dismiss" data-notif-id="${notif.id}" title="Supprimer">×</button>`
                                    : ''
                            }
                        </div>
                        <p class="notification-message">${escapeHTML(notif.message)}</p>
                    </div>
                `,
            )
            .join('');

        const html = `
            <div class="space-y-2">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Notifications (${unreadCount} non lues)</h3>
                    ${ 
                        unreadCount > 0
                            ? '<button type="button" class="text-xs text-blue-600 dark:text-blue-400 hover:underline" id="mark-all-read">Tout marquer comme lu</button>'
                            : ''
                    }
                </div>
                <div class="notifications-list space-y-2 max-h-96 overflow-y-auto">
                    ${notificationsList}
                </div>
            </div>
        `;

        modal.show({
            targetId: 'journal-modal',
            title: '🔔 Notifications',
            html,
            actions: [
                {
                    label: 'Réinitialiser démo',
                    onClick: () => {
                        notifications.resetToDefaults();
                        modal.hide('journal-modal');
                        toast.info('Notifications réinitialisées.');
                        setTimeout(() => openNotificationsPanel(), 300);
                    },
                },
                {
                    label: 'Fermer',
                    onClick: () => modal.hide('journal-modal'),
                },
            ],
        });

        // Event listeners for notification actions
        setTimeout(() => {
            document.querySelectorAll('.notification-dismiss').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const notifId = btn.getAttribute('data-notif-id');
                    notifications.dismiss(notifId);
                    btn.closest('.notification-item').style.opacity = '0.5';
                    btn.closest('.notification-item').style.pointerEvents = 'none';
                });
            });

            document.getElementById('mark-all-read')?.addEventListener('click', () => {
                notifications.markAllAsRead();
                setTimeout(() => openNotificationsPanel(), 200);
            });

            document.querySelectorAll('.notification-item').forEach((item) => {
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.notification-dismiss')) return;
                    const notifId = item.getAttribute('data-notif-id');
                    notifications.markAsRead(notifId);
                    item.classList.remove('unread');
                    item.classList.add('read');
                });
            });
        }, 0);
    }

    // --- ANCIENNE NAVIGATION: Compatibilité ---
    const navigation = {
        navigateTo: (page) => navManager.navigateTo(page),
    };

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

    const quickAnalyzerModule = createQuickAnalyzer({
        rootId: 'quick-root',
        store: journalStore,
        toast,
        gemini,
        ollama,
        modal,
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

    const dojo = createDojoSimulator({ modal, toast });
    const guideModule = createGuideModule({
        rootId: 'guide-root',
        toast,
        dojo,
        modal,
    });

    // Module Insights (stub - à développer)
    const insightsModule = {
        render: () => {
            const root = document.getElementById('insights-root');
            if (!root) return;
            root.innerHTML =
                `
                <div class="space-y-6">
                    <h2 class="text-2xl font-bold">Mes Insights</h2>
                    <div class="card">
                        <p class="text-slate-600 dark:text-slate-400">
                            Agrégation de tes insights personnels à venir...
                        </p>
                    </div>
                </div>
            `;
        },
    };

    // Render initial pages (lazy load sur sidebar click)
    homeModule.render();
    manualModule.render();
    journalModule.render();
    quickAnalyzerModule.render();
    aiModule.render();
    guideModule.render();
    insightsModule.render();

    // Restaurer la dernière page visitée
    navManager.restoreLastPage();

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

});
// --- Modules & Stores ---

// 🔥 MODULE AMÉLIORÉ : Analyse Manuelle (Autosave + Validation)
function createManualAnalyzer({ rootId, store, toast, onSaved }) {
    const root = document.getElementById(rootId);
    if (!root) return { render: () => {} };

    const AUTOSAVE_KEY = 'boite-outils-manual-draft';
    
    const egoOptions = ["La Défensive", "Le Sauveur", "Le Martyr", "Le Dernier Mot", "Le Refus d'influence"];
    
    const steps = [
        {
            id: 'context',
            title: '1. Constat',
            description: 'Capture le contexte brut avant de le re-écrire ou le juger.',
            fields: [
                { name: 'context', label: 'Qu’est-ce qui s’est passé ?', type: 'textarea', placeholder: "Décris la scène telle qu'elle s'est déroulée...", required: true },
                { name: 'partnerSignal', label: 'Quel a été le signal / trigger ?', type: 'textarea', placeholder: 'Phrase, regard, ton de voix...', required: true },
            ]
        },
        {
            id: 'ego',
            title: '2. Ego Radar',
            description: "Identifie l ego dominant pour pouvoir le désamorcer.",
            fields: [
                { name: 'egoFocus', label: "Quel type d'ego s'est activé ?", type: 'select', options: egoOptions, required: true },
                { name: 'triggerNeed', label: 'Quel besoin personnel n’a pas été nourri ?', type: 'textarea', placeholder: 'Reconnaissance, soutien, sécurité...', required: true },
            ]
        },
        {
            id: 'response',
            title: '3. MVP de réponse',
            description: 'Dessine la réponse que tu aurais aimé livrer.',
            fields: [
                { name: 'alternativeResponse', label: 'Quelle réponse MVP veux-tu tester ?', type: 'textarea', placeholder: 'Rédige la réponse idéale...', required: true },
                { name: 'validation', label: 'Comment valider sa frustration ?', type: 'textarea', placeholder: "Ex: \"Je comprends que tu...\"", required: true },
            ]
        },
        {
            id: 'action',
            title: '4. Action & Insight',
            description: 'Programme la suite et capture l enseignement clé.',
            fields: [
                { name: 'actionPlan', label: 'Quel est ton plan d’action concret ?', type: 'textarea', placeholder: 'Message à envoyer, rituel à planifier...', required: true },
                { name: 'insight', label: 'Insight clé à retenir ?', type: 'textarea', placeholder: 'Le bug racine, l aler te à surveiller...', required: false },
            ]
        }
    ];

    const state = {
        stepIndex: 0,
        values: {
            context: '', partnerSignal: '', egoFocus: '', triggerNeed: '',
            alternativeResponse: '', validation: '', actionPlan: '', insight: '',
        },
    };

    // 🔄 RESTAURATION BROUILLON (Auto-restore)
    function restoreDraft() {
        try {
            const draft = sessionStorage.getItem(AUTOSAVE_KEY);
            if (draft) {
                const parsed = JSON.parse(draft);
                // Restaure seulement si le brouillon a moins de 24h
                if (Date.now() - parsed.timestamp < 86400000) {
                    state.values = { ...state.values, ...parsed.values };
                    state.stepIndex = parsed.stepIndex || 0;
                    toast.info('📝 Brouillon restauré automatiquement.');
                }
            }
        } catch (e) { console.debug('Pas de brouillon'); }
    }

    let delegatedListenerAttached = false;

    function attachDelegatedListeners() {
        if (delegatedListenerAttached) return;
        delegatedListenerAttached = true;

        // Input Delegation + Autosave
        root.addEventListener('input', (event) => {
            const target = event.target;
            if (!target.name) return;
            
            // Enlever la classe d erreur visuelle si l utilisateur commence à taper
            if (target.classList.contains('invalid')) {
                target.classList.remove('invalid');
            }

            state.values[target.name] = target.value;

            if (target.tagName === 'TEXTAREA') autoResizeTextarea(target);

            // 💾 SAUVEGARDE AUTO (SessionStorage)
            sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
                values: state.values,
                stepIndex: state.stepIndex,
                timestamp: Date.now()
            }));
        });

        // Navigation Buttons Delegation
        root.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            
            if (action === 'prev') {
                if (state.stepIndex > 0) {
                    state.stepIndex -= 1;
                    render();
                }
            } else if (action === 'next') {
                if (validateCurrentStep()) {
                    state.stepIndex += 1;
                    render();
                }
            } else if (action === 'save') {
                if (validateAllSteps()) saveEntry();
            }
        });
    }

    function render() {
        const currentStep = steps[state.stepIndex];
        if (!currentStep) return;

        root.innerHTML =
            `
            <div class="space-y-8">
                <header class="space-y-2">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Analyse Manuelle</h2>
                    <p class="text-slate-600 dark:text-slate-400">
                        Transforme ta crise en plan d'action. (Étape ${state.stepIndex + 1}/${steps.length})
                    </p>
                </header>

                <div class="stepper">
                    ${steps.map((step, index) => `
                        <div class="stepper-item ${index === state.stepIndex ? 'active' : ''}">
                            <span class="stepper-index">${index + 1}</span>
                            <div class="font-semibold hidden sm:block">${step.title}</div>
                        </div>
                    `).join('')}
                </div>

                <form id="manual-form" class="space-y-6">
                    <h3 class="text-xl font-semibold text-slate-800 dark:text-slate-200">${currentStep.title}</h3>
                    <p class="text-sm text-slate-500 mb-4">${currentStep.description}</p>
                    ${currentStep.fields.map(field => renderField(field, state.values[field.name] || '')).join('')}
                </form>

                <div class="wizard-actions">
                    <button type="button" class="btn btn-secondary" data-action="prev" ${state.stepIndex === 0 ? 'disabled' : ''}>
                        ← Retour
                    </button>
                    ${state.stepIndex < steps.length - 1
                        ? `<button type="button" class="btn btn-primary" data-action="next">Suivant →</button>`
                        : `<button type="button" class="btn btn-primary" data-action="save">💾 Sauvegarder</button>`
                    }
                </div>
            </div>
        `;

        root.querySelectorAll('textarea').forEach(autoResizeTextarea);
        attachDelegatedListeners();
    }

    function renderField(field, value) {
        // Ajout de l attribut data-required pour le CSS
        const reqAttr = field.required ? 'data-required="true"' : '';
        // Classes communes
        const commonClasses = "form-input w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none";
        
        let inputHtml = '';
        if (field.type === 'select') {
            inputHtml = `
                <select id="${field.name}" name="${field.name}" class="form-select ${commonClasses}">
                    <option value="">Sélectionne une option</option>
                    ${field.options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>`;
        } else {
            inputHtml = `
                <textarea id="${field.name}" name="${field.name}" class="form-textarea ${commonClasses}" placeholder="${field.placeholder || ''}">${value || ''}</textarea>`;
        }

        return `
            <div class="form-group mb-4">
                <label for="${field.name}" class="form-label font-medium block mb-2 text-slate-700 dark:text-slate-300" ${reqAttr}>
                    ${escapeHTML(field.label)}
                </label>
                ${inputHtml}
            </div>
        `;
    }

    // 🔍 VALIDATION VISUELLE
    function validateCurrentStep() {
        const currentStep = steps[state.stepIndex];
        let isValid = true;
        let firstError = null;

        currentStep.fields.forEach(field => {
            // Vérifie si champ requis est vide
            if (field.required && !state.values[field.name]?.trim()) {
                isValid = false;
                const el = root.querySelector(`[name="${field.name}"]`);
                if (el) {
                    el.classList.add('invalid'); // Déclenche l animation CSS 'shake'
                    if (!firstError) firstError = el;
                }
            }
        });

        if (!isValid) {
            toast.error('Merci de remplir les champs obligatoires.');
            firstError?.focus();
        }
        return isValid;
    }

    function validateAllSteps() { 
        return validateCurrentStep(); 
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
            toast.success('Analyse sauvegardée avec succès.');
            // 🧹 NETTOYAGE: On supprime le brouillon après sauvegarde réussie
            sessionStorage.removeItem(AUTOSAVE_KEY);
            resetState();
            render();
            onSaved?.(entry);
        } else {
            toast.error('Erreur de sauvegarde.');
        }
    }

    function resetState() {
        state.stepIndex = 0;
        Object.keys(state.values).forEach(key => state.values[key] = '');
    }

    function buildSummary(values) {
        return [
            `Contexte : ${values.context}`,
            `Signal perçu : ${values.partnerSignal}`,
            `Ego activé : ${values.egoFocus}`,
            `Besoin associé : ${values.triggerNeed}`,
            `Réponse MVP : ${values.alternativeResponse}`,
            `Validation : ${values.validation}`,
            `Plan d action : ${values.actionPlan}`,
            values.insight ? `Insight : ${values.insight}` : null,
        ].filter(Boolean).join('\n\n');
    }
    
    // Initialisation
    restoreDraft();
    render(); 
    
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
        { id: "Le Refus d influence", label: "Refus d influence" },
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

        root.innerHTML =
            `
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
                // 🔴 CRITICAL: Ask for confirmation before clearing ALL data
                modal.show({
                    targetId: 'journal-modal',
                    title: '⚠️ Vider complètement le journal ?',
                    html: `<p>Tu vas supprimer <strong>${entries.length} entrées</strong> de manière irréversible.</p>
                           <p class="mt-2 text-sm text-slate-500">Cette action ne peut pas être annulée.</p>`,
                    actions: [
                        { label: 'Annuler', variant: 'secondary', onClick: () => modal.hide('journal-modal') },
                        { label: 'Vider le journal', variant: 'primary', onClick: () => {
                            clearJournal();
                            modal.hide('journal-modal');
                        }}
                    ]
                });
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

                // 🔴 SECURITY: Strict validation of imported data
                let validated;
                try {
                    validated = validateImportedData(parsed);
                } catch (validationError) {
                    throw new Error(`Validation JSON échouée: ${validationError.message}`);
                }

                const imported = store.importEntries(validated);
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
        // 🔴 CRITICAL: Confirmation is now done in handleAction before calling this function
        store.clear();
        toast.error('Journal vidé. Aucune sauvegarde disponible.');
        render();
        onChange?.();
    }

    function renderEmptyState(totalEntries) {
        if (totalEntries === 0) {
            return `
                <div class="journal-empty">
                    <h3 class="text-lg font-semibold mb-2">Aucune analyse enregistrée (encore).</h3>
                    <p>Capture ta prochaine dispute pour transformer l ego en insight exploitable.</p>
                    <button type="button" data-action="start-analysis">Commencer une analyse</button>
                </div>
            `;
        }

        return `
            <div class="journal-empty">
                <h3 class="text-lg font-semibold mb-2">Aucun résultat pour ce filtre.</h3>
                <p>Essaie un autre type d ego pour revoir toutes tes entrées.</p>
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

    let eventsBound = false;

    function render() {
        const entries = store.getAll();
        const stats = calculateJournalStats(entries);

        root.innerHTML =
            `
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
                            <button type="button" class="btn btn-primary text-sm" data-navigate="analyzer-manual">
                                📝 Nouvelle analyse
                            </button>
                            <button type="button" class="btn btn-secondary text-sm" data-navigate="analyzer-ai">
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
                                ? '<p class="text-sm text-slate-500 dark:text-slate-400">Aucun insight enregistré pour l instant.</p>'
                                : stats.latestEntries
                                      .map(
                                          (
                                              entry,
                                          ) => `
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
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Raccourcis d intervention</h3>
                    <div class="grid gap-2 sm:grid-cols-2">
                        ${[
                            {
                                label: 'Plan d urgence (Pause)',
                                body: 'Respiration, cadrage, script radicaux de validation.',
                                target: 'analyzer-quick',
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
                                body: 'Utilise l IA pour analyser un message chaud.',
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
                                (
                                    card,
                                ) => `
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

        // 🟠 MEMORY LEAK FIX: Use delegation instead of adding listeners in loop
        if (!eventsBound) {
            root.addEventListener('click', (event) => {
                const button = event.target.closest('[data-toast]');
                if (!button) return;
                const message = button.getAttribute('data-toast');
                if (message) toast.info(message);
            });
            eventsBound = true;
        }
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

            // 🔴 SECURITY: Sanitize prompt before sending to Gemini API
            let sanitized;
            try {
                sanitized = sanitizePrompt(text);
            } catch (error) {
                throw createError('INVALID_PROMPT', `Validation du prompt échouée: ${error.message}`);
            }

            const cooldownUntil = getCooldownTimestamp();
            if (cooldownUntil) {
                throw createError('COOLDOWN', 'Quota Gemini en pause.', {
                    cooldownUntil,
                });
            }

            const apiKey = await decryptKey();
            const requestBody = buildGeminiRequest(sanitized);
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
                throw createError('NETWORK', "L appel Gemini a échoué.", { cause: error });
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

        // 🔴 SECURITY: Sanitize prompt before sending to API
        let sanitized;
        try {
            sanitized = sanitizePrompt(text);
        } catch (error) {
            throw new Error(`Validation du prompt échouée: ${error.message}`);
        }

        const config = getConfig();
        const url = `${config.endpoint}/api/generate`;

        const requestBody = {
            model: config.model,
            prompt: `${GEMINI_SYSTEM_PROMPT}\n\nUtilisateur: ${sanitized}`,
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
            throw new Error(`Impossible de contacter Ollama sur ${config.endpoint}. Assure-toi qu Ollama est lancé.`);
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
    let eventsBound = false;

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
                ? `<p class="text-xs text-amber-500">Pause jusqu à ${formatCountdown(geminiStatus.cooldown)}</p>`
                : '';
            statusInfo = `${statusBadge}${cooldownInfo}`;
            configButtons = '<button type="button" class="btn btn-secondary text-sm" data-action="configure-gemini">⚙️ Config Gemini</button>';
        } else if (currentProvider === 'ollama') {
            statusInfo = `<span class="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                    🤖 Ollama • ${ollamaConfig.model}
               </span>
               <p class="text-xs text-slate-500">${ollamaConfig.endpoint}</p>`;
            configButtons = '<button type="button" class="btn btn-secondary text-sm" data-action="configure-ollama">⚙️ Config Ollama</button>';
        } else {
            statusInfo = `<span class="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                    📊 Analyse locale (heuristique)
               </span>
               <p class="text-xs text-slate-500">Aucune IA externe • Gratuit</p>`;
        }

        root.innerHTML =
            `
            <div class="space-y-6">
                <header class="space-y-3">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Analyse IA</h2>
                    <p class="text-slate-600 dark:text-slate-400 text-sm">
                        Parse un message ou une situation pour obtenir des scripts prêts à l emploi.
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
                            <button type="button" class="btn btn-secondary text-sm" data-action="test-provider" title="Tester si ce provider fonctionne">
                                🧪 Tester
                            </button>
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
                            Glisse-dépose une capture (optionnel) — la fonctionnalité multimodale arrive avec l API Gemini.
                        </p>
                        <input type="file" accept="image/*" data-file-input class="hidden" multiple>
                        <button type="button" class="journal-card-button mt-3" data-action="trigger-file">
                            📎 Ajouter des images
                        </button>
                        <div data-thumbnails class="flex gap-3 flex-wrap mt-3"></div>
                    </div>

                    <div class="flex flex-wrap gap-3">
                        <button type="button" class="btn btn-primary" data-action="analyze">
                            <span class="analyze-label">Analyser la situation</span>
                        </button>
                        <button type="button" class="btn btn-secondary" data-action="reset">
                            Réinitialiser
                        </button>
                    </div>
                </section>

                <section id="ai-results" class="ai-results hidden"></section>
            </div>
        `;

        const textarea = root.querySelector('#ai-input');
        autoResizeTextarea(textarea);

        // 🟠 MEMORY LEAK FIX: Attach event listeners once using delegation
        if (!eventsBound) {
            // Provider selector
            root.addEventListener('change', (event) => {
                if (event.target.id === 'ai-provider-select') {
                    setAIProvider(event.target.value);
                    render();
                }
            });

            // Textarea input with delegation
            root.addEventListener('input', (event) => {
                if (event.target.id === 'ai-input') {
                    autoResizeTextarea(event.target);
                }
            });

            const dropzone = root.querySelector('[data-dropzone]');

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
                        root.querySelector('[data-file-input]')?.click();
                        break;
                    case 'analyze':
                        analyze();
                        break;
                    case 'reset':
                        // 🔴 CRITICAL: Ask for confirmation if textarea has content
                        if (textarea.value.trim()) {
                            modal.show({
                                targetId: 'ai-modal',
                                title: '⚠️ Réinitialiser l analyse ?',
                                html: `<p>Tu vas perdre ton message en cours.</p>
                                       <p class="mt-2 text-sm text-slate-500">Les images seront aussi supprimées.</p>`,
                                actions: [
                                    { label: 'Annuler', variant: 'secondary', onClick: () => modal.hide('ai-modal') },
                                    { label: 'Réinitialiser', variant: 'primary', onClick: () => {
                                        reset();
                                        modal.hide('ai-modal');
                                        toast.info('Analyse réinitialisée.');
                                    }}
                                ]
                            });
                        } else {
                            reset();
                        }
                        break;
                    case 'configure-gemini':
                        openGeminiModal();
                        break;
                    case 'configure-ollama':
                        openOllamaModal();
                        break;
                    case 'test-provider':
                        testProvider();
                        break;
                    default:
                        break;
                }
            });

            root.querySelector('[data-file-input]')?.addEventListener('change', (event) => {
                const files = Array.from(event.target.files || []);
                previewFiles(files);
            });

            eventsBound = true;
        }

        function previewFiles(files) {
            if (!files.length) return;
            thumbnails.innerHTML = files
                .slice(0, 4)
                .map(
                    (
                        file,
                    ) => `
                        <span class="badge">${escapeHTML(file.name)}</span>
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

                setResult(result, text);
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
                    toast.info('Configure la clé Gemini pour activer l IA.');
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
                    toast.warning('Réponse Gemini inattendue. Utilisation de l heuristique.');
                    break;
            }
        }
    }
}

/**
 * Toast Manager - Gestion centralisée des notifications
 */
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

/**
 * Modal Manager - Gestion centralisée des modales
 * API standardisée: show() et hide()
 */
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