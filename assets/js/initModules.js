'use strict';

/**
 * Module Initialization
 * Registers all modules with ModuleLoader for dependency management
 * Called after DOM content is loaded
 */
function initializeModules() {
    // Register core modules (these are already loaded inline in index.html)
    ModuleLoader.register('app-constants', () => window.STORAGE_KEYS ? { STORAGE_KEYS: window.STORAGE_KEYS } : {});
    ModuleLoader.register('app-event-manager', () => window.EventManager || {});
    ModuleLoader.register('app-loading', () => window.LoadingManager || {});
    ModuleLoader.register('security', () => window.getSystemHealthStatus ? { getSystemHealthStatus: window.getSystemHealthStatus } : {});

    // Register UI framework modules
    ModuleLoader.register('navigationManager', () => window.createNavigationManager, {
        dependencies: ['app-constants', 'app-event-manager']
    });

    ModuleLoader.register('commandPalette', () => window.createCommandPalette, {
        dependencies: ['navigationManager']
    });

    ModuleLoader.register('notificationManager', () => window.createNotificationManager, {
        dependencies: ['app-event-manager']
    });

    ModuleLoader.register('keyboardAccessibility', () => window.createKeyboardAccessibilityModule, {
        dependencies: ['commandPalette', 'navigationManager']
    });

    ModuleLoader.register('onboarding', () => window.createOnboardingModule, {
        dependencies: []
    });

    ModuleLoader.register('footerEnhancements', () => window.initFooterEnhancements || (() => {}), {
        dependencies: []
    });

    // Register feature modules (quick analyzer)
    ModuleLoader.register('quickAnalyzer', () => window.createQuickAnalyzer, {
        dependencies: ['app-event-manager', 'app-loading'],
        singleton: false // New instance each time
    });

    ModuleLoader.register('dojoSimulator', () => window.createDojoSimulator, {
        dependencies: ['navigationManager'],
        singleton: false
    });

    // Register feature modules (journal)
    ModuleLoader.register('journalStore', () => window.createJournalStore, {
        dependencies: ['app-event-manager'],
        singleton: true
    });

    ModuleLoader.register('localEncryptor', () => window.createLocalEncryptor, {
        dependencies: [],
        singleton: true
    });

    // Register feature modules (AI analysis & education)
    ModuleLoader.register('conceptLibrary', () => window.ConceptLibrary || {}, {
        dependencies: [],
        singleton: true
    });

    ModuleLoader.register('gottmanPatterns', () => window.GottmanPatterns || {}, {
        dependencies: ['conceptLibrary'],
        singleton: true
    });

    ModuleLoader.register('couplePatterns', () => window.CouplePatterns || {}, {
        dependencies: ['conceptLibrary'],
        singleton: true
    });

    ModuleLoader.register('attachmentStyles', () => window.AttachmentStyles || {}, {
        dependencies: ['conceptLibrary'],
        singleton: true
    });

    console.log('✅ ModuleLoader initialized with', ModuleLoader.registry.size, 'modules');
}

// Initialize modules when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModules);
} else {
    initializeModules();
}
