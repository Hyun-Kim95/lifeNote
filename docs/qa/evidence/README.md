---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15T00:18:33
tags: [docs, vault-sync]
---
# 관리자 UI 증빙 이미지

이 폴더의 PNG는 **로컬에서 Playwright로 재생성**할 수 있다. 실서버·스테이징에서 찍은 캡처가 아니라, **모킹 API**로 테이블이 채워진 상태의 화면을 고정한다.

## 생성 방법

저장소 루트에서:

```bash
cd apps/web
npx playwright test tests/admin-ui-evidence.spec.ts
```

또는:

```bash
npm run e2e:evidence -w web
```

## 파일

| 파일 | 내용 |
|------|------|
| `admin-notices.png` | 공지사항 탭 |
| `admin-banners.png` | 배너관리 탭 |
| `admin-members.png` | 회원관리 탭 |

디자인(Stitch)과의 **픽셀 단위 일치** 검증은 별도 시각 리뷰이며, 본 증빙은 **레이아웃·컴포넌트·상태 UI 존재** 확인용이다.
## Vault

- [[lifeNote/docs/_project-doc-index|Hub]]
- [[lifeNote/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[lifeNote/docs/obsidian/dashboards/commit-journal-overview|Commit journals (Dataview)]]
