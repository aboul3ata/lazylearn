# lazylearn

`lazylearn` is a public skill factory. The repo is the harness; the learned skills are per-user artifacts stored in `~/.lazylearn/`.

## What it does

- exposes a root `/lazylearn` workflow skill
- exposes `/lazylearn-refresh` to rebuild existing topics
- generates installable topic skills such as `/lazylearn-seo`
- supports both Claude and Codex from the same source repo

## Install

```bash
git clone https://github.com/aboul3ata/lazylearn.git
cd lazylearn
./setup --host auto
```

This will:

- generate committed skill docs plus Codex-facing `.agents/skills/` output
- install runtime wrappers in `~/.lazylearn/runtime/bin/`
- symlink the harness skills into `~/.claude/skills/` and/or `~/.codex/skills/`

## Local state

All generated topic skills live outside the repo:

```text
~/.lazylearn/
  runtime/bin/
  topics/<topic-slug>/
    topic.json
    references/
    hosts/
      claude/lazylearn-<topic>/
      codex/lazylearn-<topic>/
```

## Build a topic skill

The root skill is designed for an agent workflow, but the harness can also build from a manifest directly:

```bash
bun run topic:build --manifest examples/seo/topic.json --install --host auto
```

That creates and installs `lazylearn-seo` under your user-local skill directories.

## Refresh a topic skill

```bash
bun run topic:refresh --topic seo --host auto
```

Or let the generated topic skill self-refresh when it becomes stale.

## Developer commands

```bash
bun run build
bun run skill:check
bun test
```
