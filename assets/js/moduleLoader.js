'use strict';

/**
 * ModuleLoader: Manages lazy loading and module dependencies
 * Enables code splitting by dynamically loading feature modules on demand
 */
const ModuleLoader = (() => {
    const registry = new Map();
    const loadedModules = new Map();
    const loadingPromises = new Map();

    /**
     * Register a module definition
     * @param {string} name - Module identifier
     * @param {Function} factory - Function that creates/initializes the module
     * @param {Object} options - Module options
     *   - {Array<string>} dependencies - List of module names to load first
     *   - {string} file - Path to external JS file (for lazy loading)
     *   - {boolean} singleton - Only instantiate once (default: true)
     */
    function register(name, factory, options = {}) {
        registry.set(name, {
            factory,
            dependencies: options.dependencies || [],
            file: options.file || null,
            singleton: options.singleton !== false,
            factory: factory
        });
    }

    /**
     * Load a module by name, including dependencies
     * @param {string} name - Module name to load
     * @param {Object} context - Context to pass to module factory
     * @returns {Promise} Resolves to loaded module
     */
    async function load(name, context = {}) {
        if (!registry.has(name)) {
            throw new Error(`Module not registered: ${name}`);
        }

        // Return cached singleton
        if (loadedModules.has(name)) {
            return loadedModules.get(name);
        }

        // Return in-progress promise to avoid duplicate loads
        if (loadingPromises.has(name)) {
            return loadingPromises.get(name);
        }

        const def = registry.get(name);
        const loadPromise = loadModule(name, def, context);
        loadingPromises.set(name, loadPromise);

        try {
            const module = await loadPromise;
            loadingPromises.delete(name);
            return module;
        } catch (error) {
            loadingPromises.delete(name);
            throw error;
        }
    }

    /**
     * Internal module loading logic
     */
    async function loadModule(name, def, context) {
        // Load external file if specified
        if (def.file) {
            await loadScript(def.file);
        }

        // Load dependencies first
        for (const depName of def.dependencies) {
            await load(depName, context);
        }

        // Execute module factory
        const module = def.factory(context);

        // Cache if singleton
        if (def.singleton) {
            loadedModules.set(name, module);
        }

        return module;
    }

    /**
     * Dynamically load external JavaScript file
     */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Load multiple modules in parallel
     */
    async function loadAll(names, context = {}) {
        return Promise.all(names.map(name => load(name, context)));
    }

    /**
     * Get already loaded module (synchronous)
     */
    function get(name) {
        return loadedModules.get(name) || null;
    }

    /**
     * Check if module is loaded
     */
    function isLoaded(name) {
        return loadedModules.has(name);
    }

    /**
     * Clear specific module cache
     */
    function clear(name) {
        loadedModules.delete(name);
    }

    /**
     * Clear all module cache
     */
    function clearAll() {
        loadedModules.clear();
        registry.clear();
    }

    return {
        register,
        load,
        loadAll,
        get,
        isLoaded,
        clear,
        clearAll,
        registry // For debugging
    };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ModuleLoader = ModuleLoader;
}
