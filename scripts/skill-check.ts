#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { generateSkillDocs } from '../src/skill-docs';
import { repoRoot } from '../src/paths';

const generated = generateSkillDocs(false);
let hasErrors = false;

for (const file of generated) {
  if (!fs.existsSync(file.path)) {
    console.log(`missing: ${path.relative(repoRoot(), file.path)}`);
    hasErrors = true;
    continue;
  }

  const current = fs.readFileSync(file.path, 'utf8');
  if (current !== file.content) {
    console.log(`stale: ${path.relative(repoRoot(), file.path)}`);
    hasErrors = true;
  }

  if (file.path.includes(`${path.sep}.agents${path.sep}`) && current.includes('.claude/skills')) {
    console.log(`invalid codex output: ${path.relative(repoRoot(), file.path)} contains .claude/skills`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log('Skill outputs are fresh.');
