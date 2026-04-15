import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors, type ThemeName } from './colors';
import { fonts, type ThemeFonts } from './fonts';
import {
  icon,
  navigation,
  radius,
  shadow,
  size,
  spacing,
  stroke,
  type ThemeIcon,
  type ThemeRadius,
  type ThemeSpacing,
} from './tokens';

const STORAGE_KEY = 'lifenote_theme_preference';

export type ThemePreference = ThemeName | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ThemeName;
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  icon: ThemeIcon;
  shadow: typeof shadow;
  stroke: typeof stroke;
  size: typeof size;
  navigation: typeof navigation;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark' || raw === 'system') {
          setPreferenceState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const resolved: ThemeName =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const colors = resolved === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      preference,
      resolved,
      colors,
      fonts,
      spacing,
      radius,
      icon,
      shadow,
      stroke,
      size,
      navigation,
      setPreference,
    }),
    [preference, resolved, colors, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}

