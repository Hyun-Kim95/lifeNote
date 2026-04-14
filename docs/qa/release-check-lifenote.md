---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15T00:34:49
tags: [docs, vault-sync]
---
# lifeNote 배포 전 점검 (release-check)

실행일: 2026-04-15 (갱신)  
대상: 모노레포 `lifenote` (API / Web / Mobile)

## 1. 자동 검증 (로컬)

| 항목 | 명령 | 결과 |
|------|------|------|
| API 빌드 | `npm run build -w api` | 통과 (루트 `npm run build`에 포함) |
| Web 빌드 | `npm run build -w web` | 통과 |
| API e2e | `cd apps/api && npm run test:e2e` | 7 passed |
| Web 통합 E2E (기본) | `npm run e2e -w web` | 5 passed (인증·관리자 증빙·공개 라우트 스모크; 모킹 기반) |
| Web E2E (live 전용) | `npm run e2e:live -w web` | 1 passed (`/`·`/login` 등 공개 페이지; 토큰 불필요) |
| Web 관리자 UI 증빙 PNG | `npm run e2e:evidence -w web` | `docs/qa/evidence/*.png` 생성 |
| Mobile 타입 | `cd apps/mobile && npx tsc --noEmit` | 통과 |

## 2. 환경 변수

| 앱 | 파일 | 비고 |
|----|------|------|
| API | `apps/api/.env` (`.env.example` 참고) | `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, Google OAuth 등 |
| Web | `apps/web/.env.local` | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — 예시는 `apps/web/.env.example` |
| CI Secret | GitHub Actions Secret | (선택) 과거 실 API 연동용 토큰 보관 등; 웹 CI는 `npm run e2e -w web` 한 번으로 통합 검증 |

프로덕션에서는 **비밀 값을 저장소에 넣지 말고** 배포 플랫폼의 시크릿/환경 변수로 주입할 것.

## 3. UI·플랫폼 수동 확인 (스테이징/실서버 권장)

release-check 절차상 아래는 **실제 브라우저·기기**에서 한 번 더 확인하는 것이 안전하다.

- 웹: 반응형(모바일 폭), 다크모드(시스템/브라우저), 랜딩·로그인·관리자 등 **노출 라우트**의 로딩·빈·오류 상태(일반 사용자 기능 페이지는 웹에서 제거됨)
- 웹 인증: `/login` → `/auth/callback` → 세션 저장/로그아웃 동작
- 모바일: 실제 API URL(에뮬레이터 `10.0.2.2` vs 실기기 LAN IP), 토큰 입력 후 탭 전환
- 관리자: 필터·페이지네이션(15건) 동작, 관리자 토큰으로만 접근 가능 여부
- 관리자: 정적 증빙은 `docs/qa/evidence/` 및 `docs/qa/admin-prd-stitch-checklist.md` 참고

## 4. 알려진 경고·리스크

- Playwright E2E는 개발 서버(`next dev`) 기준으로 동작하며, 일부 Next.js 경고(예: `allowedDevOrigins`)는 **개발 모드 한정** 메시지일 수 있음. 프로덕션 빌드(`next build`)와 별도로 스테이징에서 확인 권장.
- Stitch와 픽셀 단위 일치는 별도 시각 검수 항목으로 남길 수 있음(기능·계약과 별개).

## 5. 배포 후 모니터링 포인트

- API: `GET /v1/health`, 5xx 비율, DB 연결 오류
- 인증: OAuth/Google, JWT 만료·리프레시 실패율
- CORS: 프로덕션 웹 출처가 `CORS_ORIGIN`에 포함되는지

## 6. 즉시 수정 권장 (이번 점검에서 반영한 항목)

- Next.js 모노레포 빌드 시 lockfile 경고 완화: `apps/web/next.config.ts`에 `outputFileTracingRoot` 설정
- Web 환경 변수 예시 추가: `apps/web/.env.example`
- 웹 인증 흐름 재구성: 토큰 수동 입력 제거, `login/callback` + 세션/리프레시 적용
- 웹 CI 추가: `/.github/workflows/ci.yml` (mock E2E 기본, secret 존재 시 live E2E)
- 인증 E2E 추가: `apps/web/tests/auth-flow.spec.ts`
## Vault

- [[lifeNote/docs/_project-doc-index|Hub]]
- [[lifeNote/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[lifeNote/journal|Commit journal]]
