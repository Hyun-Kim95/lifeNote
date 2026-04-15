import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useApi } from '../api/useApi';
import {
  Card,
  Chip,
  EmptyState,
  ErrorText,
  FieldLabel,
  Input,
  LoadingBlock,
  Muted,
  PrimaryButton,
  ScreenScroll,
  SectionLabel,
  Title,
} from '../components/Ui';
import { toYmd } from '../lib/week';
import { useAppTheme } from '../theme/ThemeContext';

type Template = { id: string; name: string };

export function DiaryScreen() {
  const { spacing } = useAppTheme();
  const { requestJson } = useApi();
  const [date, setDate] = useState(toYmd(new Date()));
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTemplates = useCallback(async () => {
    const res = await requestJson<{ items: Template[] }>('/v1/diary-templates', { auth: false });
    setTemplates(res.items ?? []);
    setTemplateId((prev) => prev ?? res.items?.[0]?.id);
  }, [requestJson]);

  const loadDiary = useCallback(async () => {
    setError(null);
    try {
      await loadTemplates();
      try {
        const d = await requestJson<{ title: string | null; body: string; templateId: string | null }>(
          `/v1/diaries/${date}`,
        );
        setTitle(d.title ?? '');
        setBody(d.body ?? '');
        if (d.templateId) setTemplateId(d.templateId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('찾을 수 없') || msg.includes('NOT_FOUND')) {
          setTitle('');
          setBody('');
        } else {
          throw e;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류');
    } finally {
      setLoading(false);
    }
  }, [date, loadTemplates, requestJson]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadDiary();
    }, [loadDiary]),
  );

  const save = async () => {
    if (!body.trim()) {
      setError('본문을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/v1/diaries/${date}`, {
        method: 'PUT',
        body: {
          templateId: templateId || undefined,
          title: title.trim() || undefined,
          body: body.trim(),
        },
      });
      await loadDiary();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenScroll>
        <Title>일기</Title>
        <LoadingBlock />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <Title>일기</Title>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card>
        <SectionLabel>날짜 (YYYY-MM-DD)</SectionLabel>
        <Input value={date} onChangeText={setDate} autoCapitalize="none" />
        <PrimaryButton title="불러오기" onPress={() => { setLoading(true); void loadDiary(); }} />
      </Card>
      <Card>
        <SectionLabel>템플릿</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {templates.map((t) => (
            <Chip
              key={t.id}
              label={t.name}
              selected={templateId === t.id}
              onPress={() => setTemplateId(t.id)}
            />
          ))}
        </View>
        {templates.length === 0 ? <EmptyState text="등록된 템플릿이 없습니다." /> : null}
      </Card>
      <Card>
        <SectionLabel>제목 (선택)</SectionLabel>
        <Input value={title} onChangeText={setTitle} />
        <SectionLabel>본문</SectionLabel>
        <Input value={body} onChangeText={setBody} multiline style={{ minHeight: 140, textAlignVertical: 'top' }} />
        <PrimaryButton title="저장" onPress={() => void save()} loading={saving} />
      </Card>
    </ScreenScroll>
  );
}
