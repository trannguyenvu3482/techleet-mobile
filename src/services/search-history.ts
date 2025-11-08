import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount?: number;
}

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 20;

export const searchHistoryService = {
  async getHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyJson = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (!historyJson) {
        return [];
      }
      const history = JSON.parse(historyJson) as SearchHistoryItem[];
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  },

  async addToHistory(query: string, resultCount?: number): Promise<void> {
    try {
      if (!query || query.trim().length === 0) {
        return;
      }

      const history = await this.getHistory();
      
      const existingIndex = history.findIndex(
        (item) => item.query.toLowerCase() === query.toLowerCase()
      );

      const newItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: Date.now(),
        resultCount,
      };

      if (existingIndex >= 0) {
        history.splice(existingIndex, 1);
      }

      history.unshift(newItem);

      if (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
      }

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  },

  async removeFromHistory(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter((item) => item.id !== id);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  },
};

