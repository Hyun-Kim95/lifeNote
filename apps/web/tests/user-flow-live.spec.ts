import { expect, test } from '@playwright/test';

const liveToken = process.env.E2E_ACCESS_TOKEN;

test.skip(!liveToken, 'E2E_ACCESS_TOKEN이 없어서 live 테스트를 건너뜁니다.');

test('실 API 연동 - 사용자 홈/할 일 화면 진입', async ({ page }) => {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'lifenote_auth_session',
      JSON.stringify({
        accessToken: token,
        refreshToken: 'live-refresh-not-used',
        expiresAt: Date.now() + 10 * 60 * 1000,
        user: { id: 'live-user', displayName: 'Live User', role: 'user' },
      }),
    );
  }, liveToken);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'lifeNote' })).toBeVisible();

  await page.goto('/todos');
  await expect(page.getByRole('heading', { name: '새 할 일' })).toBeVisible();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
});
