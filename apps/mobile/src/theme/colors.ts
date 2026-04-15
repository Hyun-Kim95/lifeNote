export type ThemeName = 'light' | 'dark';

/** Stitch primary seed `#2D6A4F` (`stitch-lifenote-handoff.md`) */
const stitchPrimary = '#2D6A4F';
const PRIMARY_TINT_ALPHA = '14'; // ~8%

export const lightColors = {
  bg: '#f7f7f8',
  card: '#ffffff',
  cardMuted: '#f9fafb',
  text: '#111827',
  textMuted: '#6b7280',
  textSecondary: '#4b5563',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  borderInput: '#d1d5db',
  primary: stitchPrimary,
  onPrimary: '#ffffff',
  error: '#dc2626',
  success: '#16a34a',
  tabInactive: '#6b7280',
  overlay: '#00000073',
  primaryTint: `${stitchPrimary}${PRIMARY_TINT_ALPHA}`,
};

export const darkColors = {
  bg: '#0f1115',
  card: '#1a1d24',
  cardMuted: '#202531',
  text: '#f3f4f6',
  textMuted: '#9ca3af',
  textSecondary: '#cbd5e1',
  border: '#343c4d',
  borderStrong: '#465065',
  borderInput: '#3d4555',
  /** 다크 배경에서 버튼·탭 강조 가시성 */
  primary: '#52B788',
  onPrimary: '#0f1115',
  error: '#f87171',
  success: '#4ade80',
  tabInactive: '#9ca3af',
  overlay: '#0000008A',
  primaryTint: '#52B7881F',
};

export type ThemeColors = typeof lightColors;
