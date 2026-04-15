# Rules context notes

`.cursor/rules/`의 규칙 다수가 `alwaysApply: true`로 로드될 수 있다. 작업에 집중하려면 대화에서 특정 규칙 파일을 `@`로 지정해 참조할 수 있다(에디터·채팅에서 규칙을 불러오는 흐름이 있을 때).

## 한 줄 요약 (파일 → 목적)

| 파일 | 한 줄 목적 |
|------|------------|
| `00-global.mdc` | 최소 수정, 추적 가능한 변경, 요구 충족 점검 |
| `10-product-ui.mdc` | 모바일 우선·상태 UI·접근성 기본 |
| `15-git-commit-push.mdc` | 커밋/푸시 전 `.gitignore`·추적 대상 점검 |
| `20-web-vs-app.mdc` | 웹은 테이블/명시 탐색, 앱은 스크롤·리스트 |
| `30-table-pagination.mdc` | 테이블 화면: 필터·15건·하단 페이지네이션 |
| `40-dark-mode.mdc` | 다크/라이트·토큰·대비·전환 유지 |
| `50-index-css-contract.mdc` | 전역 스타일 기준 파일·Stitch 등 합의 |
| `60-delivery-gates.mdc` | Gate 1~3, 병렬 조건, DoD |
| `65-completion-gate-enforcement.mdc` | 완료/검증/출시 준비 판정 기준 |
| `70-client-lifecycle-default.mdc` | 고객 납품 대화 시 스킬·PRD 승인 전 구현 금지 |
| `75-plan-and-delegation.mdc` | 착수 전 계획, 라이트/풀, 분담·재계획 |

총괄 오케스트레이션은 저장소 루트의 `AGENTS.md`를 본다.
