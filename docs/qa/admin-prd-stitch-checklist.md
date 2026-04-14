---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15T00:18:55
tags: [docs, vault-sync]
---
# 관리자 화면 검증 체크리스트 (PRD + Stitch)

최종 갱신: 2026-04-15  
대상 구현: `apps/web/src/app/admin/page.tsx`

---

## 1) PRD 요구 항목 체크리스트

기준 문서: `docs/requirements/prd-lifenote-integrated-app.md`, `docs/requirements/api-contract-lifenote-v1.md` (§9 공지 노출 규칙, §13.2 관리자 공지 `isDraft` 반영)

| 항목 | PRD/계약 요구 | 현재 구현 | 판정 |
|---|---|---|---|
| 관리자 접근 권한 | 관리자 권한 기반 접근 | `AuthGuard(requiredRole="admin")` 적용 | 통과 |
| 공지사항 관리 목록 | 필터(기간/상태/검색), 페이지네이션(기본 15) | 기간/상태/검색 필터 + pageSize 15 + 페이지네이션 적용 | 통과 |
| 명언 배너 관리 목록 | 배너 목록/필터/페이지네이션 | 활성 필터 + 목록/페이지네이션 적용 | 통과 |
| 회원 관리 목록 | 검색/상태/목록/페이지네이션 | 검색/상태/목록/페이지네이션 적용 | 통과 |
| 공지 고정 여부 확인 | `pinned` 표시 | 배지(고정) 표시 | 통과 |
| 공지 기간 표시 | `publishStartAt`/`publishEndAt` 표시 | 기간 컬럼 표시 | 통과 |
| 관리자 테이블 규칙 | 기본 pageSize 15 | `PAGE_SIZE = 15` | 통과 |
| 공지/배너/회원 CRUD 액션 | 목록 외 생성/수정/삭제/상세 흐름 | 공지(등록/수정/삭제), 배너(등록/수정/삭제), 회원(상세/상태변경/닉네임수정) 반영 | 통과 |
| 빈/오류/로딩 상태 | 상태 UI 필요 | `EmptyState/ErrorState/LoadingState` 반영 | 통과 |
| 공지 임시저장·자동 상태 | 임시저장은 관리자만, 기간 기반 자동 상태 | API·관리자 UI 반영 (`isDraft`, 계산된 `status`) | 통과 |

---

## 2) Stitch 대비 UI 체크리스트

기준 문서: `docs/design/stitch-lifenote-handoff.md`  
대응 화면:

- 공지사항 관리 목록: `screens/4d148465ed6c4b66a4ba67c08d3f028b`
- 명언 배너 관리: `screens/b7e2ef24f90146d78df96bd99221bdda`
- 회원 관리 목록: `screens/d696688a674148239ee542da71d69cb9`

| 항목 | Stitch 기준 | 현재 구현 | 판정 |
|---|---|---|---|
| 관리자 레이아웃 | 좌측 메뉴 + 우측 메인 | 동일 구조 반영 | 통과 |
| 상단 헤더 구조 | 화면 타이틀 + 우측 액션 | 타이틀 + 테마 토글 + 사용자 배지 + 로그아웃 | 통과 |
| 필터 영역 배치 | 테이블 상단 수평 배치 | 동일 패턴 배치 | 통과 |
| 테이블형 목록 | 헤더/바디 구분, 행 단위 | 동일 패턴 반영 | 통과 |
| 페이지네이션 위치 | 하단 중앙 | 하단 중앙 반영 | 통과 |
| 버튼/보더 톤 | primary seed 계열, 둥근 모서리 | primary/보조 버튼 톤 + 모달 액션 버튼 반영 | 통과 |
| 컬럼 구성 정합 | 공지(작업컬럼 포함), 배너(상태/작업), 회원(작업) | 작업 컬럼/버튼 반영 완료 | 통과 |
| 텍스트/카피 정합 | Stitch 화면 문구 톤 | 상태 라벨·필터·모달 라벨 한글 정리 | 통과 |
| 행 액션 존재 | 미리보기/수정/삭제/상세 등 | 공지 미리보기·수정·삭제, 배너 수정·삭제, 회원 상세 | 통과 |
| 다크모드 시각 정합 | 톤 유지 | 수동 테마 토글 + 토큰 기반 변수 | 통과 |
| Stitch 픽셀 단위 일치 | 디자인 산출물과 동일 간격·타이포 | **수동 시각 리뷰 권장**(자동 판정 불가) | 수동 확인 |

---

## 3) 통과/미통과 판정표 + 잔여 항목

### 종합 판정

- **기능·PRD·계약 기준**: 통과 (관리자 CRUD, 공지 규칙, API 문서 동기화)
- **Stitch 화면 정합 기준**: **통과(구현·카피·구조)** / 픽셀 단위는 **수동 확인** 권장

### 증빙 (자동 생성)

| 항목 | 경로 | 비고 |
|------|------|------|
| 공지 탭 캡처 | `docs/qa/evidence/admin-notices.png` | Playwright 모킹 API |
| 배너 탭 캡처 | `docs/qa/evidence/admin-banners.png` | 동일 |
| 회원 탭 캡처 | `docs/qa/evidence/admin-members.png` | 동일 |
| 생성 절차 | `docs/qa/evidence/README.md` | `npm run e2e:evidence -w web` |

### 잔여(선택)

1. **Stitch 대비 픽셀 검수**: Figma/Stitch 화면과 나란히 두고 간격·폰트 크기만 조정할지 여부(디자인 합의 필요).
2. **실서버/스테이징 캡처**: 배포 후 동일 화면을 실데이터로 한 번 더 촬영하면 운영 증빙으로 보완 가능.

### 재검증 로그

- 2026-04-14: `apps/web` 기준 `npm run build` 성공
- 2026-04-15: `api-contract-lifenote-v1.md` 공지 §9·§13.2 갱신 (`isDraft`, 노출 규칙)
- 2026-04-15: `npm run e2e:evidence -w web` 로 `docs/qa/evidence/*.png` 생성
## Vault

- [[lifeNote/docs/_project-doc-index|Hub]]
- [[lifeNote/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[lifeNote/docs/obsidian/dashboards/commit-journal-overview|Commit journals (Dataview)]]
