import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApi } from '../api/useApi';
import { Body, Card, EmptyState, ErrorText, Input, ListItem, LoadingBlock, Muted, PrimaryButton, SectionLabel, Title } from '../components/Ui';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityPost'>;

type Comment = {
  id: string;
  body: string;
  author: { displayName: string };
  createdAt: string;
};

export function CommunityPostScreen({ route }: Props) {
  const { post } = route.params;
  const { colors, spacing } = useAppTheme();
  const { requestJson } = useApi();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ items: Comment[] }>(`/v1/community/posts/${post.id}/comments`);
      setComments(res.items ?? []);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [post.id, requestJson]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submit = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/community/posts/${post.id}/comments`, {
        method: 'POST',
        body: { body: newComment.trim() },
      });
      setNewComment('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글을 등록하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>{post.title ?? '게시글'}</Title>
      <Muted>
        {post.authorDisplayName} · {post.createdAt.slice(0, 10)}
      </Muted>
      <Card>
        <Body>{post.body}</Body>
      </Card>
      <Card>
        <SectionLabel>댓글 {comments.length > 0 ? `(${comments.length})` : ''}</SectionLabel>
        <Input value={newComment} onChangeText={setNewComment} multiline style={{ minHeight: 72, textAlignVertical: 'top' }} />
        <PrimaryButton title="댓글 등록" onPress={() => void submit()} loading={saving} />
      </Card>
      {error ? (
        <Card>
          <ErrorText>{error}</ErrorText>
          <PrimaryButton title="다시 시도" onPress={() => void load()} loading={loading} />
        </Card>
      ) : null}
    </View>
  );

  if (loading && comments.length === 0 && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <LoadingBlock />
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={comments}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      ListEmptyComponent={
        error ? null : (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <EmptyState text="아직 댓글이 없습니다." />
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
          <ListItem
            title={<Body>{item.body}</Body>}
            subtitle={`${item.author.displayName} · ${item.createdAt.slice(0, 16)}`}
          />
        </View>
      )}
    />
  );
}
