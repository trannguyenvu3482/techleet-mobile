import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import commonEn from './locales/en/common.json';
import commonVi from './locales/vi/common.json';
import dashboardEn from './locales/en/dashboard.json';
import dashboardVi from './locales/vi/dashboard.json';
import recruitmentEn from './locales/en/recruitment.json';
import recruitmentVi from './locales/vi/recruitment.json';
import employeesEn from './locales/en/employees.json';
import employeesVi from './locales/vi/employees.json';
import searchEn from './locales/en/search.json';
import searchVi from './locales/vi/search.json';
import chatEn from './locales/en/chat.json';
import chatVi from './locales/vi/chat.json';
import settingsEn from './locales/en/settings.json';
import settingsVi from './locales/vi/settings.json';
import notificationsEn from './locales/en/notifications.json';
import notificationsVi from './locales/vi/notifications.json';
import moreEn from './locales/en/more.json';
import moreVi from './locales/vi/more.json';

const LANGUAGE_STORAGE_KEY = '@language';

const namespaces = [
  'common',
  'dashboard',
  'recruitment',
  'employees',
  'search',
  'chat',
  'settings',
  'notifications',
  'more',
];

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      const language = savedLanguage || 'vi';
      callback(language);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('vi');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch (error) {
      console.error('Error caching language:', error);
    }
  },
};

const i18n = createInstance();

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    defaultNS: 'common',
    ns: namespaces,
    resources: {
      en: {
        common: commonEn,
        dashboard: dashboardEn,
        recruitment: recruitmentEn,
        employees: employeesEn,
        search: searchEn,
        chat: chatEn,
        settings: settingsEn,
        notifications: notificationsEn,
        more: moreEn,
      },
      vi: {
        common: commonVi,
        dashboard: dashboardVi,
        recruitment: recruitmentVi,
        employees: employeesVi,
        search: searchVi,
        chat: chatVi,
        settings: settingsVi,
        notifications: notificationsVi,
        more: moreVi,
      },
    },
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

