---

## type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-16T20:30:00
tags: [mobile, stitch, pixel-check, gate-hold]

# 모바일 Stitch 픽셀 갭 체크리스트

## 현재 단계 판정

- 완료 아님
- QA Gate 보류 (실기기 픽셀 증빙 미완)

## 이슈 등급 요약

- **BLOCKER**: 실기기 캡처 기반 픽셀 증빙 미완료로 최종 승인 불가
- **MAJOR**: Todos 반복 규칙(`once`)의 null 날짜 차단 로직을 실기기/스테이징에서 최종 검증 필요
- **MAJOR**: 403 권한 UI 상태의 화면별 표현 일관성 점검 필요
- **MINOR**: 핵심 5개 화면의 잔여 FIX 재확인 및 메모 정리 필요

## 다음 액션 체크리스트

- [ ] 실기기 캡처(핵심 5개 + 보조 화면)를 첨부해 픽셀 증빙 완료
- [ ] Todos 반복 규칙 결함 차단: `scheduleType=once` + `schedule.date=null` 요청이 4xx로 거절되는지 확인
- [ ] 403 권한 UI(권한 제한/접근 불가) 화면별 표시를 수동 점검
- [ ] 핵심 5개 화면(Home/Todos/Food/Diary/NoticeDetail)에서 FIX 0개 확인

## 사용 방법

- 기준: Stitch 화면(우선) + handoff 토큰(보정)
- 우선순위: `Home -> Todos -> Food -> Diary -> NoticeDetail`
- 판정: `PASS` / `FIX` / `N/A`
- `FIX`는 반드시 메모에 수치 또는 위치를 남긴다.

## 공통 체크 항목 (모든 화면 공통)


| 항목                           | 판정  | 메모  |
| ---------------------------- | --- | --- |
| 상단 타이틀 font-size/line-height |     |     |
| 섹션 라벨(SectionLabel) 시각 톤     |     |     |
| 카드 라운드/보더 대비                 |     |     |
| 카드 간 vertical spacing rhythm |     |     |
| 본문 텍스트 line-height           |     |     |
| 버튼 높이/텍스트 정렬                 |     |     |
| 아이콘 크기/위치(탭/FAB/배지)          |     |     |
| 로딩/빈/오류 상태 톤 일관성             |     |     |
| 다크 모드 대비(텍스트/보더/배경)          |     |     |


---

## 1) Home (`b9fcf59c776642e6b8edd1a6e46199ab`)


| 항목                   | 판정  | 메모  |
| -------------------- | --- | --- |
| 타이틀/기준일/명언 계층        | PASS | 명언 히어로 톤으로 재배치, source 보조텍스트 정렬 반영 |
| 요약 카드(할 일, 식비) 간격/높이 | PASS | 할 일/식비 카드 정보계층과 CTA 위치를 Stitch 구조로 보정 |
| 공지 리스트 셀 패딩          | PASS | 리스트형 대신 Stitch 톤의 공지 카드 밀도와 셀 패딩으로 재정렬 |
| 공지 셀 텍스트 줄바꿈/말줄임     | PASS | 중요 배지 + 제목 2줄 절삭으로 시안 정보 밀도에 맞춤 |


## 2) Todos (`18a8cafbe56c4176802c0864961a3753`)


| 항목                | 판정  | 메모  |
| ----------------- | --- | --- |
| 입력 카드(제목/기한) 간격   | PASS | 추가·수정 폼을 FAB→전면 모달로 분리(`TodoFormModal`), Chip/필드 간격은 DS 토큰 유지 |
| 주·월 범위 진행률 카드      | PASS | `TodosScreen`: 일별과 동일 카드 패턴·라벨(이번 주/선택 주·이번 달/선택 월) |
| 상세 시각(am/pm 전용) | PASS | 시간대가 오전/오후일 때만 「상세 시각」 노출·저장, 종일 전환 시 값 자동 제거 (`once`는 날짜 아래 별도 시간 섹션 없음) |
| 목록 셀 높이/텍스트 베이스라인 | PASS | 서버 정렬(dueAt 동일 시 `timeLocal`); 보조줄에 `timeLocal`·`dueAt` 시각 표시 |
| 완료 상태 취소선 표현      | PASS | 체크 아이콘 토글 시 제목 `line-through` |
| 기한 수정 모달 오버레이 대비  | PASS | 날짜 전용 모달 제거, 동일 모달에서 전체 일정·우선순위 수정(PATCH) |
| 반복 타입 선택 UI(once/daily/weekly/monthly/interval/someday) | PASS | `someday` 칩 추가; once·반복 시작/종료일은 달력 모달, once는 시간 선택(Android 네이티브 time) |
| `once + date=null` 검증 오류 노출(클라이언트/서버) | FIX | 실기기/스테이징에서 POST·PATCH 차단 메시지 노출 재확인 필요 |


