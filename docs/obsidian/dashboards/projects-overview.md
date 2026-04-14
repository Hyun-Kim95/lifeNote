# Projects Overview

```dataview
TABLE project, source_repo, updated_at, file.link AS entry
FROM ""
WHERE type = "project-doc"
AND file.name = "_project-doc-index"
SORT updated_at DESC
```

## Recent Docs

```dataview
TABLE project, updated_at, file.link AS note
FROM ""
WHERE contains(file.path, "/docs/")
AND !contains(file.path, "/templates/")
AND !contains(file.path, "/dashboards/")
AND !contains(file.name, "-template")
AND file.name != "_project-doc-index"
SORT file.mtime DESC
LIMIT 30
```
