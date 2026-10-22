import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  dangerBg: string;
  statusBasiBg: string;
  statusBasiText: string;
  statusSegarBg: string;
  statusSegarText: string;
  tabBarBg: string;
  tabBarBorder: string;
  searchBg: string;
  searchBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#F4F7FA',
  cardBorder: '#E2E8F0',
  text: '#1A202C',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#208AEF',
  primaryText: '#FFFFFF',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  statusBasiBg: '#FEF3E2',
  statusBasiText: '#B45309',
  statusSegarBg: '#EAFBF6',
  statusSegarText: '#13795F',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  searchBg: '#FFFFFF',
  searchBorder: '#CBD5E1',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2D3748',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#2D3748',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  danger: '#F87171',
  dangerBg: '#3E1F1F',
  statusBasiBg: '#362208',
  statusBasiText: '#FBBF24',
  statusSegarBg: '#0D3328',
  statusSegarText: '#34D399',
  tabBarBg: '#18181B',
  tabBarBorder: '#27272A',
  searchBg: '#1E1E1E',
  searchBorder: '#3F3F46',
};

const THEME_STORAGE_KEY = '@jelajah_aman:theme_mode';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  colors: lightColors,
  setThemeMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat preferensi tema:', err);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Gagal menyimpan preferensi tema:', err);
    }
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return deviceColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, deviceColorScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors,
      setThemeMode,
    }),
    [themeMode, isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

