---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15
tags: [rc, uat, mobile]
---

# RC 핸드오프 — 2026-04-15

## RC 빌드 식별

- 저장소: lifeNote 모노레포
- 모바일 패키지: `apps/mobile` (Expo SDK 54)
- 검증: `cd apps/mobile && npm run typecheck` (`tsc --noEmit`) 통과

## 포함된 변경 요약

- 일반 회원 앱(Expo): Google OAuth 코드 교환 → JWT 저장·리프레시, 하단 탭 내비게이션, PRD §6에 대응하는 화면(홈·할 일·식비·주간 계획·일기·공지·커뮤니티·통계·설정).
- 라이트/다크/시스템 테마 및 `AsyncStorage` 기반 저장.
- `__DEV__` 전용 개발자 토큰 화면(로그인 스택 및 로그인 후 루트 스택).
- RC·UAT 정의 문서: [rc-uat-handoff.md](./rc-uat-handoff.md).

## 미구현·정책 미결·BLOCKER 아님

| 항목 | 비고 |
|------|------|
| 커뮤니티 단건 `GET` API | 상세는 목록 응답을 내비게이션 파라미터로 전달 |
| 픽셀 단위 Stitch 일치 | 기능·상태 위주 구현; 시각 검수는 별도 |
| 푸시·신고·대표 시간표 등 | PRD 미확정 구간; 본 RC 범위 밖 |

## UAT 시 권장 확인

1. `apps/mobile/.env`에 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 설정 후 Google 콘솔에 리디렉션 URI 등록.
2. API `GOOGLE_CLIENT_ID`·시크릿과 동일 Web 클라이언트 사용 권장.
3. 홈 새로고침·공지 상세·커뮤니티 글·댓글·식비 일별·계획 저장·일기 저장·설정 프로필·테마·로그아웃.

## 알려진 리스크

- Expo Go vs 개발 빌드에 따라 OAuth 리디렉션 URI가 달라질 수 있음 → 콘솔에 실제 출력 URI 등록 필요.
