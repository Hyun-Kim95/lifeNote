import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import {
  Card,
  EmptyState,
  ErrorText,
  Fab,
  Input,
  ListItem,
  LoadingBlock,
  Muted,
  PrimaryButton,
  SectionLabel,
  Title,
} from '../components/Ui';
import type { CommunityPostParam } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';

type PostRow = {
  id: string;
  title: string | null;
  body: string;
  author: { id: string; displayName: string };
  createdAt: string;
};

function toParam(p: PostRow): CommunityPostParam {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    authorDisplayName: p.author.displayName,
    createdAt: p.createdAt,
  };
}

function openPost(navigation: unknown, post: CommunityPostParam) {
  const nav = navigation as {
    getParent?: () => { getParent?: () => { navigate?: (n: string, params: { post: CommunityPostParam }) => void } };
  };
  nav.getParent?.()?.getParent?.()?.navigate?.('CommunityPost', { post });
}

export function CommunityScreen() {
  const { colors, spacing, icon } = useAppTheme();
  const navigation = useNavigation();
  const { requestJson } = useApi();
  const [items, setItems] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ items: PostRow[] }>('/v1/community/posts?page=1&pageSize=30');
      setItems(res.items ?? []);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [requestJson]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const create = async () => {
    if (!body.trim()) {
      setError('본문을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson('/v1/community/posts', {
        method: 'POST',
        body: { title: title.trim() || undefined, body: body.trim() },
      });
      setTitle('');
      setBody('');
      setComposerOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '작성 실패');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>커뮤니티</Title>
      <SectionLabel>전체 피드</SectionLabel>
      {error ? (
        <Card style={{ gap: spacing.sm }}>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loading} />
        </Card>
      ) : null}
      {composerOpen ? (
        <Card style={{ gap: spacing.sm }}>
          <SectionLabel>새 글 제목 (선택)</SectionLabel>
          <Input value={title} onChangeText={setTitle} placeholder="제목을 입력하세요" />
          <SectionLabel>본문</SectionLabel>
          <Input value={body} onChangeText={setBody} multiline placeholder="공유할 내용을 입력하세요" style={{ minHeight: 112, textAlignVertical: 'top' }} />
          <PrimaryButton title="게시" onPress={() => void create()} loading={saving} />
        </Card>
      ) : null}
    </View>
  );

  if (loading && items.length === 0 && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ paddingHorizontal: 16 }}>
          <LoadingBlock />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(x) => x.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          error ? null : (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <EmptyState text="아직 등록된 글이 없어요. 첫 글을 남겨보세요." />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
            <ListItem
              onPress={() => openPost(navigation, toParam(item))}
              title={
                <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                  {item.title ?? '(제목 없음)'}
                </Text>
              }
              subtitle={
                <>
                  <Muted>
                    {item.author.displayName} · {item.createdAt.slice(0, 10)}
                  </Muted>
                  <Text numberOfLines={3} style={{ marginTop: 6, color: colors.text, lineHeight: 20 }}>
                    {item.body}
                  </Text>
                </>
              }
            />
          </View>
        )}
      />
      <Fab
        accessibilityLabel="새 글 작성"
        onPress={() => setComposerOpen((o) => !o)}
        active={composerOpen}
        icon={<Ionicons name={composerOpen ? 'close' : 'create'} size={icon.xl} color={colors.onPrimary} />}
      />
    </View>
  );
}
