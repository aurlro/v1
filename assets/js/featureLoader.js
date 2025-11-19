'use strict';

/**
 * FeatureLoader: Handles lazy loading of feature modules on navigation
 * Intercepts page navigation and loads required modules before rendering
 */
const FeatureLoader = (() => {
    let navManager = null;
    let toast = null;
    const loadingStates = new Map();

    /**
     * Initialize feature loader
     */
    function init({ navigationManager, toastManager }) {
        navManager = navigationManager;
        toast = toastManager;

        // Intercept navigation to load feature modules
        if (navManager) {
            const originalNavigate = navManager.navigateTo;
            navManager.navigateTo = async function(page, options = {}) {
                await loadFeatureForPage(page);
                return originalNavigate.call(this, page, options);
            };
        }
    }

    /**
     * Load feature modules for a page if not already loaded
     */
    async function loadFeatureForPage(page) {
        const featureName = moduleRegistry.getFeatureByPage(page);
        if (!featureName || moduleRegistry.isFeatureLoaded(featureName)) {
            return; // No feature for this page or already loaded
        }

        return loadFeature(featureName);
    }

    /**
     * Load a feature and all its modules
     */
    async function loadFeature(featureName) {
        // Skip if already loading
        if (loadingStates.get(featureName) === 'loading') {
            return waitForFeature(featureName);
        }

        // Skip if already loaded
        if (loadingStates.get(featureName) === 'loaded') {
            return;
        }

        loadingStates.set(featureName, 'loading');

        try {
            const modules = moduleRegistry.getFeatureModules(featureName);
            console.log(`📦 Loading feature: ${featureName}`, modules);

            // Load all feature modules in parallel
            await ModuleLoader.loadAll(modules);

            loadingStates.set(featureName, 'loaded');
            console.log(`✅ Feature loaded: ${featureName}`);
        } catch (error) {
            console.error(`❌ Failed to load feature: ${featureName}`, error);
            loadingStates.set(featureName, 'error');
            if (toast) {
                toast.error(`Impossible de charger la fonctionnalité ${featureName}`);
            }
            throw error;
        }
    }

    /**
     * Wait for a feature to finish loading
     */
    function waitForFeature(featureName) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const state = loadingStates.get(featureName);
                if (state === 'loaded') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (state === 'error') {
                    clearInterval(checkInterval);
                    reject(new Error(`Feature loading failed: ${featureName}`));
                }
            }, 50);
        });
    }

    /**
     * Preload specific features
     */
    async function preload(featureNames) {
        const promises = featureNames.map(name => loadFeature(name));
        return Promise.allSettled(promises);
    }

    /**
     * Get loading state of a feature
     */
    function getState(featureName) {
        return loadingStates.get(featureName) || 'not-loaded';
    }

    return {
        init,
        loadFeature,
        loadFeatureForPage,
        preload,
        getState,
        waitForFeature
    };
})();

if (typeof window !== 'undefined') {
    window.FeatureLoader = FeatureLoader;
}
