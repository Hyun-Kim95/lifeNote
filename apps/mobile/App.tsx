import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type HomeSummary = {
  date: string;
  quoteBanner: { id: string; text: string; source: string } | null;
  todo: { completed: number; total: number; percent: number };
  foodBudget: {
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
    todaySpentAmount: number;
  };
};

type Todo = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
};

type Stats = {
  todo: { completionRate: number; completed: number; total: number };
  diary: { daysWritten: number };
  food: { totalSpent: number; budgetAmount: number };
};

type Tab = 'home' | 'todos' | 'budget' | 'stats';

export default function App() {
  const defaultApiBase = useMemo(() => 'http://10.0.2.2:4000', []);

  const [apiBase, setApiBase] = useState(defaultApiBase);
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeSummary, setHomeSummary] = useState<HomeSummary | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notices, setNotices] = useState<Array<{ id: string; title: string }>>([]);
  const [budgetMonth, setBudgetMonth] = useState<{
    yearMonth: string;
    budgetAmount: number;
    spentAmount: number;
    remainingAmount: number;
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [todoTitle, setTodoTitle] = useState('');

  const loadData = async () => {
    if (!token.trim()) {
      setError('access token을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [h, t, n, s] = await Promise.all([
        apiGet(`${apiBase}/v1/home/summary`, token),
        apiGet(`${apiBase}/v1/todos?limit=10`, token),
        apiGet(`${apiBase}/v1/notices`),
        apiGet(`${apiBase}/v1/stats/summary?range=week`, token),
      ]);

      const home = h as HomeSummary;
      const todoRes = t as { items: Todo[] };
      const noticeRes = n as { items: Array<{ id: string; title: string }> };

      setHomeSummary(home);
      setTodos(todoRes.items);
      setNotices(noticeRes.items);
      setBudgetMonth({
        yearMonth: home.date.slice(0, 7),
        budgetAmount: home.foodBudget.budgetAmount,
        spentAmount: home.foodBudget.spentAmount,
        remainingAmount: home.foodBudget.remainingAmount,
      });
      setStats(s as Stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!token.trim() || !todoTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`${apiBase}/v1/todos`, 'POST', token, {
        title: todoTitle.trim(),
        priority: 'normal',
      });
      setTodoTitle('');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '할 일 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`${apiBase}/v1/todos/${todo.id}`, 'PATCH', token, {
        done: !todo.done,
      });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : '할 일 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>lifeNote Mobile</Text>
        <Text style={styles.caption}>모바일 실제 UI · 상태 처리 반영</Text>

        <View style={styles.card}>
          <Text style={styles.label}>API Base URL</Text>
          <TextInput
            value={apiBase}
            onChangeText={setApiBase}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholder="http://10.0.2.2:4000"
          />

          <Text style={styles.label}>Access Token</Text>
          <TextInput
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholder="eyJhbGciOi..."
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={loadData}
            disabled={loading}
          >
            <Text style={styles.buttonText}>데이터 새로고침</Text>
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          <TabButton active={tab === 'home'} label="홈" onPress={() => setTab('home')} />
          <TabButton active={tab === 'todos'} label="할 일" onPress={() => setTab('todos')} />
          <TabButton active={tab === 'budget'} label="식비" onPress={() => setTab('budget')} />
          <TabButton active={tab === 'stats'} label="통계" onPress={() => setTab('stats')} />
        </View>

        {!token.trim() ? <InfoCard tone="muted" text="상단에서 access token 입력 후 데이터 새로고침을 눌러 주세요." /> : null}
        {loading ? <InfoCard tone="muted" text="데이터를 불러오는 중입니다..." withSpinner /> : null}
        {error ? <InfoCard tone="error" text={error} /> : null}

        {tab === 'home' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>오늘 요약</Text>
            <Text style={styles.valueText}>날짜: {homeSummary?.date ?? '-'}</Text>
            <Text style={styles.valueText}>
              할 일 완료율: {homeSummary ? `${homeSummary.todo.percent}%` : '-'}
            </Text>
            <Text style={styles.valueText}>
              남은 식비: {homeSummary ? `${homeSummary.foodBudget.remainingAmount.toLocaleString()}원` : '-'}
            </Text>
            <Text style={styles.valueText}>명언: {homeSummary?.quoteBanner?.text ?? '없음'}</Text>
          </View>
        ) : null}

        {tab === 'todos' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>할 일</Text>
            <TextInput
              value={todoTitle}
              onChangeText={setTodoTitle}
              style={styles.input}
              placeholder="새 할 일"
            />
            <Pressable style={styles.button} onPress={addTodo} disabled={loading || !token.trim()}>
              <Text style={styles.buttonText}>추가</Text>
            </Pressable>
            <FlatList
              data={todos}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.todoRow} onPress={() => toggleTodo(item)}>
                  <Text
                    style={[
                      styles.valueText,
                      item.done && { textDecorationLine: 'line-through', color: '#6b7280' },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.smallMuted}>{item.priority}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.smallMuted}>할 일이 없습니다.</Text>}
            />
          </View>
        ) : null}

        {tab === 'budget' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>식비</Text>
            <Text style={styles.valueText}>기준월: {budgetMonth?.yearMonth ?? '-'}</Text>
            <Text style={styles.valueText}>
              예산: {budgetMonth ? `${budgetMonth.budgetAmount.toLocaleString()}원` : '-'}
            </Text>
            <Text style={styles.valueText}>
              지출: {budgetMonth ? `${budgetMonth.spentAmount.toLocaleString()}원` : '-'}
            </Text>
            <Text style={styles.valueText}>
              잔액: {budgetMonth ? `${budgetMonth.remainingAmount.toLocaleString()}원` : '-'}
            </Text>
            <Text style={styles.cardTitle}>공지</Text>
            {notices.length === 0 ? <Text style={styles.smallMuted}>공지 없음</Text> : null}
            {notices.slice(0, 3).map((n) => (
              <Text key={n.id} style={styles.valueText}>
                · {n.title}
              </Text>
            ))}
          </View>
        ) : null}

        {tab === 'stats' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>주간 통계</Text>
            <Text style={styles.valueText}>
              할 일: {stats ? `${Math.round(stats.todo.completionRate * 100)}% (${stats.todo.completed}/${stats.todo.total})` : '-'}
            </Text>
            <Text style={styles.valueText}>일기 작성일: {stats?.diary.daysWritten ?? '-'}일</Text>
            <Text style={styles.valueText}>
              식비 지출: {stats ? `${stats.food.totalSpent.toLocaleString()}원` : '-'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function InfoCard({
  text,
  tone,
  withSpinner,
}: {
  text: string;
  tone: 'muted' | 'error';
  withSpinner?: boolean;
}) {
  return (
    <View style={styles.card}>
      {withSpinner ? <ActivityIndicator style={{ marginBottom: 6 }} /> : null}
      <Text style={tone === 'error' ? styles.error : styles.smallMuted}>{text}</Text>
    </View>
  );
}

async function apiGet(url: string, token?: string): Promise<unknown> {
  return apiRequest(url, 'GET', token);
}

async function apiRequest(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
  token?: string,
  requestBody?: unknown,
): Promise<unknown> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
    },
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });
  const text = await res.text();
  const parsed = parseJsonSafe(text);
  if (!res.ok) {
    const message = extractErrorMessage(parsed) ?? `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return parsed;
}

function parseJsonSafe(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== 'object') return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' ? message : null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f8',
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  caption: {
    color: '#4b5563',
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  label: {
    fontSize: 13,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  button: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  tabButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  valueText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  smallMuted: {
    fontSize: 12,
    color: '#6b7280',
  },
  todoRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
});
