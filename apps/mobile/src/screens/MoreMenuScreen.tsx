import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Body, Card, ListItem, SectionLabel, ScreenScroll, Title } from '../components/Ui';
import { useAppTheme } from '../theme/ThemeContext';
import type { MoreStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>;

type Row = { title: string; subtitle: string; target: keyof MoreStackParamList };

const serviceRows: Row[] = [
  { title: '공지', subtitle: '목록·상세', target: 'Notices' },
  { title: '커뮤니티', subtitle: '피드·댓글', target: 'Community' },
  { title: '일기', subtitle: '날짜별 작성·템플릿', target: 'Diary' },
];

const toolRows: Row[] = [
  { title: '주간 계획', subtitle: '요일·시간대 슬롯', target: 'WeekPlan' },
  { title: '통계', subtitle: '주·월·연 요약', target: 'Stats' },
];

const accountRows: Row[] = [{ title: '설정', subtitle: '프로필·테마', target: 'Settings' }];

export function MoreMenuScreen({ navigation }: Props) {
  const { spacing } = useAppTheme();
  return (
    <ScreenScroll>
      <Title>더보기</Title>
      <Body size="sm">서비스·도구·설정 화면으로 이동합니다.</Body>

      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>서비스</SectionLabel>
        {serviceRows.map((r) => (
          <ListItem key={r.target} title={r.title} subtitle={r.subtitle} onPress={() => navigation.navigate(r.target)} />
        ))}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>도구</SectionLabel>
        {toolRows.map((r) => (
          <ListItem key={r.target} title={r.title} subtitle={r.subtitle} onPress={() => navigation.navigate(r.target)} />
        ))}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <SectionLabel>계정</SectionLabel>
        {accountRows.map((r) => (
          <ListItem key={r.target} title={r.title} subtitle={r.subtitle} onPress={() => navigation.navigate(r.target)} />
        ))}
      </Card>
    </ScreenScroll>
  );
}
