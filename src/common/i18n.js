// Internationalization (i18n) module
(function() {
  'use strict';

  const supportedLocales = ['en', 'zh', 'ja'];
  const defaultLocale = 'en';
  let currentLocale = defaultLocale;
  let messages = {};

  // Get browser language
  function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage || '';
    // Get the base language code (e.g., 'en' from 'en-US', 'zh' from 'zh-CN')
    const baseLang = lang.split('-')[0].toLowerCase();
    return baseLang;
  }

  // Determine the locale to use
  function determineLocale() {
    // Check localStorage for saved preference
    try {
      const savedLocale = localStorage.getItem('patchReader_locale');
      if (savedLocale && supportedLocales.includes(savedLocale)) {
        return savedLocale;
      }
    } catch (e) {
      console.warn('Unable to read saved locale:', e);
    }

    // Use browser language if supported
    const browserLang = getBrowserLanguage();
    if (supportedLocales.includes(browserLang)) {
      return browserLang;
    }

    // Default to English
    return defaultLocale;
  }

  // Load messages for a locale
  async function loadMessages(locale) {
    try {
      const response = await fetch(`_locales/${locale}/messages.json`);
      if (!response.ok) {
        throw new Error(`Failed to load locale: ${locale}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load locale ${locale}, falling back to ${defaultLocale}:`, error);
      if (locale !== defaultLocale) {
        return loadMessages(defaultLocale);
      }
      return {};
    }
  }

  // Get message by key
  function getMessage(key) {
    if (messages[key] && messages[key].message) {
      return messages[key].message;
    }
    return key;
  }

  // Apply i18n to the page
  function applyI18n() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = getMessage(key);
      if (message !== key) {
        element.textContent = message;
      }
    });

    // Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = getMessage(key);
      if (message !== key) {
        element.title = message;
      }
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const message = getMessage(key);
      if (message !== key) {
        element.placeholder = message;
      }
    });

    // Update html lang attribute
    document.documentElement.lang = currentLocale;
  }

  // Initialize i18n
  async function initI18n() {
    currentLocale = determineLocale();
    messages = await loadMessages(currentLocale);
    applyI18n();
  }

  // Expose to global scope
  window.i18n = {
    init: initI18n,
    getMessage: getMessage,
    getCurrentLocale: () => currentLocale,
    getSupportedLocales: () => supportedLocales,
    setLocale: async (locale) => {
      if (supportedLocales.includes(locale)) {
        currentLocale = locale;
        messages = await loadMessages(locale);
        try {
          localStorage.setItem('patchReader_locale', locale);
        } catch (e) {
          console.warn('Unable to save locale:', e);
        }
        applyI18n();
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
