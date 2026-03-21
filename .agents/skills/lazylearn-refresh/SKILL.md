---
name: lazylearn-refresh
description: |
  Rebuild an existing lazylearn topic skill from its saved manifest. Use when a
  topic already exists under ~/.lazylearn/topics/<slug>/ and the user wants the
  skill refreshed, expanded, or repaired.
---

# LazyLearn Refresh

## Goal

Refresh an existing topic skill in place from its canonical manifest at
`~/.lazylearn/topics/<topic-slug>/topic.json`.

## Workflow

1. Identify the topic slug.
2. Confirm the canonical topic exists at `~/.lazylearn/topics/<topic-slug>/topic.json`.
3. Inspect its source inventory and refresh metadata.
4. If the user supplied new sources or constraints, merge them into the canonical manifest first.
5. Run:

```bash
~/.lazylearn/runtime/bin/lazylearn-topic-refresh <topic-slug> --host auto
```

6. Report what changed and where the regenerated host packs were installed.

## Rules

- Update in place. Do not create duplicate topic slugs for the same domain.
- Keep the generated command name stable: `lazylearn-<topic-slug>`.
- Preserve existing installed host paths unless the user explicitly changes the install target.
- If the topic is already fresh and the user only wants a freshness check, use `--if-stale`.
