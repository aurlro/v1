/**
 * Keyboard Accessibility Module
 * Gère la navigation au clavier et les raccourcis globaux
 */

function createKeyboardAccessibilityModule({ modal, commandPalette, navManager }) {
    /**
     * Initialise l'accessibilité clavier globale
     */
    function init() {
        // Gestion globale des touches
        document.addEventListener('keydown', handleGlobalKeyDown);

        // Améliorer le focus visible sur tous les éléments interactifs
        ensureFocusVisibility();

        // Gestion de l'Escape pour fermer les modales
        document.addEventListener('keydown', handleEscapeKey);

        // Tab navigation
        setupTabNavigation();

        console.debug('✅ Accessibilité clavier initialisée');
    }

    /**
     * Gère les touches globales
     */
    function handleGlobalKeyDown(event) {
        // ⌘K ou Ctrl+K pour ouvrir la command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            commandPalette?.open?.();
        }

        // ? pour afficher l'aide (raccourcis clavier)
        if (event.key === '?' && !isInputFocused()) {
            event.preventDefault();
            showKeyboardHelp();
        }

        // Alt+N pour nouvelle analyse
        if ((event.altKey || event.ctrlKey) && event.key === 'n') {
            event.preventDefault();
            navManager?.navigateTo?.('analyzer-quick');
        }

        // Alt+J pour aller au journal
        if ((event.altKey || event.ctrlKey) && event.key === 'j') {
            event.preventDefault();
            navManager?.navigateTo?.('journal');
        }
    }

    /**
     * Vérifie si un input est focusé
     */
    function isInputFocused() {
        const activeTag = document.activeElement?.tagName;
        return activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
    }

    /**
     * Gère la touche Escape
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            // Fermer une modal si elle est ouverte
            const openModals = document.querySelectorAll('[role="dialog"]:not(.hidden)');
            if (openModals.length > 0) {
                const lastModal = openModals[openModals.length - 1];
                const closeBtn = lastModal.querySelector('[data-modal-close]');
                closeBtn?.click?.();
            }
        }
    }

    /**
     * Améliore la visibilité du focus sur tous les éléments interactifs
     */
    function ensureFocusVisibility() {
        const interactiveSelectors = [
            'button', 'a', 'input', 'textarea', 'select',
            '[role="button"]', '[role="tab"]', '[data-scenario-id]'
        ];

        interactiveSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Ajouter tabindex si absent
                if (!el.hasAttribute('tabindex') && el.tabIndex === -1) {
                    el.setAttribute('tabindex', '0');
                }
            });
        });
    }

    /**
     * Configure la navigation au Tab
     */
    function setupTabNavigation() {
        // Les navigateurs gèrent déjà la navigation au Tab
        // Ici on peut ajouter des logiques personnalisées si nécessaire

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                // Marquer que l'utilisateur utilise le clavier pour afficher les focus visibles
                document.body.classList.add('keyboard-nav');
            }
        });

        // Retire la classe keyboard-nav au clic de souris
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    /**
     * Affiche l'aide des raccourcis clavier
     */
    function showKeyboardHelp() {
        if (!modal) return;

        const shortcuts = [
            { key: '⌘K / Ctrl+K', action: 'Ouvrir la command palette' },
            { key: 'Ctrl+N / Alt+N', action: 'Nouvelle analyse rapide' },
            { key: 'Ctrl+J / Alt+J', action: 'Aller au journal' },
            { key: 'Escape', action: 'Fermer les modales' },
            { key: '?', action: 'Afficher cette aide' },
            { key: 'Tab', action: 'Naviguer entre les éléments' },
            { key: 'Enter/Space', action: 'Activer un bouton/lien' }
        ];

        const html = `
            <div class="space-y-4">
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Voici les raccourcis clavier disponibles:
                </p>
                <div class="space-y-3">
                    ${shortcuts.map(({ key, action }) => `
                        <div class="flex items-center gap-4 p-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <kbd class="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded text-sm font-mono min-w-32 text-center">
                                ${key}
                            </kbd>
                            <span class="text-sm text-slate-700 dark:text-slate-300">${action}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.show({
            targetId: 'help-modal',
            title: '⌨️ Raccourcis Clavier',
            html,
            actions: [
                {
                    label: 'Fermer',
                    variant: 'secondary',
                    onClick: () => modal.hide('help-modal')
                }
            ]
        });
    }

    return { init, showKeyboardHelp };
}
