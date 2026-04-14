import { expect, test } from "@playwright/test";

/**
 * 실제 dev 서버에 붙어 공개 라우트만 확인한다(API 토큰 불필요).
 * CI에서 `e2e:live`로만 돌릴 때도 동작한다.
 */
test("실 서버 - 랜딩·로그인 화면 진입", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "lifeNote Admin" }),
  ).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
