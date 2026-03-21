# lazylearn

`lazylearn` is a multi-skill repo that generates new per-user domain skills.

## Skills

- `/lazylearn` builds a new topic skill from seeded sources
- `/lazylearn-refresh` rebuilds an existing topic skill from `~/.lazylearn/topics/<slug>/topic.json`

## Local state

- canonical user state root: `~/.lazylearn/`
- generated topic skills are not committed to this repo

## Commands

```bash
bun run build
bun run skill:check
bun run topic:build --manifest examples/seo/topic.json --install --host auto
bun run topic:refresh --topic seo --host auto
```

## Conventions

- edit `SKILL.md.tmpl` files, then regenerate `SKILL.md` outputs
- keep the harness repo public and host-neutral
- keep generated topic skills per-user in `~/.lazylearn/`
