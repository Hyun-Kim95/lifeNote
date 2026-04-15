import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import { Body, Card, ErrorText, LoadingBlock, Muted, PrimaryButton, ScreenScroll, SecondaryButton, Title } from '../components/Ui';
import { useAppTheme } from '../theme/ThemeContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NoticeDetail'>;

export function NoticeDetailScreen({ route }: Props) {
  const { colors, spacing } = useAppTheme();
  const navigation = useNavigation();
  const { requestJson } = useApi();
  const { id } = route.params;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const res = await requestJson<{ title: string; body: string; publishedAt?: string }>(`/v1/notices/${id}`, {
        auth: false,
      });
      setTitle(res.title);
      setBody(res.body);
      setPublishedAt(res.publishedAt ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('404') || msg.includes('찾을 수 없') || msg.includes('NOT_FOUND')) {
        setNotFound(true);
      } else {
        setError('정보를 불러오지 못했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, requestJson]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }}>
        <LoadingBlock />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }}>
        <Title>공지사항</Title>
        <Card>
          <Muted>존재하지 않거나 삭제된 공지사항입니다.</Muted>
        </Card>
        <SecondaryButton title="목록으로 돌아가기" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }}>
        <Title>공지사항</Title>
        <Card>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loading} />
        </Card>
      </View>
    );
  }

  return (
    <ScreenScroll>
      <Title>{title}</Title>
      {publishedAt ? <Muted>{publishedAt.slice(0, 10)}</Muted> : null}
      <Card>
        <Body>{body}</Body>
      </Card>
    </ScreenScroll>
  );
}
