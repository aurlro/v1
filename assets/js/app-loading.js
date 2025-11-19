/**
 * Loading Manager - Gestion centralisée des états de chargement
 * Ajoute des spinners et du feedback visuel pendant les opérations async
 */

const LoadingManager = (() => {
    const activeLoadings = new Map(); // Map<element, state>

    /**
     * Active l'état de chargement sur un bouton
     */
    function setButtonLoading(button, isLoading = true) {
        if (!button) return;

        activeLoadings.set(button, isLoading);

        if (isLoading) {
            button.classList.add('is-loading');
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
        } else {
            button.classList.remove('is-loading');
            button.disabled = false;
            button.setAttribute('aria-busy', 'false');
            activeLoadings.delete(button);
        }
    }

    /**
     * Active l'état de chargement sur un input
     */
    function setInputLoading(input, isLoading = true) {
        if (!input) return;

        if (isLoading) {
            input.classList.add('is-loading');
            input.disabled = true;
            input.setAttribute('aria-busy', 'true');
        } else {
            input.classList.remove('is-loading');
            input.disabled = false;
            input.setAttribute('aria-busy', 'false');
        }
    }

    /**
     * Exécute une fonction async avec loading state
     * @param {Function} asyncFn - La fonction async à exécuter
     * @param {HTMLElement} button - Le bouton à mettre en loading
     * @param {Object} callbacks - {onSuccess, onError}
     */
    async function executeWithLoading(asyncFn, button, callbacks = {}) {
        const { onSuccess, onError } = callbacks;

        try {
            setButtonLoading(button, true);
            const result = await asyncFn();
            setButtonLoading(button, false);
            onSuccess?.(result);
            return result;
        } catch (error) {
            setButtonLoading(button, false);
            onError?.(error);
            throw error;
        }
    }

    /**
     * Nettoie tous les états de chargement
     */
    function clearAll() {
        activeLoadings.forEach((isLoading, element) => {
            if (isLoading) {
                if (element.tagName === 'BUTTON') {
                    setButtonLoading(element, false);
                } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                    setInputLoading(element, false);
                }
            }
        });
        activeLoadings.clear();
    }

    return { setButtonLoading, setInputLoading, executeWithLoading, clearAll };
})();
