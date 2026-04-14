# lifeNote API 계약 v1 (Gate 2)

- 문서 상태: **확정(초안 기준 구현 착수 가능)** — 필드 추가는 하위 호환·버전 정책으로 관리
- 기준 PRD: `prd-lifenote-integrated-app.md`
- 시각 기준: Stitch (`docs/design/stitch-lifenote-handoff.md`)
- 최종 수정: 2026-04-14

## 1. 공통 규칙

### 1.1 베이스 URL·버전

- 모든 클라이언트(웹·앱)는 동일 API 베이스를 사용한다.
- 경로 접두사: **`/v1`**
- 예: `https://api.example.com/v1/...` (실제 호스트는 환경별 설정)

### 1.2 포맷

- 요청·응답 본문: **JSON**, `Content-Type: application/json; charset=utf-8`
- 문자열: UTF-8
- 날짜·시각: **ISO 8601** (`2026-04-14`, `2026-04-14T09:30:00Z`). 클라이언트 표시는 로컬 타임존 변환.
- 금액: 정수 **원(KRW)** 단위 (`amountMinor` 또는 `amount` 필드명으로 통일 — 본 문서는 **`amount`** = 원 정수)

### 1.3 인증

| 방식 | 용도 |
|------|------|
| **Bearer JWT** | `Authorization: Bearer <access_token>` — 일반·관리자 API(권한은 클레임 `role`: `user` \| `admin`) |
| **Refresh** | `POST /v1/auth/refresh` (선택 구현) — 바디에 `refreshToken` |
| **OAuth** | SNS 로그인은 백엔드가 제공자와 직접 통신. 클라이언트는 **리다이렉트 URL** 또는 **모바일 SDK 토큰 교환** 엔드포인트로 위임(아래 §3). |

- 비로그인 공개: 공지 목록/상세, 활성 명언 배너, (선택) 일기 템플릿 목록.

### 1.4 Idempotency (선택)

- `POST` 중복 제출 방지가 필요한 경우 클라이언트가 `Idempotency-Key: <uuid>` 헤더를 보낼 수 있다. 서버는 동일 키에 대해 동일 응답을 보장(권장).

---

## 2. 오류 응답 (공통)

### 2.1 HTTP 상태 코드

| 코드 | 의미 | 사용 예 |
|------|------|---------|
| 400 | 잘못된 요청 | 검증 실패, 잘못된 JSON |
| 401 | 인증 필요 | 토큰 없음·만료 |
| 403 | 권한 없음 | 일반 사용자가 admin API 호출 |
| 404 | 없음 | 리소스 ID 불일치 |
| 409 | 충돌 | 동일 날짜 일기 중복 저장 정책 등 |
| 422 | 비즈니스 규칙 위반 | 예산 초과는 허용하되 경고가 필요하면 확장 필드로 처리 가능 |
| 429 | 과다 요청 | rate limit |
| 500 | 서버 오류 | |

### 2.2 응답 본문 (단일 스키마)

모든 비-2xx는 가능하면 아래 형태를 따른다.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "사람이 읽을 수 있는 한 줄 메시지",
    "details": [
      { "field": "amount", "issue": "must_be_non_negative" }
    ],
    "requestId": "corr-abc-123"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `error.code` | string | 예 | 아래 표의 기계 판별 코드 |
| `error.message` | string | 예 | UI 스낵바·토스트에 그대로 노출 가능한 수준(한국어 허용) |
| `error.details` | array | 아니오 | 폼 필드별 오류 |
| `error.requestId` | string | 권장 | 로그·CS 추적용 상관 ID |

### 2.3 `error.code` 표준 값

