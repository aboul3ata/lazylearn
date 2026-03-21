import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './paths';
import type { ConcreteHost } from './types';

interface SkillDefinition {
  skillName: string;
  displayName: string;
  shortDescription: string;
  defaultPrompt: string;
  sourceTemplate: string;
  claudeOutput: string;
  codexOutput: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

const SKILLS: SkillDefinition[] = [
  {
    skillName: 'lazylearn',
    displayName: 'LazyLearn',
    shortDescription: 'Create a reusable domain skill pack.',
    defaultPrompt: 'Use $lazylearn to build a new domain skill from seeded sources.',
    sourceTemplate: 'SKILL.md.tmpl',
    claudeOutput: 'SKILL.md',
    codexOutput: '.agents/skills/lazylearn/SKILL.md',
  },
  {
    skillName: 'lazylearn-refresh',
    displayName: 'LazyLearn Refresh',
    shortDescription: 'Refresh an existing learned topic skill.',
    defaultPrompt: 'Use $lazylearn-refresh to rebuild a previously learned topic skill.',
    sourceTemplate: 'lazylearn-refresh/SKILL.md.tmpl',
    claudeOutput: 'lazylearn-refresh/SKILL.md',
    codexOutput: '.agents/skills/lazylearn-refresh/SKILL.md',
  },
];

function renderTemplate(raw: string, _host: ConcreteHost): string {
  return raw.trimEnd() + '\n';
}

function renderOpenAiYaml(skill: SkillDefinition): string {
  return `interface:
  display_name: "${skill.displayName}"
  short_description: "${skill.shortDescription}"
  default_prompt: "${skill.defaultPrompt}"

policy:
  allow_implicit_invocation: true
`;
}

export function generateSkillDocs(write = true): GeneratedFile[] {
  const root = repoRoot();
  const generated: GeneratedFile[] = [];

  for (const skill of SKILLS) {
    const sourcePath = path.join(root, skill.sourceTemplate);
    const template = fs.readFileSync(sourcePath, 'utf8');

    const claudePath = path.join(root, skill.claudeOutput);
    const codexPath = path.join(root, skill.codexOutput);
    const codexYamlPath = path.join(path.dirname(codexPath), 'agents', 'openai.yaml');

    const claudeContent = renderTemplate(template, 'claude');
    const codexContent = renderTemplate(template, 'codex');

    generated.push({ path: claudePath, content: claudeContent });
    generated.push({ path: codexPath, content: codexContent });
    generated.push({ path: codexYamlPath, content: renderOpenAiYaml(skill) });
  }

  if (write) {
    for (const file of generated) {
      fs.mkdirSync(path.dirname(file.path), { recursive: true });
      fs.writeFileSync(file.path, file.content);
    }
  }

  return generated;
}
