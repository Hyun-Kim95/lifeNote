import { expect, test } from '@playwright/test';

type MockTodo = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueOn: string | null;
};

test('사용자 할 일 핵심 플로우', async ({ page }) => {
  const todos: MockTodo[] = [];

  await page.addInitScript(() => {
    localStorage.setItem(
      'lifenote_auth_session',
      JSON.stringify({
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 10 * 60 * 1000,
        user: { id: 'u1', displayName: '테스터', role: 'user' },
      }),
    );
  });

  await page.route('**/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());

    if (url.pathname === '/v1/todos' && req.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: todos,
          stats: {
            completed: todos.filter((t) => t.done).length,
            total: todos.length,
          },
        }),
      });
      return;
    }

    if (url.pathname === '/v1/todos' && req.method() === 'POST') {
      const payload = req.postDataJSON() as { title?: string };
      todos.unshift({
        id: `todo-${Date.now()}`,
        title: payload.title ?? 'untitled',
        done: false,
        priority: 'normal',
        dueOn: null,
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(todos[0]),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/todos/') && req.method() === 'PATCH') {
      const todoId = url.pathname.split('/').pop();
      const payload = req.postDataJSON() as { done?: boolean };
      const target = todos.find((t) => t.id === todoId);
      if (target) {
        target.done = payload.done ?? target.done;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(target ?? {}),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/todos/') && req.method() === 'DELETE') {
      const todoId = url.pathname.split('/').pop();
      const idx = todos.findIndex((t) => t.id === todoId);
      if (idx >= 0) {
        todos.splice(idx, 1);
      }
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.goto('/todos');

  await expect(page.getByRole('heading', { name: '새 할 일' })).toBeVisible();

  await page.getByPlaceholder('할 일 제목').fill('통합 E2E 할 일');
  await page.getByRole('button', { name: '추가' }).click();

  await expect(page.getByText('통합 E2E 할 일')).toBeVisible();

  await page.getByText('통합 E2E 할 일').click();
  await expect(page.getByText('1/1 완료')).toBeVisible();

  await page.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByText('등록된 할 일이 없습니다.')).toBeVisible();
});
