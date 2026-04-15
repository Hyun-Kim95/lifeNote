---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15T23:30:00
tags: [mobile, prd, stitch, verification, gate-hold]
---

# 모바일 앱 — PRD·Stitch·구현 정합 검증

## 현재 단계 판정

- 완료 아님
- QA Gate 보류 (실기기 픽셀 증빙 미완)

## 이슈 등급 요약

- **BLOCKER**: 실기기 픽셀 단위 증빙 부재로 최종 게이트 통과 불가
- **MAJOR**: 403 권한 UI 상태의 실기기 기준 점검 결과 미확정
- **MINOR**: 핵심 5개 화면 FIX 0 여부 최종 확인 미완

## 다음 액션 체크리스트

- [ ] 실기기 캡처로 Stitch 대비 픽셀 증빙을 확보하고 본 문서에 링크
- [ ] 403 권한 UI(권한 제한/접근 불가) 시나리오를 수동 검증해 결과 기록
- [ ] 핵심 5개 화면에서 FIX 0을 확인한 뒤 종합 판정 갱신

## 2026-04-15 1:1 정렬 라운드(전체 화면)

- Stitch 화면 ID와 모바일 화면의 1:1 대응표를 문서화: `docs/design/mobile-stitch-screen-map.md`
- 토큰 보정: `spacing/icon/shadow`를 Stitch 화면 대조 기준으로 재조정
- 공통 UI 보정: `SectionLabel`, `Badge` 톤, `Title/Body/Muted` line-height 조정
- 메인 탭 5개(`Home/Todos/Food/Plan/Community`) 간격/레이블/칩/FAB 시각 재정렬
- 잔여 화면(`Notices/NoticeDetail/Login/MoreMenu/Diary/Stats/Settings/CommunityPost`) 계층/간격 정렬
- 네비게이션 톤 보정: 탭 높이/라벨 간격, 스택 헤더 shadow 제거
- 검증: `apps/mobile` 기준 `npm run typecheck` 통과, 린트 에러 0
- 주의: 에뮬레이터 dev-client 네트워크 이슈가 반복되는 환경에서는 최종 픽셀 승인 전 실기기 대조가 필요

## 2026-04-15 스타일 정렬 반영 내역

- 테마 토큰 확장: `ThemeContext`에 `spacing`, `radius`, `icon`, `shadow`를 추가해 화면별 하드코딩 스타일을 줄였다.
- 공통 UI 확장: `Ui.tsx`에 `Body`, `Chip`, `ListItem`, `EmptyState`, `Overlay`, `Fab`를 추가해 카드/칩/리스트/FAB 패턴을 통일했다.
- 네비 정렬: `RootNavigator`, `MoreStack`, `MainTabs`에서 헤더 타이포/탭 라벨 폰트/상태바 옵션을 테마 기반으로 통일했다.
- 핵심 화면 정렬: `Home`, `Todos`, `Food`, `Plan`, `Community` 화면에서 공통 UI 컴포넌트를 우선 적용해 Stitch 톤의 간격/라운드/상태 표현을 일치시켰다.
- 이미지 에셋 확인: `apps/mobile/assets`의 `icon`, `adaptive-icon`, `splash-icon`, `favicon` 경로가 `app.json`과 정합됨을 확인했다.

## 검증 개요

| 항목 | 내용 |
|------|------|
| 검증일 | 2026-04-15 (Stitch 3차 + 로그인 UI 정합) |
| 대상 코드 | `apps/mobile/` (Expo) |
| 기준 문서 | PRD `docs/requirements/prd-lifenote-integrated-app.md` §3·§6·§10, Stitch `docs/design/stitch-lifenote-handoff.md`, API `docs/requirements/api-contract-lifenote-v1.md` |
| 검증 방식 | **정적 코드 리뷰**(화면·API 경로·로딩/빈/오류 UI 패턴). **실기기 OAuth·픽셀 단위 시각**은 본 문서만으로 완료 처리하지 않음. |

### 판정 기호

| 기호 | 의미 |
|------|------|
| ✅ | PRD/계약 대비 구현·상태 처리가 코드상 충족 |
| ⚠️ | 부분 충족, PRD 후순위·미확정, 또는 **실기기/시각 검수 필수** |
| ❌ | 요구 대비 누락·불일치(개선 과제) |

---

## 1. PRD §6 화면·상태 UI (일반 회원 앱)

PRD: 각 주요 화면 — **기본, 로딩, 빈 데이터, 오류**, 권한 제한.

