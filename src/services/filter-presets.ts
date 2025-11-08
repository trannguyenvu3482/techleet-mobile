import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FilterPreset {
  id: string;
  name: string;
  type: 'jobs' | 'candidates' | 'applications' | 'interviews';
  filters: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const FILTER_PRESETS_KEY = '@filter_presets';
const MAX_PRESETS = 10;

export const filterPresetsService = {
  async getPresets(type?: string): Promise<FilterPreset[]> {
    try {
      const presetsJson = await AsyncStorage.getItem(FILTER_PRESETS_KEY);
      if (!presetsJson) {
        return [];
      }
      const presets = JSON.parse(presetsJson) as FilterPreset[];
      if (type) {
        return presets.filter((p) => p.type === type).sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return presets.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error getting filter presets:', error);
      return [];
    }
  },

  async savePreset(preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt'>): Promise<FilterPreset> {
    try {
      const presets = await this.getPresets();
      const newPreset: FilterPreset = {
        ...preset,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      presets.push(newPreset);

      if (presets.length > MAX_PRESETS) {
        presets.sort((a, b) => b.updatedAt - a.updatedAt);
        presets.splice(MAX_PRESETS);
      }

      await AsyncStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(presets));
      return newPreset;
    } catch (error) {
      console.error('Error saving filter preset:', error);
      throw error;
    }
  },

  async updatePreset(id: string, updates: Partial<FilterPreset>): Promise<void> {
    try {
      const presets = await this.getPresets();
      const index = presets.findIndex((p) => p.id === id);
      if (index >= 0) {
        presets[index] = {
          ...presets[index],
          ...updates,
          updatedAt: Date.now(),
        };
        await AsyncStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(presets));
      }
    } catch (error) {
      console.error('Error updating filter preset:', error);
      throw error;
    }
  },

  async deletePreset(id: string): Promise<void> {
    try {
      const presets = await this.getPresets();
      const filtered = presets.filter((p) => p.id !== id);
      await AsyncStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting filter preset:', error);
      throw error;
    }
  },

  async exportPresets(): Promise<string> {
    try {
      const presets = await this.getPresets();
      return JSON.stringify(presets, null, 2);
    } catch (error) {
      console.error('Error exporting filter presets:', error);
      throw error;
    }
  },

  async importPresets(jsonString: string): Promise<void> {
    try {
      const presets = JSON.parse(jsonString) as FilterPreset[];
      await AsyncStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Error importing filter presets:', error);
      throw error;
    }
  },
};

