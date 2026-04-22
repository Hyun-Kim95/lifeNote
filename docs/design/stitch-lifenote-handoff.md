---
type: doc
project: lifeNote
doc_lane: design
updated_at: 2026-04-22T12:00:00
tags: [docs, vault-sync]
---
# Stitch + 자체 목업 이관 기록 — lifeNote (2026-04-14)

`docs/design/stitch-sop.md` 절차에 따라 Stitch(2B) 생성. PRD: `docs/requirements/prd-lifenote-integrated-app.md`.  
**자체 목업(2A)**은 `mock-internal/` 정적 HTML로 추가해 Stitch와 **정합 비교**가 가능했다.

## 디자인 확정 (단계 3)

| 항목 | 내용 |
|------|------|
| 확정 트랙 | **Stitch** (`projects/444902834666992493`, 디자인 시스템 `assets/17014072979125403972`) |
| 승인일 | 2026-04-14 (채팅) |
| 자체 목업 | 시각 기준 **비채택**. 레이아웃·카피 참고·통계/커뮤 등 Stitch 미생성 흐름 보조용으로만 유지 가능 |

구현 시 시각 단일 기준은 Stitch이며, 전역 CSS와의 우선순위는 `.cursor/rules/50-index-css-contract.mdc` 및 PRD §13.1을 따른다.

## 자체 목업 (2A)

| 항목 | 값 |
|------|-----|
| 경로 | 저장소 루트 `mock-internal/` |
| 허브 | `mock-internal/index.html` |
| 실행 | `cd mock-internal && npx --yes serve -l 5175` (README 참고) |
| 시각 기준 | primary `#0f766e` (Stitch 시드 `#2D6A4F`와 **의도적으로 구분** — 어느 트랙인지 한눈에 구분) |
| 다크 모드 | 헤더 토글, `data-theme="dark"` |

## Stitch 프로젝트 (2B)

| 항목 | 값 |
|------|-----|
| `projectId` (API용 숫자 ID) | `444902834666992493` |
| 리소스 이름 | `projects/444902834666992493` |
| Stitch 제목 | lifeNote — 통합 생활 관리 (웹+앱) |
| `projectType` | `PROJECT_DESIGN` |

Stitch UI에서 위 제목 또는 프로젝트 ID로 연다.

**제품 코드 기준(2026-04-15)**: Stitch·목업에 포함된 **일반 회원** 흐름(To-do·식비·일기 등)은 **모바일 앱** 구현을 전제로 한다. Next.js **웹**은 **관리자·로그인·OAuth 콜백·랜딩**만 유지한다. 표의 “(웹+앱)”은 **Stitch 프로젝트 표기명**이며, 배포 클라이언트 역할과 1:1로 대응하지 않는다.

## 디자인 시스템 (asset)

| 항목 | 값 |
|------|-----|
| `assetId` / `name` | `assets/17014072979125403972` |
| 표시 이름 | lifeNote — Calm Productivity |
| 테마 요약 | LIGHT, primary seed `#2D6A4F`, `ROUND_TWELVE`, Manrope + Inter, `NEUTRAL` |

`create_design_system` 직후 `update_design_system`으로 반영 완료.

## 트랙 간 대응표 (비교용)