| 화면 | PRD 대응 | 로딩 | 빈 데이터 | 오류 | 권한(401 등) | 판정 |
|------|-----------|------|-----------|------|----------------|------|
| 홈 | 명언·할 일 완료율·식비·공지 일부 | `LoadingBlock` | 명언/공지 없음 문구 | `ErrorText` | `useApi` 401→리프레시/로그아웃 | ✅ |
| To-do | 목록·완료·추가·기한 | ✅ | `ListEmptyComponent` | ✅ | ✅ | ⚠️ 우선순위 편집은 표시만(PR §3.2 우선순위·기한 중 기한은 반영) |
| 식비 | 월 예산·일별·메모 | ✅ | 일별 목록 빈 상태 | ✅ | ✅ | ✅ |
| 주간 계획 | 슬롯 조회·저장 | ✅ | 슬롯 없음 안내 | ✅ | ✅ | ✅ |
| 일기 | 템플릿·날짜별 작성 | ✅ | 템플릿 없음, 일기 없음(404 처리) | ✅ | ✅ | ✅ |
| 공지 목록/상세 | 목록·상세 | 목록 ✅ / 상세 ✅ | 목록 빈 | ✅ | ✅ | ✅ |
| 커뮤니티 피드/상세 | 글·댓글 | ✅ | 피드·댓글 빈 | ✅ | ✅ | ✅ |
| 통계 | 집계 | ✅ | (API 성공 시 카드 표시) | ✅ | ✅ | ✅ `week` \| `month` \| `year` 칩(계약 §11.1) |
| 설정·프로필 | `/v1/me`, 표시명, 테마 | 초기 `me` 없이 카드 표시(명시적 스켈레톤 없음) | — | ✅ | ✅ | ⚠️ 초기 로딩 UX는 **수동 확인** 권장 |
| SNS 로그인 | 구글 | 버튼 `loading`·Stitch 히어로·`응답 type=error`·`409` 연동 안내·재시도 | 웹 클라이언트 ID 미설정 시 별도 분기 | `ErrorText` / 오류 카드 | — | ⚠️ **Android `androidClientId`/패키지·SHA-1** 등은 환경·콘솔 설정에 의존(실기기 필수) |

**내비게이션:** PRD §9.1 앱 — 하단 탭(홈·할 일·식비·계획) + 더보기 스택(일기·공지·커뮤니티·통계·설정). 루트 스택에 공지 상세·게시글·`__DEV__` 토큰 화면. ✅

---

## 2. PRD MVP·확장 범위 (§10) 대비

| PRD MVP 항목 | 구현 요약 | 판정 |
|---------------|-----------|------|
| 구글 SNS 로그인 | OAuth 코드 → `POST /v1/auth/oauth/exchange` | ⚠️ 위와 동일(환경·실기기) |
| To-do + 완료율 | 목록·토글·기한(추가·모달 수정)·홈 요약 | ⚠️ 우선순위 값 편집 UI 없음(표시만) |
| 주간 계획 | `PUT /v1/plans/weeks/:weekStart` 등 | ✅ |
| 일기 + 템플릿 | 템플릿 목록·날짜별 GET/PUT | ✅ |
| 식비 월·일·잔액·메모 | 월 PUT, 일 PUT, 메모 필드 | ✅ |
| 공지 열람 | 목록·상세 | ✅ |
| 명언 배너 | 홈 `quoteBanner` | ✅ |
| 커뮤니티(2차 PRD 표기 vs 현재 코드) | 피드·작성·상세(목록 파라미터)·댓글 | ✅ (단건 GET API 없음은 RC 핸드오프와 동일) |

---

## 3. API 계약 (`api-contract-lifenote-v1.md`) 주요 경로

| 용도 | 앱에서 사용하는 경로(코드 기준) | 판정 |
|------|--------------------------------|------|
| 홈 요약 | `GET /v1/home/summary` | ✅ |
| 공지(비인증 일부) | `GET /v1/notices?...`, 상세 | ✅ |
| To-do | `GET/POST/PATCH /v1/todos` | ✅ |
| 식비 | `GET/PUT .../budgets/food/months/...`, days | ✅ |
| 계획 | 주간 PUT 등 | ✅ |
| 일기 | templates, `GET/PUT /v1/diaries/:date` | ✅ |
| 커뮤니티 | posts, comments API | ✅ |
| 통계 | `GET /v1/stats/summary?range=` `week` / `month` / `year` | ✅ |
| me | `GET/PATCH /v1/me` | ✅ |

---

## 4. Stitch·디자인 시스템 대비 (`stitch-lifenote-handoff.md`)

### 4.1 SNS 로그인 (MVP) — Stitch 감사 요약

| Stitch (`screens/1dd03991f80f4a048030813e9ca33630`) | 앱 (`LoginScreen`) |
|-----------------------------------------------------|-------------------|
| 브랜드 타이틀·부제(예: 하루 기록 톤) | `lifeNote` 32px Manrope + 「하루를 기록하는 습관」 |
| SNS CTA 복수(예: 카카오·이메일) | **Google 단일** CTA + 이메일 직접 로그인은 준비 중 문구 |
| State: 로딩 / OAuth 오류+재시도 / 연동 충돌 | `busy` 문구, `response.type === 'error'`, 오류 카드+재시도, API `error.code === 'CONFLICT'` 시 연동 안내 카드 |
| (개발) 리디렉션 URI | `__DEV__` 전용 카드 유지 |

