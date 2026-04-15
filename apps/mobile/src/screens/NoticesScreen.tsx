import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import { Badge, Card, EmptyState, ErrorText, ListItem, LoadingBlock, PrimaryButton, SectionLabel, Title } from '../components/Ui';
import { useAppTheme } from '../theme/ThemeContext';

type Item = { id: string; title: string; pinned?: boolean; publishedAt?: string | null };

function navigateRootNotice(navigation: unknown, id: string) {
  const nav = navigation as { getParent?: () => { getParent?: () => { navigate?: (n: string, params: { id: string }) => void } } };
  nav.getParent?.()?.getParent?.()?.navigate?.('NoticeDetail', { id });
}

function isNewNotice(publishedAt: string | null | undefined): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 7 * 24 * 60 * 60 * 1000;
}

export function NoticesScreen() {
  const { colors, spacing } = useAppTheme();
  const navigation = useNavigation();
  const { requestJson } = useApi();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ items: Item[] }>('/v1/notices?page=1&pageSize=30&pinnedFirst=true', {
        auth: false,
      });
      setItems(res.items ?? []);
    } catch {
      setError('공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [requestJson]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && items.length === 0 && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md }}>
        <Title>공지사항</Title>
        <LoadingBlock />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Title>공지사항</Title>
        <SectionLabel>회원 공지</SectionLabel>
        {error ? (
          <Card>
            <ErrorText>{error}</ErrorText>
            <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loading} />
          </Card>
        ) : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm }}
        ListEmptyComponent={
          error ? null : (
            <EmptyState text="등록된 공지사항이 없습니다." />
          )
        }
        renderItem={({ item }) => {
          const showNew = !item.pinned && isNewNotice(item.publishedAt);
          return (
            <ListItem
              key={item.id}
              onPress={() => navigateRootNotice(navigation, item.id)}
              title={item.title}
              subtitle={item.publishedAt ? item.publishedAt.slice(0, 10) : undefined}
              trailing={
                <View style={{ gap: spacing.xxs, marginLeft: spacing.sm }}>
                  {item.pinned ? <Badge label="중요" /> : null}
                  {showNew ? <Badge label="NEW" /> : null}
                </View>
              }
            />
          );
        }}
      />
    </View>
  );
}
