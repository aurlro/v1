'use strict';

/**
 * Translation Loader
 * Loads translation files and initializes i18n
 */
const TranslationLoader = (() => {
    const TRANSLATION_PATH = 'assets/js/translations';
    const DEFAULT_LANGUAGE = 'fr';

    /**
     * Load translation file
     */
    async function loadTranslation(lang) {
        try {
            const response = await fetch(`${TRANSLATION_PATH}/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${lang}.json: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading translation file for "${lang}":`, error);
            return null;
        }
    }

    /**
     * Load multiple translations
     */
    async function loadTranslations(languages = ['fr', 'en']) {
        const translations = {};

        for (const lang of languages) {
            console.log(`📖 Loading translation: ${lang}`);
            const data = await loadTranslation(lang);
            if (data) {
                translations[lang] = data;
            }
        }

        return translations;
    }

    /**
     * Initialize i18n with all translations
     * Detects user's preferred language and sets it
     */
    async function initialize(languages = ['fr', 'en'], options = {}) {
        try {
            console.log('🌍 Initializing internationalization system...');

            // Load all translation files
            const translations = await loadTranslations(languages);

            if (Object.keys(translations).length === 0) {
                console.warn('No translations loaded');
                return false;
            }

            // Determine initial language
            let initialLang = options.defaultLanguage || DEFAULT_LANGUAGE;

            if (options.detectBrowser) {
                initialLang = i18n.getBrowserLanguage() || initialLang;
            } else {
                initialLang = i18n.getSavedLanguage() || initialLang;
            }

            // Initialize i18n system
            i18n.init(translations, initialLang);

            // Setup language change event listener if provided
            if (options.onLanguageChange) {
                window.addEventListener('languageChanged', (e) => {
                    options.onLanguageChange(e.detail.language);
                });
            }

            console.log(`✅ i18n initialized successfully`);
            return true;
        } catch (error) {
            console.error('Failed to initialize i18n:', error);
            return false;
        }
    }

    /**
     * Create language switcher UI
     */
    function createLanguageSwitcher() {
        const languages = i18n.getAvailableLanguages();
        const currentLang = i18n.getLanguage();

        const container = document.createElement('div');
        container.className = 'language-switcher';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Language selector');

        languages.forEach(lang => {
            const button = document.createElement('button');
            button.className = `language-btn ${lang === currentLang ? 'active' : ''}`;
            button.textContent = lang.toUpperCase();
            button.setAttribute('title', `Switch to ${lang}`);
            button.setAttribute('aria-pressed', lang === currentLang);

            button.addEventListener('click', () => {
                i18n.setLanguage(lang);
                updateLanguageSwitcher();
            });

            container.appendChild(button);
        });

        return container;
    }

    /**
     * Update language switcher active state
     */
    function updateLanguageSwitcher() {
        const buttons = document.querySelectorAll('.language-btn');
        const currentLang = i18n.getLanguage();

        buttons.forEach(btn => {
            const isActive = btn.textContent.toLowerCase() === currentLang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
    }

    /**
     * Translate entire HTML document
     * Scans for elements with data-i18n attributes
     */
    function translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = element.getAttribute('data-i18n-params');
            const paramObj = params ? JSON.parse(params) : {};

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = i18n.t(key, paramObj);
                } else {
                    element.value = i18n.t(key, paramObj);
                }
            } else {
                element.textContent = i18n.t(key, paramObj);
            }
        });

        // Translate title
        const titleKey = document.documentElement.getAttribute('data-i18n-title');
        if (titleKey) {
            document.title = i18n.t(titleKey);
        }

        // Update language attribute
        document.documentElement.lang = i18n.getLanguage();
    }

    /**
     * Watch for language changes and re-translate page
     */
    function enableAutoTranslate() {
        window.addEventListener('languageChanged', () => {
            translatePage();
            console.log('Page translated to:', i18n.getLanguage());
        });
    }

    return {
        initialize,
        loadTranslation,
        loadTranslations,
        createLanguageSwitcher,
        updateLanguageSwitcher,
        translatePage,
        enableAutoTranslate,
        TRANSLATION_PATH
    };
})();

// Export for use
if (typeof window !== 'undefined') {
    window.TranslationLoader = TranslationLoader;
}
