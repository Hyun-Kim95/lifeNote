# lifeNote 모노레포

추천 스택: **NestJS + PostgreSQL(Prisma) + Next.js(App Router) + Expo**.

## Quick Start (실행/테스트)

### 1) API 실행

```bash
npm run dev:api
```

- 기본 주소: `http://localhost:4000`
- 헬스체크: `GET http://localhost:4000/v1/health`

### 2) 웹 실행

```bash
npm run dev:web
```

- 메인: `http://localhost:3000`
- 사용자 홈 화면: `http://localhost:3000/`
- 사용자 할 일 화면: `http://localhost:3000/todos`
- 사용자 식비 화면: `http://localhost:3000/budget`
- 사용자 계획 화면: `http://localhost:3000/plan`
- 사용자 일기 화면: `http://localhost:3000/diary`
- 사용자 커뮤니티 화면: `http://localhost:3000/community`
- 사용자 통계 화면: `http://localhost:3000/stats`
- 관리자 연동 화면: `http://localhost:3000/admin`

웹에서 API 연동 확인 시 `apps/web/.env.local`(예시는 `apps/web/.env.example`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

### 3) 모바일 실행

```bash
npm run dev:mobile
```

- Android 에뮬레이터 기본 API: `http://10.0.2.2:4000`
- iOS 시뮬레이터/웹: `http://localhost:4000`
- 실기기: `http://<내PC_로컬IP>:4000`

### 4) 로그인/인증 화면

- 웹 로그인: `http://localhost:3000/login`
- OAuth 콜백: `http://localhost:3000/auth/callback`
- 웹은 로그인 후 세션(localStorage) 기반으로 API를 호출합니다.
- 모바일은 앱 내 Access Token 입력 후 테스트합니다.

## 사전 요구

- Node.js LTS, npm
- 로컬 PostgreSQL(또는 원격 DB) — API용 `DATABASE_URL`

## 설치

저장소 루트에서:

```bash
npm install
```

## 개발 서버

| 대상 | 명령 | 비고 |
|------|------|------|
| API | `npm run dev:api` | 기본 `http://localhost:4000`, 경로 접두사 `/v1` |
| 웹 | `npm run dev:web` | 기본 `http://localhost:3000` |
| 앱 | `npm run dev:mobile` | Expo |
| 웹 통합 E2E(기본) | `npm run e2e -w web` | Playwright 모킹 플로우 |
| 웹 통합 E2E(실 API) | `E2E_ACCESS_TOKEN=<token> npm run e2e:live -w web` | 실 API 연동 확인 |

API 환경 변수 예시는 `apps/api/.env.example`를 참고해 `apps/api/.env`에 복사한다.
웹 연동 확인 시 `apps/web/.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`를 설정한다.
모바일 연동 확인은 `apps/mobile/App.tsx` 기본값(`http://10.0.2.2:4000`)을 사용하거나, 기기 환경에 맞는 API 주소로 입력해 테스트한다.

### Prisma `migrate dev` 오류 P3014 (shadow DB)

`데이터베이스를 만들 권한이 없음` / `could not create the shadow database` 는 **DB 사용자에게 DB 생성 권한이 없을 때** 납니다.

- **빠르게 스키마만 반영(로컬 개발)**  
  `apps/api`에서 `npm run prisma:push` (`prisma db push`) — 마이그레이션 히스토리는 쌓이지 않습니다.
- **`migrate dev`를 계속 쓰려면** 택1  
  - PostgreSQL 슈퍼유저로 `ALTER ROLE "연결에_쓰는_역할이름" CREATEDB;` 부여  
  - 또는 관리자가 **빈 DB** 하나(예: `lifenote_shadow`)를 만들고, `prisma/schema.prisma`의 `datasource db`에  
    `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")` 를 추가한 뒤 `.env`에 해당 URL 설정  
  (자세한 주석은 `apps/api/.env.example` 참고)

## API 헬스

- `GET /v1/health` → `{ "status": "ok" }`

## API 인증 (MVP)

- `POST /v1/auth/oauth/exchange` — Google `authorizationCode` + `redirectUri` (`.env`에 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `JWT_SECRET` 필요)
- `POST /v1/auth/refresh` — 바디 `refreshToken`
- `GET /v1/me`, `PATCH /v1/me` — `Authorization: Bearer <accessToken>`

비·2xx 응답은 계약서 §2 `error` 객체 형식을 따른다.

## API 도메인 (MVP 일부)

| 메서드 | 경로 | 인증 |
|--------|------|------|
| GET | `/v1/home/summary?date=` | Bearer |
| GET·POST·PATCH·DELETE | `/v1/todos` … | Bearer |
| GET·PUT | `/v1/budgets/food/months/{yearMonth}` … | Bearer |
| GET | `/v1/quote-banners/active` | 없음 |
| GET·PUT | `/v1/plans/weeks/{weekStart}` (`weekStart` = 월요일 `YYYY-MM-DD`) | Bearer |
| GET | `/v1/notices`, `/v1/notices/{id}` | 없음 |
| GET | `/v1/diary-templates` | 없음 |
| GET·PUT | `/v1/diaries/{date}` | Bearer |
| GET | `/v1/stats/summary?range=week|month|year&anchor=YYYY-MM-DD` | Bearer |
| GET/POST/PATCH/DELETE | `/v1/admin/notices` | Admin Bearer |
| GET/POST/PATCH/DELETE | `/v1/admin/quote-banners` | Admin Bearer |
| GET/POST/PATCH/DELETE | `/v1/admin/diary-templates` | Admin Bearer |
| GET/PATCH | `/v1/admin/users`, `/v1/admin/users/{id}` | Admin Bearer |
| GET·POST | `/v1/community/posts`, `/v1/community/posts/{id}/comments` | Bearer |
| POST | `/v1/community/reports` | Bearer |

DB 마이그레이션: `cd apps/api` → `npx prisma migrate deploy` (또는 `migrate dev`).

## 연동 화면

- 웹 사용자 홈/기능 화면: `apps/web/src/app/page.tsx` 및 각 기능 라우트(`todos`, `budget`, `plan`, `diary`, `community`, `stats`)
- 웹 관리자 콘솔: `apps/web/src/app/admin/page.tsx`
- 모바일 앱 화면: `apps/mobile/App.tsx`

요구·계약·디자인 문서는 `docs/requirements/`, `docs/design/`를 본다.
