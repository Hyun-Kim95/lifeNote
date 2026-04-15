import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useApi } from '../api/useApi';
import {
  Body,
  Card,
  Chip,
  ErrorText,
  FieldLabel,
  Input,
  ListItem,
  Muted,
  PrimaryButton,
  ScreenScroll,
  SectionLabel,
  SecondaryButton,
  Title,
} from '../components/Ui';
import type { ThemePreference } from '../theme/ThemeContext';
import { useAppTheme } from '../theme/ThemeContext';

type Me = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string;
};

const appVersion =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';

export function SettingsScreen() {
  const { colors, preference, setPreference, fonts, spacing } = useAppTheme();
  const { user, signOut } = useAuth();
  const { requestJson } = useApi();
  const navigation = useNavigation();
  const [me, setMe] = useState<Me | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoadingMe(true);
    try {
      const m = await requestJson<Me>('/v1/me');
      setMe(m);
      setDisplayName(m.displayName ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : '정보를 불러오지 못했습니다.');
    } finally {
      setLoadingMe(false);
    }
  }, [requestJson]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      await requestJson('/v1/me', {
        method: 'PATCH',
        body: { displayName: displayName.trim() || undefined },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const openDevToken = () => {
    const p = navigation.getParent()?.getParent();
    (p as { navigate?: (n: string) => void } | undefined)?.navigate?.('DevToken');
  };

  return (
    <ScreenScroll>
      <Title>설정</Title>
      {error ? (
        <Card>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loadingMe} />
        </Card>
      ) : null}

      <SectionLabel>프로필</SectionLabel>
      <Card>
        <Muted>로그인 계정</Muted>
        <Text style={{ color: colors.text, fontFamily: fonts.titleSemi, ...fonts.typography.body }}>
          {user?.displayName ?? me?.displayName ?? '—'}
        </Text>
        <Muted>{me?.email ?? ''}</Muted>
        <Muted>역할: {user?.role ?? me?.role ?? '—'}</Muted>
      </Card>
      <Card>
        <FieldLabel>표시 이름</FieldLabel>
        <Input value={displayName} onChangeText={setDisplayName} editable={!loadingMe} />
        <PrimaryButton title="프로필 저장" onPress={() => void saveProfile()} loading={saving} disabled={loadingMe} />
      </Card>

      <SectionLabel>앱 설정</SectionLabel>
      <Card>
        <FieldLabel>화면 테마</FieldLabel>
        <Muted>라이트·다크·시스템 설정을 선택합니다.</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xxs }}>
          <Chip label="시스템" selected={preference === 'system'} onPress={() => setPreference('system')} />
          <Chip label="라이트" selected={preference === 'light'} onPress={() => setPreference('light')} />
          <Chip label="다크" selected={preference === 'dark'} onPress={() => setPreference('dark')} />
        </View>
      </Card>

      <SectionLabel>정보</SectionLabel>
      <Card>
        <ListItem title="앱 버전" subtitle={<Body>v{appVersion}</Body>} />
      </Card>

      <SectionLabel>계정</SectionLabel>
      {__DEV__ ? (
        <SecondaryButton title="개발자: 토큰으로 로그인" onPress={openDevToken} />
      ) : null}
      <SecondaryButton title="로그아웃" onPress={() => void signOut()} />
    </ScreenScroll>
  );
}
