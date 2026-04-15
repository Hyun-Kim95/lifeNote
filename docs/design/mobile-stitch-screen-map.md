---
type: doc
project: lifeNote
doc_lane: design
updated_at: 2026-04-15T22:05:00
tags: [mobile, stitch, mapping]
---

# 모바일 Stitch 화면 대응표 (1:1 기준)

## 기준
- Stitch 화면 우선, handoff 토큰/규칙은 보정값으로 사용
- 대상 앱: `apps/mobile/src/screens`

## 앱-스티치 매핑

| 앱 화면 | 코드 경로 | Stitch 화면 ID | Stitch 화면명 |
|---|---|---|---|
| 홈 | `apps/mobile/src/screens/HomeScreen.tsx` | `b9fcf59c776642e6b8edd1a6e46199ab` | 홈 (오늘) |
| 할 일 | `apps/mobile/src/screens/TodosScreen.tsx` | `14b92fc3eb8b4cef972aaa41df8972f3` | 오늘의 할 일 목록 |
| 식비 | `apps/mobile/src/screens/FoodScreen.tsx` | `a2e2b7f5307d43dc875ffcb5aa88d5bb` | 식비 기록 |
| 계획 | `apps/mobile/src/screens/PlanScreen.tsx` | `416c8f8a79864af1a32f6e382e8fc017` | 주간 계획표 |
| 일기 | `apps/mobile/src/screens/DiaryScreen.tsx` | `969235ea993246fc8e38cd2316b22155` | 일기 작성 |
| 로그인 | `apps/mobile/src/screens/LoginScreen.tsx` | `1dd03991f80f4a048030813e9ca33630` | SNS 로그인 (MVP) |
| 통계 | `apps/mobile/src/screens/StatsScreen.tsx` | `fa1c858125d3420ca709f1506308081c` | 통계 요약 |
| 커뮤니티 피드 | `apps/mobile/src/screens/CommunityScreen.tsx` | `fdeaf95b5c744ec0935877662f5feb98` | 커뮤니티 피드 |
| 커뮤니티 상세 | `apps/mobile/src/screens/CommunityPostScreen.tsx` | `2aded8ac6cd5460293fdbe3429b7cd0c` | 커뮤니티 글 상세 및 댓글 |
| 공지 목록 | `apps/mobile/src/screens/NoticesScreen.tsx` | `9d1a679a811a4755a48aa42f898a2b1d` | 공지사항 목록 (회원용) |
| 공지 상세 | `apps/mobile/src/screens/NoticeDetailScreen.tsx` | `b1c6883c93ae48c282fd09d0c228eacb` | 공지사항 상세 (회원용) |
| 더보기 | `apps/mobile/src/screens/MoreMenuScreen.tsx` | `30214a01e5b5460eb3f6caa8647b6891` | 더보기 메뉴 허브 |
| 설정 | `apps/mobile/src/screens/SettingsScreen.tsx` | `58d954d20a5b47bd99613d646036ccae` | 설정 및 프로필 |

## 네비게이션 범위
- 탭: `apps/mobile/src/navigation/MainTabs.tsx`
- 더보기 스택: `apps/mobile/src/navigation/MoreStack.tsx`
- 루트 스택: `apps/mobile/src/navigation/RootNavigator.tsx`

## 검수 우선순위
1. 홈/할 일/식비/계획/커뮤니티
2. 로그인/설정/더보기/통계
3. 공지 목록/상세/커뮤니티 상세/일기
