import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import {
  Card,
  ErrorText,
  FieldLabel,
  Input,
  Muted,
  PrimaryButton,
  ScreenScroll,
  SecondaryButton,
  Title,
} from '../components/Ui';
import { getApiBaseUrl } from '../config';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DevToken'>;

export function DevTokenScreen(_props: Props) {
  const { signInManualTokens, signOut } = useAuth();
  const [access, setAccess] = useState('');
  const [refresh, setRefresh] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    if (!access.trim()) {
      setError('Access token을 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rt = refresh.trim() || access.trim();
      await signInManualTokens(access.trim(), rt);
    } catch (e) {
      setError(e instanceof Error ? e.message : '실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <Title>개발자 토큰</Title>
      <Muted>__DEV__ 전용. API {getApiBaseUrl()} 에 대해 Bearer로 검증합니다.</Muted>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card>
        <FieldLabel>Access Token</FieldLabel>
        <Input value={access} onChangeText={setAccess} autoCapitalize="none" />
        <FieldLabel>Refresh Token (선택, 없으면 access와 동일)</FieldLabel>
        <Input value={refresh} onChangeText={setRefresh} autoCapitalize="none" />
        <PrimaryButton title="적용 후 계속" onPress={() => void apply()} loading={busy} />
      </Card>
      <SecondaryButton title="세션 삭제" onPress={() => void signOut()} />
    </ScreenScroll>
  );
}
