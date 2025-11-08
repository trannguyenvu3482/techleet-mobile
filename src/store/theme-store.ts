import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import * as SystemUI from 'expo-system-ui';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
  updateSystemTheme: () => void;
}

const THEME_STORAGE_KEY = '@theme_mode';

const getSystemColorScheme = (): boolean => {
  const colorScheme: ColorSchemeName = Appearance.getColorScheme();
  return colorScheme === 'dark';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: false,

  initialize: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const mode = (savedMode as ThemeMode) || 'system';
      await get().setMode(mode);
    } catch (error) {
      console.error('Error initializing theme:', error);
      await get().setMode('system');
    }
  },

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      
      let isDark = false;
      if (mode === 'dark') {
        isDark = true;
      } else if (mode === 'light') {
        isDark = false;
      } else {
        isDark = getSystemColorScheme();
      }

      try {
        await SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#ffffff');
      } catch (error) {
        console.warn('Error setting system UI background color:', error);
      }
      
      set({ mode, isDark });
    } catch (error) {
      console.error('Error setting theme mode:', error);
    }
  },

  updateSystemTheme: () => {
    const { mode } = get();
    if (mode === 'system') {
      const isDark = getSystemColorScheme();
      set({ isDark });
      try {
        SystemUI.setBackgroundColorAsync(isDark ? '#000000' : '#ffffff');
      } catch (error) {
        console.warn('Error updating system UI background color:', error);
      }
    }
  },
}));