## 3) Food (`a2e2b7f5307d43dc875ffcb5aa88d5bb`)


| 항목             | 판정  | 메모  |
| -------------- | --- | --- |
| 월 예산 카드 계층/간격  | PASS | `FoodScreen`: 월 헤더(‹ YYYY년 M월 ›)·남은 금액 강조·지갑 아이콘·이번 달 예산/누적 사용 행·예산 입력·Stitch 톤 |
| 카테고리 예산 UX | PASS | 월 예산 모달 내 카테고리 예산(Top3 기본 + 더보기), 합계/초과/미설정 상태 문구로 soft split 안내 |
| 일별 지출 셀 타이포 계층 | PASS | 날짜 `Muted` → 메모 `Body` → 금액 trailing `−n`·Material 아이콘(메모 키워드 휴리스틱) |
| 날짜/메모 보조 텍스트 톤 | PASS | Stitch 최근 기록 행과 동일 계층 |
| 빈 상태 카드 정렬     | PASS | `inventory-2` + 「기록이 없어요」+ 보조 `Muted` |


## 4) Diary (`969235ea993246fc8e38cd2316b22155`)


| 항목 | 판정 | 메모 |
| --- | --- | --- |
| 회고형 입력 가이드 문구 노출 | PASS | 지출/할 일 완료 감상 중심 문구 노출 여부 확인 |
| 템플릿/자유 입력 전환 흐름 | PASS | 템플릿 선택 후 본문 편집 및 저장 흐름 확인 |
| 저장/수정 후 목록 반영 | PASS | 당일 일기 저장/수정이 즉시 반영되는지 확인 |


## 5) NoticeDetail + Inquiry (`b1c6883c93ae48c282fd09d0c228eacb`)


| 항목 | 판정 | 메모 |
| --- | --- | --- |
| 공지 하단 문의 진입 버튼 노출 | PASS | NoticeDetail 하단에서 문의 진입 확인 |
| 문의 등록 폼 필드/검증 | PASS | 제목·내용 필수 검증 및 저장 흐름 확인 |
| 문의 상태 표시(`submitted/in_review/answered`) | PASS | 내 문의 목록/상세 상태 배지 문구 확인 |


---

## 보조 화면 체크 (완료 전 필수)


| 화면            | Stitch ID                          | 판정  | 메모  |
| ------------- | ---------------------------------- | --- | --- |
| Notices       | `9d1a679a811a4755a48aa42f898a2b1d` |     |     |
| NoticeDetail  | `b1c6883c93ae48c282fd09d0c228eacb` |     |     |
| Login         | `1dd03991f80f4a048030813e9ca33630` |     |     |
| MoreMenu      | `30214a01e5b5460eb3f6caa8647b6891` |     |     |
| Diary         | `969235ea993246fc8e38cd2316b22155` |     |     |
| Stats         | `fa1c858125d3420ca709f1506308081c` |     |     |
| Settings      | `58d954d20a5b47bd99613d646036ccae` |     |     |
| Inquiry       | `공지 상세 하단 연계` |     |     |


---

## 최종 마감 규칙

- 핵심 5개 화면(Home/Todos/Food/Diary/NoticeDetail)에서 `FIX` 0개가 될 때까지 반복
- 보조 화면에서 `FIX`가 남아도 릴리즈 시점에는 반드시 잔여 갭 명시
- `rc-uat-handoff.md`의 실기기 체크와 동기화

## 배포 전 반복 규칙 테스트(필수)

- [ ] `POST /v1/todos`에서 `scheduleType=once`, `schedule.date=null` 요청 시 4xx(`VALIDATION_ERROR`)가 반환된다.
- [ ] `PATCH /v1/todos/{id}`에서 `scheduleType=once`, `schedule.date=null` 변경 시 4xx가 반환된다.
- [ ] `GET /v1/todos?date=YYYY-MM-DD` 기준으로 `once` 일정은 해당 날짜에만 노출된다.
- [ ] `daily/weekly/monthly/interval` 일정이 `date` 기준으로 예상대로 노출된다.

