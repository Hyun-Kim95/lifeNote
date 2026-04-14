# Obsidian Workspace Kit

이 폴더는 프로젝트 복사 시 함께 가져가도록 만든 Obsidian 활용 기본 세트다.

## Included
- `templates/`
  - `project-doc-template.md`
  - `daily-log-template.md`
- `dashboards/`
  - `projects-overview.md`
  - `commit-journal-overview.md`
  - `daily-log-overview.md`

## Core Flow
1. `scripts/obsidian/sync-docs.ps1`로 문서를 `D:\Obsidian\projects/<project>/docs`로 동기화한다.
2. 커밋 시 `scripts/obsidian/write-commit-journal.ps1`가 저널을 `.../journal`에 생성한다.
3. Obsidian 대시보드에서 Dataview로 프로젝트/저널/데일리 로그를 조회한다.

## Backlink Tips
- 문서 끝에 `Related Project`, `Related Journals` 섹션을 두고 위키링크를 넣는다.
- 프로젝트 중심 허브는 `[[<project>/docs/_project-doc-index]]`를 기준으로 연결한다.
