/**
 * Event Manager - Gestion centralisée des écouteurs d'événements
 * Éviite les memory leaks en gardant trace des listeners
 */

const EventManager = (() => {
    const listeners = new Map(); // Map<target, Map<event, Set<handlers>>>

    /**
     * Enregistre un listener et le suit pour nettoyage
     * @param {EventTarget} target - L'élément cible
     * @param {string} event - Le type d'événement
     * @param {function} handler - Le gestionnaire d'événement
     * @param {object} options - Options addEventListener
     */
    function on(target, event, handler, options = {}) {
        if (!target) return;

        const targetKey = target === document ? 'document' : target;
        if (!listeners.has(targetKey)) {
            listeners.set(targetKey, new Map());
        }

        const eventMap = listeners.get(targetKey);
        if (!eventMap.has(event)) {
            eventMap.set(event, new Set());
        }

        const handlers = eventMap.get(event);
        if (!handlers.has(handler)) {
            handlers.add(handler);
            target.addEventListener(event, handler, options);
        }
    }

    /**
     * Retire un listener spécifique
     */
    function off(target, event, handler, options = {}) {
        if (!target) return;

        const targetKey = target === document ? 'document' : target;
        const eventMap = listeners.get(targetKey);

        if (eventMap && eventMap.has(event)) {
            const handlers = eventMap.get(event);
            if (handlers.has(handler)) {
                handlers.delete(handler);
                target.removeEventListener(event, handler, options);
            }

            if (handlers.size === 0) {
                eventMap.delete(event);
            }
        }

        if (eventMap && eventMap.size === 0) {
            listeners.delete(targetKey);
        }
    }

    /**
     * Retire tous les listeners d'un événement sur une cible
     */
    function offAll(target, event) {
        if (!target) return;

        const targetKey = target === document ? 'document' : target;
        const eventMap = listeners.get(targetKey);

        if (eventMap && eventMap.has(event)) {
            const handlers = eventMap.get(event);
            handlers.forEach(handler => {
                target.removeEventListener(event, handler);
            });
            handlers.clear();
            eventMap.delete(event);
        }
    }

    /**
     * Retire tous les listeners d'une cible
     */
    function clear(target) {
        if (!target) return;

        const targetKey = target === document ? 'document' : target;
        const eventMap = listeners.get(targetKey);

        if (eventMap) {
            eventMap.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    target.removeEventListener(event, handler);
                });
                handlers.clear();
            });
            eventMap.clear();
            listeners.delete(targetKey);
        }
    }

    /**
     * Retire tous les listeners globaux (cleanup complet)
     */
    function clearAll() {
        listeners.forEach((eventMap, targetKey) => {
            const target = targetKey === 'document' ? document : targetKey;
            eventMap.forEach((handlers, event) => {
                handlers.forEach(handler => {
                    target.removeEventListener(event, handler);
                });
            });
        });
        listeners.clear();
    }

    return { on, off, offAll, clear, clearAll };
})();