| code | HTTP | 설명 |
|------|------|------|
| `UNAUTHENTICATED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 부족 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 입력 검증 실패 |
| `CONFLICT` | 409 | 상태·유일성 충돌 |
| `RATE_LIMITED` | 429 | 호출 제한 |
| `INTERNAL_ERROR` | 500 | 내부 오류(메시지는 일반화) |

클라이언트는 **`code` + HTTP**로 분기하고, `message`는 사용자에게 표시하거나(민감 정보 없을 때) 일반 문구로 대체한다.

---

## 3. 인증·세션 (MVP)

### 3.1 `POST /v1/auth/oauth/exchange`

SNS(**1차: 구글**)에서 받은 **인가 코드** 또는 **ID 토큰**을 서버가 검증 후 자체 JWT 발급. (추가 제공자는 동일 엔드포인트에서 `provider` 값만 확장.)

**Request (예시 — 필드명은 실제 SDK에 맞게 조정)**

```json
{
  "provider": "google",
  "authorizationCode": "…",
  "redirectUri": "https://app.lifenote.example/oauth/callback"
}
```

**Response 200**

```json
{
  "accessToken": "jwt…",
  "expiresIn": 3600,
  "refreshToken": "…",
  "tokenType": "Bearer",
  "user": {
    "id": "usr_01j…",
    "displayName": "민지",
    "role": "user"
  }
}
```

- **401** `UNAUTHENTICATED` — 코드 무효, 제공자 오류
- **409** `CONFLICT` — 이미 다른 SNS에 연동된 이메일 등(정책 확정 후 사용)

### 3.2 `GET /v1/me`

현재 사용자 프로필.

**Response 200**

```json
{
  "id": "usr_01j…",
  "email": "user@example.com",
  "displayName": "민지",
  "role": "user",
  "profile": {
    "ageBand": "20s",
    "employed": true
  },
  "linkedProviders": ["google"]
}
```

### 3.3 `PATCH /v1/me`

`displayName`, `profile` 등 일부 필드만 허용.

---

## 4. 홈·요약 (옵션 — 네트워크 절약용 단일 호출)

### 4.1 `GET /v1/home/summary`

오늘 기준 대시보드 묶음. (없으면 클라이언트가 개별 API 조합)

**Query**

| 파라미터 | 설명 |
|----------|------|
| `date` | 기준일 `YYYY-MM-DD`, 기본 오늘(서버 TZ 또는 사용자 TZ는 정책 합의) |

**Response 200**

```json
{
  "date": "2026-04-14",
  "quoteBanner": {
    "id": "qb_…",
    "text": "작은 기록이…",
    "source": "lifeNote"
  },
  "todo": { "completed": 3, "total": 8, "percent": 38 },
  "foodBudget": {
    "yearMonth": "2026-04",
    "budgetAmount": 400000,
    "spentAmount": 275800,
    "remainingAmount": 124200,
    "todaySpentAmount": 18500
  }
}
```

- 명언·식비·todo 중 일부만 있어도 되며, 없으면 해당 키 `null` 또는 생략(문서화된 규칙으로 통일).

---

## 5. To-do

### 5.1 `GET /v1/todos`

**Query**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `dueOn` | date | 특정 일자 기준 |
| `status` | enum | `all` \| `open` \| `done` |
| `cursor` | string | 페이지네이션(커서) |
| `limit` | int | 기본 50, 최대 100 |

**Response 200**

```json
{
  "items": [
    {
      "id": "td_…",
      "title": "PRD 검토",
      "dueOn": "2026-04-14",
      "priority": "normal",
      "done": false,
      "createdAt": "2026-04-13T…Z",
      "updatedAt": "2026-04-13T…Z"
    }
  ],
  "nextCursor": null,
  "stats": { "completed": 5, "total": 8 }
}
```

### 5.2 `POST /v1/todos`

**Body**

```json
{ "title": "…", "dueOn": "2026-04-15", "priority": "high" }
```

### 5.3 `PATCH /v1/todos/{id}`

`title`, `dueOn`, `priority`, `done` 부분 갱신.

### 5.4 `DELETE /v1/todos/{id}`

**204** No Content.

---

## 6. 주간 계획표

### 6.1 `GET /v1/plans/weeks/{weekStart}`

`weekStart`: 해당 주 **월요일** `YYYY-MM-DD`.

**Response 200**

```json
{
  "weekStart": "2026-04-14",
  "weekEnd": "2026-04-20",
  "slots": [
    {
      "id": "sl_…",
      "dayOfWeek": 1,
      "period": "morning",
      "label": "운동",
      "sortOrder": 0
    }
  ]
}
```

`dayOfWeek`: 1=월 … 7=일. `period`: `morning` \| `forenoon` \| `afternoon` \| `evening` (PRD와 다르면 enum만 합의).

### 6.2 `PUT /v1/plans/weeks/{weekStart}`

전체 슬롯 교체(멱등). 또는 `POST/PATCH/DELETE` 세분화는 구현 편의에 따라 선택 — **문서와 구현 일치**가 우선.

---

## 7. 일기

### 7.1 `GET /v1/diary-templates`

(공개 또는 로그인) 템플릿 목록.

**Response 200**

```json
{
  "items": [
    { "id": "dtpl_…", "name": "감사 3줄", "schema": { "lines": 3 } }
  ]
}
```

### 7.2 `GET /v1/diaries/{date}`

`date` = `YYYY-MM-DD`. 없으면 **404** `NOT_FOUND` 또는 **200**에 `content: null` — **한 가지로 통일**할 것.

### 7.3 `PUT /v1/diaries/{date}`

**Body**

```json
{
  "templateId": "dtpl_…",
  "title": "선택",
  "body": "본문 마크다운 또는 순수 텍스트(정책 합의)"
}
```

**409** — 동일 날짜 저장 정책 충돌 시.

---

## 8. 가계부(식비)

정책: **월별 독립 예산**, 일별 지출 합산으로 잔액 계산. 서버가 `remainingAmount`를 계산해 반환하는 것을 권장.

### 8.1 `GET /v1/budgets/food/months/{yearMonth}`

`yearMonth` = `YYYY-MM`.

**Response 200**

```json
{
  "yearMonth": "2026-04",
  "budgetAmount": 400000,
  "spentAmount": 275800,
  "remainingAmount": 124200
}
```

### 8.2 `PUT /v1/budgets/food/months/{yearMonth}`

**Body** `{ "budgetAmount": 400000 }`

### 8.3 `GET /v1/budgets/food/months/{yearMonth}/days`

**Response 200**

```json
{
  "items": [
    {
      "date": "2026-04-14",
      "amount": 18500,
      "memo": "점심 도시락",
      "updatedAt": "…"
    }
  ]
}
```

### 8.4 `PUT /v1/budgets/food/months/{yearMonth}/days/{date}`

해당 일자 1건 upsert(또는 `POST`로 다건 — MVP는 1일 1건으로 단순화 가능).

**Body** `{ "amount": 18500, "memo": "…" }`

---

## 9. 공지(사용자 읽기)

**노출 규칙(구현 기준)**: `DRAFT`(임시저장)는 사용자 API에 포함되지 않는다. 게시 가능 여부는 `publishStartAt`·`publishEndAt`과 현재 시각을 비교해 결정된다(시작 전·종료 후는 목록/상세에 나타나지 않음).

### 9.1 `GET /v1/notices`

**Query**: `page`(1기본), `pageSize`(기본 20, 최대 50), `pinnedFirst=true`

**Response 200**

```json
{
  "items": [
    {
      "id": "nt_…",
      "title": "점검 안내",
      "pinned": true,
      "publishedAt": "…",
      "status": "published"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 42
}
```

### 9.2 `GET /v1/notices/{id}`

**Response 200** — `title`, `body`(HTML 또는 마크다운), `publishedAt` 등.

---

## 10. 명언 배너(앱 노출)

### 10.1 `GET /v1/quote-banners/active`

클라이언트는 홈에서 1건 또는 여러 건 중 로테이션.

**Response 200**

```json
{
  "items": [
    {
      "id": "qb_…",
      "text": "…",
      "source": "lifeNote",
      "priority": 10
    }
  ]
}
```

---

## 11. 통계 (MVP 최소)

### 11.1 `GET /v1/stats/summary`

**Query**

| 파라미터 | 설명 |
|----------|------|
| `range` | `week` \| `month` \| `year` |
| `anchor` | 기준일 `YYYY-MM-DD`, 기본 오늘 |

**Response 200**

```json
{
  "range": "week",
  "todo": { "completionRate": 0.62, "completed": 5, "total": 8 },
  "diary": { "daysWritten": 4 },
  "food": { "totalSpent": 92000, "budgetAmount": 400000 }
}
```

2차에서 시계열 배열 확장.

---

## 12. 커뮤니티 (2차 — 계약 예약)

MVP에 포함하지 않을 경우 엔드포인트는 구현 보류. 포함 시 아래를 구체화한다.

- `GET/POST /v1/community/posts`
- `GET/POST /v1/community/posts/{id}/comments`
- 신고: `POST /v1/community/reports`

---

## 13. 관리자 API

모든 경로 **`/v1/admin/...`** 접두사. **JWT `role=admin`** 필수. 아니면 **403** `FORBIDDEN`.

### 13.1 공통 목록 페이지네이션(웹 테이블)

| 파라미터 | 설명 |
|----------|------|
| `page` | 1부터 |
| `pageSize` | **기본 15** (프로젝트 테이블 규칙) |
| `sort` | 예: `-updatedAt` |

**Response** 공통 필드: `items`, `page`, `pageSize`, `totalCount`.

### 13.2 공지 관리

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/v1/admin/notices` | 필터: 기간, 상태, 검색어, 고정 여부 |
| POST | `/v1/admin/notices` | 생성 |
| GET | `/v1/admin/notices/{id}` | 상세 |
| PATCH | `/v1/admin/notices/{id}` | 수정 |
| DELETE | `/v1/admin/notices/{id}` | 삭제 |

**요청 Body(생성/수정)** 예: `title`, `body`, `pinned`, `isDraft`(boolean, 선택) — 임시저장이면 `true`. `publishStartAt`, `publishEndAt`(ISO 문자열 또는 빈 문자열로 해제).

- `isDraft=true`이면 DB상 `DRAFT`로 저장되며 사용자 공지 API에는 노출되지 않는다.
- `isDraft=false`(또는 임시저장이 아닌 일반 저장)이면 `publishStartAt`/`publishEndAt`과 서버 시각을 기준으로 `SCHEDULED` / `PUBLISHED` / `ENDED` 중 하나로 저장된다(시작일이 미래면 예약, 종료일이 과거면 종료, 그 외 게시중).

**응답(목록·상세)** 에서 `status`는 위 규칙에 따라 계산된 API 문자열(`draft|scheduled|published|ended`)이며, 상세에는 `isDraft`(boolean, 선택)가 포함될 수 있다.

### 13.3 명언 배너 관리

| 메서드 | 경로 |
|--------|------|
| GET | `/v1/admin/quote-banners` |
| POST | `/v1/admin/quote-banners` |
| PATCH | `/v1/admin/quote-banners/{id}` |
| DELETE | `/v1/admin/quote-banners/{id}` |

필드: `text`, `source`, `priority`, `active`, `startAt`, `endAt`.

### 13.4 회원 관리

| 메서드 | 경로 |
|--------|------|
| GET | `/v1/admin/users` |
| GET | `/v1/admin/users/{id}` |
| PATCH | `/v1/admin/users/{id}` | `status`: `active` \| `suspended` |

### 13.5 일기 템플릿 관리

| 메서드 | 경로 |
|--------|------|
| GET | `/v1/admin/diary-templates` |
| POST | `/v1/admin/diary-templates` |
| PATCH | `/v1/admin/diary-templates/{id}` |
| DELETE | `/v1/admin/diary-templates/{id}` |

### 13.6 팝업·메뉴·관리자계정·대표시간표 (3차 또는 2차)

- `GET/PATCH /v1/admin/popups` …
- `GET/PUT /v1/admin/navigation` …
- `GET/POST /v1/admin/staff` …
- `GET/PUT /v1/admin/schedule-templates` …

세부 스키마는 범위 확정 시 본 문서에 **같은 오류·페이지네이션 규칙**으로 추가한다.

---

## 14. 화면 상태 ↔ API 매핑 (클라이언트)

Stitch·PRD의 **로딩·빈·오류·권한**과 대응한다.

| UI 상태 | 클라이언트 동작 | 서버 신호 |
|---------|-----------------|-----------|
| 로딩 | 요청 중 스켈레톤 | 진행 중만 표시(응답 전) |
| 빈 데이터 | 200 + `items: []` 또는 본문 null | 별도 코드 불필요 |
| 오류 | 토스트 + 재시도 | 4xx/5xx + `error.code` |
| 권한 제한 | 로그인 유도 / 관리자만 | 401 / 403 |
| 충돌 | 메시지 + 재시도 또는 새로고침 | 409 |

- **네트워크 단절**: 클라이언트가 오프라인 감지 시 `INTERNAL_ERROR` 없이 로컬 메시지 표시(표준 코드 `NETWORK_OFFLINE`은 선택적 로컬 전용).

---

## 15. Gate 2 체크리스트

- [x] 엔드포인트 목록(MVP 중심) 및 관리자 네임스페이스
- [x] 인증 방식(JWT + OAuth 교환)
- [x] 오류 JSON 스키마 + 표준 `code`
- [x] 페이지네이션(관리자 15건 기본)
- [x] 화면 상태와 HTTP 매핑
- [ ] OpenAPI 3 YAML 자동 생성(구현 레포에서 선택)
- [x] 1차 `provider`: **`google`** (인가 코드 + `redirectUri` 권장). 추가 SNS 확정 시 §3.1·본 표 확장.

---

## 16. 변경 절차

계약 변경 시 `document-change` 또는 동등 프로세스로 본 파일과 PRD §8을 동기화하고, 프론트·백엔드에 공지한다.
