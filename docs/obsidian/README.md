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

볼트 경로·슬러그는 레포 루트의 `.obsidian-ingest.json`으로 맞춘다. 이 파일은 **저장하지 않아도 되며**(`.gitignore`에 포함), `sync-docs.ps1` 실행 시 Git 루트 폴더명 기준으로 **없으면 자동 생성**된다. 기본적으로 `slug`가 폴더명과 다르면 폴더명으로 보정하지만, `lockSlug: true`면 기존 `slug`를 유지한다. 수동 예시는 `docs/obsidian/obsidian-ingest.example.json`을 참고한다.

**`displayName`(선택):** 볼트 허브 노트의 H1·`display_name`·Dataview `name` 컬럼에 쓴다.

**`hubFileStem`(선택):** 허브 `.md` **파일명(확장자 제외)**을 ASCII로 고정할 때. 없으면 `displayName`을 파일명에 쓸 수 있게 살균하고, 그것도 없으면 `<slug>-docs-hub`가 된다. `sync-docs`는 예전 고정명 `_project-doc-index.md`가 남아 있으면(새 스템과 다를 때) 삭제한다. 위키링크·저널·`normalize-doc-frontmatter`는 모두 `Resolve-HubIndexStem.ps1`의 `Get-HubIndexStem` 규칙과 동일해야 한다.

**`syncMode`(선택):** 문서 동기화 방식. 기본은 `safe`(복사만 수행, Vault 대상 단독 파일 유지)이며, `mirror`는 소스 기준 완전 미러링(`/MIR`)으로 대상 단독 파일이 삭제될 수 있다.

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
- 문서 변경 감지 훅(`.cursor/hooks/sync-docs-on-doc-change.ps1`)은 기본 15초 쿨다운을 적용해 저장 연타 시 중복 동기화를 줄인다.
- 훅 형식을 바꾼 뒤에는 `.cursor/state/obsidian-post-commit.ok`를 지우거나 `post-commit`을 삭제하면 다음 편집 때 다시 맞춘다.
- 훅은 fail-open이며, 실패 원인은 `.cursor/state/obsidian-hook-warnings.log`에 경량 로그로 남는다.

## Backlink Tips
- 문서 끝에 `Related Project`, `Related Journals` 섹션을 두고 위키링크를 넣는다.
- 프로젝트 허브는 `[[<project>/docs/<stem>]]` 형태로 연결한다(`<stem>`은 위 `hubFileStem` / `displayName` / `<slug>-docs-hub` 규칙).
