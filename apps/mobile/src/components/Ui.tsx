import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

export function ScreenScroll({ children, contentContainerStyle, ...props }: ScrollViewProps) {
  const { colors, spacing } = useAppTheme();
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

type CardVariant = 'default' | 'muted';

export function Card({
  children,
  style,
  variant = 'default',
}: {
  children: ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
}) {
  const { colors, radius, spacing, stroke } = useAppTheme();
  const backgroundColor = variant === 'muted' ? colors.cardMuted : colors.card;
  return (
    <View
      style={[
        {
          borderWidth: stroke.width,
          borderColor: colors.border,
          backgroundColor,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme();
  return (
    <Text
      style={[
        styles.title,
        { color: colors.text, fontFamily: fonts.title, ...fonts.typography.title },
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  style,
  size = 'md',
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  size?: 'sm' | 'md';
}) {
  const { colors, fonts } = useAppTheme();
  const bodyType = size === 'sm' ? fonts.typography.bodySm : fonts.typography.body;
  return (
    <Text
      style={[
        styles.body,
        size === 'sm' ? styles.bodySm : undefined,
        { color: colors.text, fontFamily: fonts.body, ...bodyType },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme();
  return (
    <Text
      style={[
        styles.muted,
        { color: colors.textMuted, fontFamily: fonts.body, ...fonts.typography.bodySm },
      ]}
    >
      {children}
    </Text>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme();
  return (
    <Text
      style={[
        styles.sectionLabel,
        { color: colors.textMuted, fontFamily: fonts.bodyMedium, ...fonts.typography.sectionLabel },
      ]}
    >
      {children}
    </Text>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme();
  return (
    <Text style={[styles.error, { color: colors.error, fontFamily: fonts.body, ...fonts.typography.label }]}>
      {children}
    </Text>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme();
  return (
    <Text style={[styles.label, { color: colors.text, fontFamily: fonts.bodyMedium, ...fonts.typography.label }]}>
      {children}
    </Text>
  );
}

export function Input(props: TextInputProps) {
  const { colors, fonts, radius, size, spacing, stroke } = useAppTheme();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[
        styles.input,
        {
          borderColor: colors.borderInput,
          color: colors.text,
          backgroundColor: colors.card,
          fontFamily: fonts.body,
          borderRadius: radius.sm,
          borderWidth: stroke.width,
          minHeight: size.inputMinHeight,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        props.style,
      ]}
    />
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  leading,
  variant = 'filled',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  variant?: 'filled' | 'neutral';
}) {
  const { colors, fonts, radius, spacing, size } = useAppTheme();
  const bgColor = variant === 'neutral' ? colors.cardMuted : colors.primary;
  const textColor = variant === 'neutral' ? colors.text : colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }: { pressed: boolean }) => [
        styles.btn,
        {
          backgroundColor: bgColor,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          minHeight: size.buttonMinHeight,
          opacity: disabled || loading ? 0.55 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
          {leading}
          <Text style={[styles.btnText, { color: textColor, fontFamily: fonts.bodyMedium, ...fonts.typography.button }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors, fonts, radius, spacing, size, stroke } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.btnOutline,
        {
          borderColor: colors.primary,
          borderWidth: stroke.width,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          minHeight: size.buttonMinHeight,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        style={[styles.btnOutlineText, { color: colors.text, fontFamily: fonts.bodyMedium, ...fonts.typography.button }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const { colors, fonts, radius, spacing, size, stroke } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: size.chipMinHeight,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: stroke.width,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.card,
      }}
    >
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.text,
          fontFamily: fonts.bodyMedium,
          fontSize: fonts.typography.chip.fontSize,
          lineHeight: fonts.typography.chip.lineHeight,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label }: { label: string }) {
  const { colors, fonts, radius, spacing, stroke } = useAppTheme();
  return (
    <View
      style={{
        borderWidth: stroke.width,
        borderColor: colors.primary,
        backgroundColor: colors.primaryTint,
        borderRadius: radius.round,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: colors.primary,
          fontFamily: fonts.bodyMedium,
          fontSize: fonts.typography.badge.fontSize,
          lineHeight: fonts.typography.badge.lineHeight,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function ListItem({
  title,
  subtitle,
  onPress,
  trailing,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const { colors, radius, spacing, stroke } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        borderWidth: stroke.width,
        borderColor: colors.border,
        borderRadius: radius.sm,
        padding: spacing.md,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        {typeof title === 'string' ? <Body>{title}</Body> : title}
        {subtitle ? (typeof subtitle === 'string' ? <Muted>{subtitle}</Muted> : subtitle) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <Card style={{ alignItems: 'center' }}>
      <Muted>{text}</Muted>
    </Card>
  );
}

export function Overlay({ children }: { children: ReactNode }) {
  const { colors, spacing } = useAppTheme();
  return <View style={[styles.overlay, { backgroundColor: colors.overlay, padding: spacing.xxl }]}>{children}</View>;
}

/** 가로 진행 막대 (0~1). 홈·할 일 등 공통 톤. */
export function LinearProgressBar({ ratio }: { ratio: number }) {
  const { colors } = useAppTheme();
  const r = Math.min(1, Math.max(0, ratio));
  const filled = Math.round(r * 10_000);
  const empty = 10_000 - filled;
  return (
    <View
      style={{
        width: '100%',
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: colors.border,
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          flex: Math.max(filled, 0),
          backgroundColor: colors.primary,
          minWidth: filled > 0 ? 2 : 0,
        }}
      />
      <View style={{ flex: Math.max(empty, 0) }} />
    </View>
  );
}

export function Fab({
  onPress,
  icon,
  active,
  accessibilityLabel,
}: {
  onPress: () => void;
  icon: ReactNode;
  active?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors, radius, shadow, size, spacing, navigation } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[
        styles.fab,
        {
          borderRadius: radius.round,
          backgroundColor: active ? colors.text : colors.primary,
          width: size.fab,
          height: size.fab,
          right: spacing.xl,
          bottom: navigation.fabBottomOffset,
          elevation: shadow.fab.elevation,
          shadowColor: colors.text,
          shadowOpacity: shadow.fab.shadowOpacity,
          shadowRadius: shadow.fab.shadowRadius,
          shadowOffset: shadow.fab.shadowOffset,
        },
      ]}
    >
      {icon}
    </Pressable>
  );
}

export function LoadingBlock() {
  const { colors } = useAppTheme();
  return (
    <Card>
      <ActivityIndicator color={colors.primary} />
      <Muted>불러오는 중…</Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 18,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    alignSelf: 'stretch',
    width: '100%',
  },
  btnText: {
    fontSize: 15,
    lineHeight: 20,
  },
  btnOutline: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
  },
  btnOutlineText: {
    fontSize: 15,
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  fab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
