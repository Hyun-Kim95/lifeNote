import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

/** `npm`/`playwright` 실행 cwd가 `apps/web`일 때 저장소 루트의 `docs/qa/evidence/` */
const evidenceDir = path.join(process.cwd(), "..", "..", "docs", "qa", "evidence");

const emptyList = {
  items: [] as unknown[],
  page: 1,
  pageSize: 15,
  totalCount: 0,
};

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });

  await page.addInitScript(() => {
    localStorage.setItem(
      "lifenote_auth_session",
      JSON.stringify({
        accessToken: "mock-admin-token",
        refreshToken: "mock-refresh",
        expiresAt: Date.now() + 60 * 60 * 1000,
        user: { id: "admin1", displayName: "증빙관리자", role: "admin" },
      }),
    );
  });

  await page.route("**/v1/admin/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;

    if (req.method() === "GET" && p === "/v1/admin/notices") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "n-ev-1",
              title: "QA 증빙용 공지",
              pinned: true,
              publishStartAt: "2026-04-01T00:00:00.000Z",
              publishEndAt: "2026-04-30T23:59:59.999Z",
              status: "published",
            },
          ],
          page: 1,
          pageSize: 15,
          totalCount: 1,
        }),
      });
      return;
    }

    if (req.method() === "GET" && p === "/v1/admin/quote-banners") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "b-ev-1",
              text: "작은 기록이 모여 하루를 바꿉니다.",
              source: "lifeNote",
              priority: 10,
              active: true,
              startAt: "2026-04-01T00:00:00.000Z",
              endAt: "2026-04-30T23:59:59.999Z",
            },
          ],
          page: 1,
          pageSize: 15,
          totalCount: 1,
        }),
      });
      return;
    }

    if (req.method() === "GET" && p === "/v1/admin/users") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "u-ev-1",
              email: "qa@example.com",
              displayName: "증빙사용자",
              status: "active",
              role: "USER",
              createdAt: "2026-03-01T00:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 15,
          totalCount: 1,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emptyList),
    });
  });
});

test("관리자 화면 증빙 스크린샷 (공지·배너·회원)", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("table").first().waitFor({ state: "visible", timeout: 15_000 });

  await page.screenshot({
    path: path.join(evidenceDir, "admin-notices.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "배너관리" }).click();
  await page.getByRole("table").first().waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(evidenceDir, "admin-banners.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "회원관리" }).click();
  await page.getByRole("table").first().waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(evidenceDir, "admin-members.png"),
    fullPage: true,
  });
});
