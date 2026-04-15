/**
 * Stitch 디자인 시스템: Manrope + Inter (`docs/design/stitch-lifenote-handoff.md`).
 * `App.tsx`의 `useFonts`에 등록한 이름과 동일해야 함.
 */
export const fonts = {
  /** 제목·강조 */
  title: 'Manrope_700Bold',
  titleSemi: 'Manrope_600SemiBold',
  /** 본문·보조 */
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  /**
   * Typography scale fixed to avoid per-screen magic numbers.
   * Use local override only for one-off display emphasis.
   */
  typography: {
    title: { fontSize: 22, lineHeight: 30, letterSpacing: 0 },
    body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
    bodySm: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
    label: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
    sectionLabel: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
    button: { fontSize: 15, lineHeight: 20, letterSpacing: 0 },
    badge: { fontSize: 11, lineHeight: 14, letterSpacing: 0 },
    chip: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  },
} as const;

export type ThemeFonts = typeof fonts;