| 항목 | Stitch·PRD §13.1 기준 | 앱 구현 (`theme/colors`, `MainTabs`, `Ui`, `App.tsx`) | 판정 |
|------|------------------------|--------------------------------------------------------|------|
| Primary 시드 | `#2D6A4F` | 라이트 `primary` = `#2D6A4F`, 다크 `#52B788`(가독) | ✅ 토큰 반영 — **Stitch 스크린샷과 픽셀 일치**는 별도 시각 검수 |
| 타이포 | Manrope + Inter | `expo-font` + `@expo-google-fonts/manrope` / `inter`, `ThemeContext.fonts` + `Ui` 컴포넌트 | ✅ — **크기·행간**은 시각 검수 |
| 탭 표현 | 화면별 하단 내비 | `Ionicons` + 라벨, 활성색 `primary` | ⚠️ 아이콘 형태는 Stitch 산출과 다를 수 있음 |
| 라운드·카드 | Stitch `ROUND_TWELVE` | `Card` 12px, 리스트 행 12px(통계·커뮤니티·공지 등) | ⚠️ 수치·여백 일치는 **시각 검수** |
| 다크 모드 | 라이트 기준 + 토큰 대칭 | `ThemeContext` + 수동 라이트/다크/시스템 | ✅ 구조 충족, **대비**는 시각 검수 |
| 통계 요약 | `screens/fa1c858125d3420ca709f1506308081c` | `StatsScreen` — 주·월·연 칩, 기본/빈/오류·재시도 카피 정합 | ⚠️ 시각 검수(차트 vs 수치 표시) |
| 커뮤니티 피드 | `screens/fdeaf95b5c744ec0935877662f5feb98` | `CommunityScreen` — 전체 피드·FAB·빈/오류 카피 | ⚠️ 작성 폼은 FAB 토글(스티치와 패턴 동등) |
| 커뮤니티 상세·댓글 | `screens/2aded8ac6cd5460293fdbe3429b7cd0c` | `CommunityPostScreen` — 댓글 수 라벨·오류 재시도 | ⚠️ 삭제 글 전용 상태는 API 단건 부재로 미구현 |
| 공지 목록(회원) | `screens/9d1a679a811a4755a48aa42f898a2b1d` | `NoticesScreen` — 제목·날짜·NEW/중요 배지·빈/오류 | ⚠️ 시각 검수 |
| 공지 상세(회원) | `screens/b1c6883c93ae48c282fd09d0c228eacb` | `NoticeDetailScreen` — 404 안내·재시도 | ⚠️ 시각 검수 |
| 더보기 허브 | `screens/30214a01e5b5460eb3f6caa8647b6891` | `MoreMenuScreen` — 섹션(서비스·도구·계정)·행 › | ⚠️ 스티치 예시 항목(명언 허브·1:1 문의 등)은 앱 메뉴와 범위 차이 |
| 설정·프로필 | `screens/58d954d20a5b47bd99613d646036ccae` | `SettingsScreen` — 섹션·앱 버전(`expo-constants`)·오류 재시도 | ⚠️ 스티치 토글 단일 다크 vs 앱 3모드 — 의도적 |
| 로그인 | `screens/1dd03991f80f4a048030813e9ca33630` | `LoginScreen` — SafeArea·세로 중앙 히어로, Google 풀폭 CTA(`Ui` 버튼 12px), OAuth/교환 오류·`CONFLICT`·재시도 | ⚠️ Stitch의 카카오·이메일 CTA는 미구현 — 스크린샷 픽셀 대조 |

---

## 5. 종합 요약

| 구분 | 결론 |
|------|------|
| **PRD 화면 커버리지** | §6 열거 화면 모두 앱에 존재하며, 대부분 로딩·오류·빈 상태가 코드상 반영됨. |
| **PRD 세부 정책** | To-do **기한·통계 기간 필터** 반영됨. 우선순위 편집·식비 외 카테고리 등은 여전히 **⚠️/PRD 미확정**과 정합. |
| **Stitch 시각** | 통계·커뮤니티·공지·더보기·설정·**로그인**에 스크린 ID 또는 감사 표(`stitch-lifenote-handoff.md`, §4.1). 로그인은 Google 단일 제약 하에 히어로·상태 UI 정합. **픽셀·아이콘**은 **수동 대조** 권장. |
| **실기기·OAuth** | 본 문서의 정적 검증만으로 **전부 통과 처리 불가**. `.env`, Google 콘솔, Android 클라이언트 ID·SHA-1 검증 필요. |

### 권장 후속

1. 실기기에서 RC 체크리스트(`rc-uat-handoff.md`) 항목을 수동 수행하며 `[x]` 갱신.
2. Stitch 스크린샷과 화면별 **간격·아이콘·행간** 대조.
3. To-do **우선순위** 변경 UI가 필요하면 API `PATCH`와 폼 추가 후 본 표 갱신.

## Vault

- [[lifeNote/docs/qa/rc-uat-handoff|RC·UAT]]
- [[lifeNote/docs/design/stitch-lifenote-handoff|Stitch 이관]]
