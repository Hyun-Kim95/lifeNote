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
1. `scripts/obsidian/install-hook.ps1`로 Git `post-commit`을 설치하면, **커밋할 때마다** (a) `write-commit-journal.ps1`가 저널을 `.../journal`에 추가하고(실패해도 커밋은 유지되며), (b) `sync-docs.ps1`가 문서를 볼트 `.../docs`에 반영한다.
2. 훅 없이 수동으로만 동기화하려면 `scripts/obsidian/sync-docs.ps1`만 실행하면 된다.
3. Obsidian 대시보드에서 Dataview로 프로젝트/저널/데일리 로그를 조회한다.

볼트 경로·슬러그는 레포 루트의 `.obsidian-ingest.json`으로 맞춘다. 이 파일은 **저장하지 않아도 되며**(`.gitignore`에 포함), `sync-docs.ps1` 실행 시 Git 루트 폴더명 기준으로 **없으면 자동 생성**되고, `slug`가 폴더명과 다르면 **폴더명에 맞게 보정**된다. 수동 예시는 `docs/obsidian/obsidian-ingest.example.json`을 참고한다.

## 문서를 옵시디언 노트 형태로 (frontmatter + Vault 링크)

`docs/requirements`, `docs/qa`, `docs/design`, `docs/decisions`, `docs/changelog` 아래 `.md` 중 **맨 앞이 `---`가 아닌 파일**에 공통 YAML(`type`, `project`, `doc_lane`, `updated_at`, `tags`)과 맨 아래 `## Vault` 위키링크 블록을 추가한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\obsidian\normalize-doc-frontmatter.ps1"
```

이미 frontmatter가 있는 파일은 건너뛴다. 새 문서를 추가한 뒤 위 스크립트를 다시 실행하면 된다.

`## Vault`의 커밋 링크는 `[[…/journal]]`이 아니라 **`commit-journal-overview` 대시보드**를 가리킨다. 전자는 옵시디언이 빈 `journal.md` 노트를 만들어 백링크가 몰리는 문제가 있어서 피한다.

## Cursor에서 자동 설치
- 세션 시작 시 `.cursor/hooks/bootstrap-obsidian-once.ps1`가 한 번 실행되며, Git 레포면 `install-hook.ps1`까지 호출할 수 있다.
- 에이전트가 파일을 쓸 때(`Write`/`TabWrite`) `.cursor/hooks/ensure-obsidian-git-hook.ps1`가 `post-commit`이 올바른지 보고, 없거나 예전 형식이면 `install-hook.ps1`를 실행한다. (수동으로 `install-hook`을 안 돌려도 된다.)
- 훅 형식을 바꾼 뒤에는 `.cursor/state/obsidian-post-commit.ok`를 지우거나 `post-commit`을 삭제하면 다음 편집 때 다시 맞춘다.

## Backlink Tips
- 문서 끝에 `Related Project`, `Related Journals` 섹션을 두고 위키링크를 넣는다.
- 프로젝트 중심 허브는 `[[<project>/docs/_project-doc-index]]`를 기준으로 연결한다.
