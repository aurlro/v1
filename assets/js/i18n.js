'use strict';

/**
 * i18n - Lightweight Internationalization System
 * Manages translations and language switching
 */
const i18n = (() => {
    const STORAGE_KEY = 'app-language';
    const DEFAULT_LANGUAGE = 'fr';
    let currentLanguage = DEFAULT_LANGUAGE;
    let translations = {};

    /**
     * Initialize i18n system with translations
     * @param {Object} translationsMap - Map of language -> translations object
     * @param {string} initialLanguage - Starting language (optional)
     */
    function init(translationsMap, initialLanguage = null) {
        translations = translationsMap;

        // Load saved language or use initial
        const savedLanguage = getSavedLanguage();
        currentLanguage = initialLanguage || savedLanguage || DEFAULT_LANGUAGE;

        // Validate language exists
        if (!translations[currentLanguage]) {
            console.warn(`Language "${currentLanguage}" not found, falling back to "${DEFAULT_LANGUAGE}"`);
            currentLanguage = DEFAULT_LANGUAGE;
        }

        console.log(`✅ i18n initialized with language: ${currentLanguage}`);
        return currentLanguage;
    }

    /**
     * Get translated string
     * Supports nested keys: "section.key" -> translations[lang].section.key
     * @param {string} key - Translation key (e.g., "common.yes", "pages.home.title")
     * @param {Object} params - Variables to interpolate {name: "John"} -> "Hello {name}"
     * @returns {string} Translated string or key if not found
     */
    function t(key, params = {}) {
        const keys = key.split('.');
        let value = translations[currentLanguage];

        // Navigate nested structure
        for (const k of keys) {
            value = value?.[k];
            if (!value) {
                console.warn(`Translation not found: "${key}" in "${currentLanguage}"`);
                return key; // Return key as fallback
            }
        }

        // Interpolate parameters
        let result = value;
        for (const [param, val] of Object.entries(params)) {
            result = result.replace(`{${param}}`, val);
        }

        return result;
    }

    /**
     * Get all translations for current language
     */
    function getAll() {
        return translations[currentLanguage] || {};
    }

    /**
     * Change current language
     */
    function setLanguage(lang) {
        if (!translations[lang]) {
            console.warn(`Language "${lang}" not available`);
            return false;
        }

        currentLanguage = lang;
        saveLanguage(lang);
        console.log(`🌍 Language changed to: ${lang}`);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

        return true;
    }

    /**
     * Get current language
     */
    function getLanguage() {
        return currentLanguage;
    }

    /**
     * Get available languages
     */
    function getAvailableLanguages() {
        return Object.keys(translations);
    }

    /**
     * Check if language is available
     */
    function hasLanguage(lang) {
        return lang in translations;
    }

    /**
     * Save language preference to localStorage
     */
    function saveLanguage(lang) {
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.debug('Cannot save language to localStorage:', e);
        }
    }

    /**
     * Get saved language from localStorage
     */
    function getSavedLanguage() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            console.debug('Cannot read language from localStorage:', e);
            return null;
        }
    }

    /**
     * Get browser's preferred language
     */
    function getBrowserLanguage() {
        const browserLang = navigator.language?.split('-')[0]; // Get language part of locale
        if (browserLang && hasLanguage(browserLang)) {
            return browserLang;
        }
        return DEFAULT_LANGUAGE;
    }

    /**
     * Add or update translations for a language
     * Useful for loading translations dynamically
     */
    function addTranslations(lang, translationsObj) {
        if (!translations[lang]) {
            translations[lang] = {};
        }
        // Deep merge
        Object.assign(translations[lang], translationsObj);
    }

    /**
     * Format a list in the current language
     * e.g., "A, B and C" or "A, B et C" in French
     */
    function formatList(items, conjunction = 'and') {
        if (items.length === 0) return '';
        if (items.length === 1) return items[0];

        const lastItem = items[items.length - 1];
        const otherItems = items.slice(0, -1).join(', ');
        const conjunctionText = t(`common.list.conjunction.${conjunction}`, { fallback: conjunction });

        return `${otherItems} ${conjunctionText} ${lastItem}`;
    }

    /**
     * Format date in current language
     */
    function formatDate(date, format = 'short') {
        const d = new Date(date);
        const dateFormatter = new Intl.DateTimeFormat(currentLanguage.replace('_', '-'), {
            year: 'numeric',
            month: format === 'short' ? 'numeric' : 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        return dateFormatter.format(d);
    }

    /**
     * Format number in current language
     */
    function formatNumber(num, decimals = 0) {
        return new Intl.NumberFormat(currentLanguage.replace('_', '-'), {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    /**
     * Translate plural forms
     * e.g., t('items.count', { count: 5 }) with translations:
     * { 'items.count[0]': '1 item', 'items.count[1]': '{count} items' }
     */
    function tp(key, count, params = {}) {
        const pluralKey = `${key}[${count === 1 ? 0 : 1}]`;
        return t(pluralKey, { count, ...params });
    }

    return {
        init,
        t,
        getAll,
        setLanguage,
        getLanguage,
        getAvailableLanguages,
        hasLanguage,
        saveLanguage,
        getSavedLanguage,
        getBrowserLanguage,
        addTranslations,
        formatList,
        formatDate,
        formatNumber,
        tp // Plural translations
    };
})();

// Export for modules
if (typeof window !== 'undefined') {
    window.i18n = i18n;
}
