'use strict';

/**
 * Module Registry: Defines all modules and their dependencies
 * Organizes modules into Core (always loaded) and Feature (lazy loaded) groups
 */
const moduleRegistry = {
    // ===== CORE MODULES (Always loaded on page init) =====
    core: [
        'app-constants',
        'app-event-manager',
        'app-loading',
        'security',
        'icon-renderer',
        'iconSystem'
    ],

    // ===== UI FRAMEWORK (Always loaded, needed for all pages) =====
    framework: [
        'navigationManager',
        'commandPalette',
        'notificationManager',
        'keyboardAccessibility',
        'onboarding',
        'footerEnhancements'
    ],

    // ===== FEATURE BUNDLES (Lazy loaded by feature/page) =====
    features: {
        'quickAnalyzer': {
            modules: ['quickAnalyzer', 'dojoSimulator'],
            page: 'analyzer-quick',
            preload: true // Load when app starts, user likely to use this
        },
        'journal': {
            modules: ['journalStore', 'localEncryptor'],
            page: 'journal',
            preload: false
        },
        'aiAnalysis': {
            modules: ['conceptLibrary', 'gottmanPatterns', 'couplePatterns', 'attachmentStyles'],
            page: 'analyzer-ai',
            preload: false
        },
        'guide': {
            modules: ['conceptLibrary', 'gottmanPatterns', 'couplePatterns', 'attachmentStyles'],
            page: 'guide',
            preload: false
        },
        'insights': {
            modules: ['journalStore'],
            page: 'insights',
            preload: false
        }
    },

    /**
     * Get all modules that should be loaded initially
     */
    getInitialModules() {
        return [...this.core, ...this.framework];
    },

    /**
     * Get preload modules (loaded early but not on initial load)
     */
    getPreloadModules() {
        return Object.values(this.features)
            .filter(f => f.preload)
            .flatMap(f => f.modules);
    },

    /**
     * Get modules for a specific page/feature
     */
    getFeatureModules(featureName) {
        return this.features[featureName]?.modules || [];
    },

    /**
     * Get feature by page name
     */
    getFeatureByPage(page) {
        return Object.entries(this.features).find(
            ([_, feature]) => feature.page === page
        )?.[0];
    },

    /**
     * Check if feature modules are already loaded
     */
    isFeatureLoaded(featureName) {
        const modules = this.getFeatureModules(featureName);
        return modules.every(name => ModuleLoader.isLoaded(name));
    }
};

// Export for use
if (typeof window !== 'undefined') {
    window.moduleRegistry = moduleRegistry;
}
