---
type: doc
project: lifeNote
doc_lane: qa
updated_at: 2026-04-15T00:19:04
tags: [docs, vault-sync]
---
# qa

이 폴더는 QA 체크리스트와 검증 메모를 저장한다.

고객사 전체 납품 흐름에서 테스트 문서 작성·실행 단계는 `.cursor/skills/client-project-lifecycle/SKILL.md` 단계 5를 따른다.  
선택 **리뷰어 GATE** 루브릭은 `reviewer-gate-rubric.md`를 참고한다.

예시:
- 기능별 QA 체크리스트
- 배포 전 점검표
- 회귀 테스트 메모
- 모바일/웹 확인 항목

권장 파일명 예시:
- feature-checklist.md
- release-checklist.md
- admin-table-qa.md
- stage3-entry-checklist.md

관리자 화면 **자동 증빙 이미지**(Playwright)는 `evidence/` 를 참고한다. 생성: `npm run e2e:evidence -w web`.
## Vault

- [[lifeNote/docs/_project-doc-index|Hub]]
- [[lifeNote/docs/obsidian/dashboards/projects-overview|Dashboards]]
- [[lifeNote/docs/obsidian/dashboards/commit-journal-overview|Commit journals (Dataview)]]
