import { expect, test } from '@playwright/test';

test('로그인 전 보호 화면 접근 시 로그인 유도', async ({ page }) => {
  await page.goto('/todos');
  await expect(page.getByText('로그인이 필요합니다.')).toBeVisible();
  await expect(page.getByRole('link', { name: '로그인하러 가기' })).toBeVisible();
});

test('OAuth 콜백 에러 파라미터 처리', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied');
  await expect(page.getByText('로그인 실패: access_denied')).toBeVisible();
});

test('만료 세션은 refresh 후 진입 가능', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'lifenote_auth_session',
      JSON.stringify({
        accessToken: 'expired-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 10_000,
        user: { id: 'u1', displayName: '테스터', role: 'user' },
      }),
    );
  });

  await page.route('**/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: { id: 'u1', displayName: '테스터', role: 'user' },
      }),
    });
  });

  await page.route('**/v1/todos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        stats: { completed: 0, total: 0 },
      }),
    });
  });

  await page.goto('/todos');
  await expect(page.getByRole('heading', { name: '새 할 일' })).toBeVisible();
});
