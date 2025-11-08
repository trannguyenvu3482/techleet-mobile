import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import i18n from '@/i18n';

export type Language = 'en' | 'vi';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  initialize: () => Promise<void>;
}

const LANGUAGE_STORAGE_KEY = '@language';

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi', // Default to Vietnamese

  initialize: async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      const language = (savedLanguage as Language) || 'vi';
      await get().setLanguage(language);
    } catch (error) {
      console.error('Error initializing language:', error);
      await get().setLanguage('vi');
    }
  },

  setLanguage: async (language: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await i18n.changeLanguage(language);
      set({ language });
    } catch (error) {
      console.error('Error setting language:', error);
    }
  },
}));

