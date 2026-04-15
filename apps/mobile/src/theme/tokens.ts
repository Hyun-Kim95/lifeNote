/**
 * Base spacing follows 4pt grid.
 * `xxs: 2` and `xs: 6` are intentional exceptions for compact chip/badge rhythm.
 */
export const spacing = {
  xxs: 2,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  round: 999,
} as const;

export const icon = {
  xxs: 12,
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const shadow = {
  card: {
    elevation: 1,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  fab: {
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
} as const;

export const stroke = {
  width: 1,
} as const;

export const size = {
  buttonMinHeight: 48,
  inputMinHeight: 44,
  fab: 56,
  chipMinHeight: 30,
} as const;

export const navigation = {
  headerBorderWidth: 1,
  tabBarHeight: 64,
  tabBarPaddingTop: 6,
  tabBarPaddingBottom: 8,
  tabBarLabelSize: 11,
  tabBarLabelOffset: 2,
  fabBottomOffset: 30,
} as const;

export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeIcon = typeof icon;