| 흐름 | 자체 목업 (HTML) | Stitch 화면 제목 | `screens/{id}` |
|------|------------------|------------------|----------------|
| 모바일 홈 | `mock-internal/app-home.html` | 홈 (오늘) | `b9fcf59c776642e6b8edd1a6e46199ab` |
| 모바일 To-do | `mock-internal/app-todo.html` | 오늘의 할 일 (리뉴얼) | `18a8cafbe56c4176802c0864961a3753` |
| 식비 일별 기록 | `mock-internal/app-budget.html` | 식비 기록 | `a2e2b7f5307d43dc875ffcb5aa88d5bb` |
| 주간 계획표 | `mock-internal/app-plan.html` | 주간 계획표 | `416c8f8a79864af1a32f6e382e8fc017` |
| 일기 작성 | `mock-internal/app-diary.html` | 일기 작성 | `969235ea993246fc8e38cd2316b22155` |
| SNS 로그인 | `mock-internal/app-login.html` | SNS 로그인 (MVP) | `1dd03991f80f4a048030813e9ca33630` |
| 통계 요약 | `mock-internal/app-stats.html` | 통계 요약 | `fa1c858125d3420ca709f1506308081c` |
| 커뮤니티 피드 | `mock-internal/app-community.html` | 커뮤니티 피드 | `fdeaf95b5c744ec0935877662f5feb98` |
| 커뮤니티 글·댓글 | `mock-internal/app-community.html` | 커뮤니티 글 상세 및 댓글 | `2aded8ac6cd5460293fdbe3429b7cd0c` |
| 공지 목록(회원) | — | 공지사항 목록 (회원용) | `9d1a679a811a4755a48aa42f898a2b1d` |
| 공지 상세(회원) | — | 공지사항 상세 (회원용) | `b1c6883c93ae48c282fd09d0c228eacb` |
| 더보기 허브 | — | 더보기 메뉴 허브 | `30214a01e5b5460eb3f6caa8647b6891` |
| 설정·프로필 | — | 설정 및 프로필 | `58d954d20a5b47bd99613d646036ccae` |
| 관리자 공지 | `mock-internal/admin-notices.html` | 공지사항 관리 목록 | `4d148465ed6c4b66a4ba67c08d3f028b` |
| 관리자 배너 | `mock-internal/admin-banners.html` | 명언 배너 관리 | `b7e2ef24f90146d78df96bd99221bdda` |
| 관리자 회원 | `mock-internal/admin-members.html` | 회원 관리 목록 | `d696688a674148239ee542da71d69cb9` |

전체 리소스 이름 예: `projects/444902834666992493/screens/<id>`.

## 프롬프트·생성 배치 요약

- **1차**: 모바일 홈, 데스크톱 공지, 모바일 To-do.
- **2차(부족 화면 보강)**: 식비 기록, SNS 로그인, 주간 계획표, 일기 작성, 명언 배너 관리, 회원 관리.
- **3차(2026-04-15, 모바일 보강)**: 통계 요약(`generate_screen_from_text` 후 `apply_design_system`으로 DS `17014072979125403972` 확정·스크린 ID 갱신), 커뮤니티 피드·글 상세·댓글, 회원 공지 목록·상세, 더보기 메뉴 허브, 설정 및 프로필.
- **4차(2026-04-22, To-do 기획 정합)**: PRD·`api-contract-lifenote-v1.md` §5.1에 맞춘 **일별·주별·월별** 범위, **전체·미완료·완료** 상태, **종일·오전·오후** 구간, 진행률 카드·행 메타(우선순위·반복·시각)를 반영해 기존 화면 `14b92fc3eb8b4cef972aaa41df8972f3`에 대해 `edit_screens`(`GEMINI_3_FLASH`)로 재생성. 확정 스크린 ID **`033ee695cd4d4bd787787995c4160ab7`** (제목: 오늘의 할 일 (업데이트)). 세션 `3556184140196282592`.
- **5차(2026-04-22, UI 정리)**: 햄버거 제거·주·월 진행률 카드·할 일 추가 시트에 **상세 시각(선택)** 반영. 스크린 **`18a8cafbe56c4176802c0864961a3753`** (제목: 오늘의 할 일 (리뉴얼)). 세션 `5038895502413143843`.
- 모델: `GEMINI_3_FLASH` (`generate_screen_from_text` / `edit_screens`).

## Stitch 후속 제안(에이전트 출력 취합)

- 다크 모드 전용 화면, 할 일 추가 모달, 공지/배너 등록 폼, 회원 상세 팝업 등 추가 생성 가능.
- 스타일 통일: `apply_design_system` + `get_project`의 `screenInstances`로 대상 지정 후 적용 검토.

## SOP 체크리스트

- [x] `projectId` 확정
- [x] 디자인 시스템 `assets/...` 확정
- [x] 상태 UI(기본·로딩·빈·오류·권한) 반영
- [x] 다크모드: 라이트 기준 Stitch + 자체 목업 토글
- [x] 화면 ID·자체 HTML 경로 기록

## 전역 CSS와의 관계

실제 앱 구현 시 `index.css` / `globals.css` 등과 병행하면 **최종 시각 기준**은 팀 합의로 정한다. `.cursor/rules/50-index-css-contract.mdc` 참고.
## Vault

- [[lifeNote/docs/_project-doc-index|Hub]]
- [[lifeNote/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[lifeNote/docs/obsidian/dashboards/commit-journal-overview|Commit journals (Dataview)]]
