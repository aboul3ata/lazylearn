import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'bun:test';
import { generateSkillDocs } from '../src/skill-docs';
import { repoRoot } from '../src/paths';

describe('skill docs', () => {
  test('renders claude and codex outputs', () => {
    const generated = generateSkillDocs(false);
    const byPath = new Map(generated.map(file => [path.relative(repoRoot(), file.path), file.content]));

    expect(byPath.has('SKILL.md')).toBe(true);
    expect(byPath.has('lazylearn-refresh/SKILL.md')).toBe(true);
    expect(byPath.has('.agents/skills/lazylearn/SKILL.md')).toBe(true);
    expect(byPath.has('.agents/skills/lazylearn-refresh/SKILL.md')).toBe(true);

    const codexSkill = byPath.get('.agents/skills/lazylearn/SKILL.md') || '';
    expect(codexSkill.includes('.claude/skills')).toBe(false);
  });

  test('generated files on disk stay fresh after build', () => {
    const generated = generateSkillDocs(false);
    for (const file of generated) {
      if (!fs.existsSync(file.path)) {
        continue;
      }
      expect(fs.readFileSync(file.path, 'utf8')).toBe(file.content);
    }
  });
});
