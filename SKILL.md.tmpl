---
name: lazylearn
description: |
  Create a new reusable domain skill from seeded sources. Use when the user wants
  the agent to learn a topic, distill that topic into a durable playbook, and
  install a generated command such as /lazylearn-seo for future reuse.
---

# LazyLearn

## Goal

Create a per-user topic skill under `~/.lazylearn/topics/<topic-slug>/` and install
`/lazylearn-<topic-slug>` without modifying this public harness repo.

## Workflow

1. Confirm the topic, intended audience, and what "good" looks like for the new domain skill.
2. Collect seed material from the user: links, files, examples, notes, checklists, or SOPs.
3. Expand from those seeds with research when it is useful, preferring primary sources.
4. Distill the topic into:
   - a concise description
   - domain instructions the generated skill should always follow
   - a source inventory
   - 2-6 reference sections that future runs can reuse
5. Save a JSON manifest at `~/.lazylearn/work/<topic-slug>.json` using the schema in [references/topic-manifest.md](references/topic-manifest.md).
6. Run:

```bash
~/.lazylearn/runtime/bin/lazylearn-topic-build --manifest ~/.lazylearn/work/<topic-slug>.json --install --host auto
```

7. Report:
   - generated skill name
   - topic directory
   - installed Claude path if present
   - installed Codex path if present

## Rules

- Keep generated topic skills per-user in `~/.lazylearn/`. Do not add them to this repo by default.
- Preserve the original seed sources in the source inventory. Do not silently drop sources.
- Prefer concrete operating guidance over generic summaries.
- If the user already has a topic with the same slug, update it in place instead of creating a duplicate.
- If you need a refresh only, use `/lazylearn-refresh`.

## Distillation Checklist

- Read [references/research-playbook.md](references/research-playbook.md) before building the manifest.
- Make the generated skill narrow enough to be reliable and broad enough to be reusable.
- Include the source inventory in the manifest even when the user only gave inline notes.
- Write instructions that future runs can execute without re-asking the same setup questions.
