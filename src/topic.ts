import fs from 'node:fs';
import path from 'node:path';
import type { BuiltTopic, ConcreteHost, Host, TopicManifest, TopicSection, TopicSource } from './types';
import {
  DEFAULT_TTL_DAYS,
  installedSkillPath,
  repoRoot,
  resolveHosts,
  topicManifestPath,
  topicPackDir,
  topicReferencesDir,
  topicRoot,
} from './paths';

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeText(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, JSON.stringify(value, null, 2) + '\n');
}

function symlinkForce(target: string, destination: string): void {
  ensureDir(path.dirname(destination));
  try {
    fs.rmSync(destination, { recursive: true, force: true });
  } catch {
    // noop
  }
  fs.symlinkSync(target, destination);
}

function installWorkspaceCodexSkill(skillName: string, packDir: string): string | undefined {
  const workspaceSkillsDir = path.join(repoRoot(), '.agents', 'skills');
  if (!fs.existsSync(workspaceSkillsDir)) {
    return undefined;
  }

  const destination = path.join(workspaceSkillsDir, skillName);
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(packDir, destination, { recursive: true });
  return destination;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeInstructionList(manifest: TopicManifest): string[] {
  return (manifest.instructions || []).map(item => item.trim()).filter(Boolean);
}

async function extractSourceText(source: TopicSource, baseDir: string): Promise<string> {
  if (source.kind === 'inline') {
    return source.value.trim();
  }

  if (source.kind === 'file') {
    const sourcePath = path.isAbsolute(source.value) ? source.value : path.resolve(baseDir, source.value);
    return fs.readFileSync(sourcePath, 'utf8').trim();
  }

  const response = await fetch(source.value);
  const html = await response.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

async function synthesizeSections(manifest: TopicManifest, baseDir: string): Promise<TopicSection[]> {
  const learned = manifest.learnedSources && manifest.learnedSources.length > 0
    ? manifest.learnedSources
    : manifest.seedSources || [];

  const chunks: string[] = [];
  for (const source of learned.slice(0, 6)) {
    const text = await extractSourceText(source, baseDir);
    if (text) {
      chunks.push(`### ${source.title}\n\n${truncate(text, 1500)}`);
    }
  }

  const instructions = normalizeInstructionList(manifest);
  const sections: TopicSection[] = [];

  if (chunks.length > 0) {
    sections.push({
      title: 'Seeded Domain Notes',
      body: chunks.join('\n\n'),
    });
  }

  if (instructions.length > 0) {
    sections.push({
      title: 'Operating Instructions',
      body: instructions.map(item => `- ${item}`).join('\n'),
    });
  }

  sections.push({
    title: 'Refresh Rules',
    body: [
      '- Preserve the command name and topic slug across refreshes.',
      '- Prefer source-backed updates over unsupported expansion.',
      '- Mark inference clearly when the saved sources do not fully support a claim.',
    ].join('\n'),
  });

  return sections;
}

function sourceInventoryMarkdown(manifest: TopicManifest): string {
  const lines: string[] = [
    '# Source Inventory',
    '',
    `- Topic: ${manifest.displayName || manifest.topic}`,
    `- Generated skill: ${manifest.generatedSkillName}`,
    `- Refresh TTL (days): ${manifest.refresh?.ttlDays ?? DEFAULT_TTL_DAYS}`,
    '',
  ];

  const groups: Array<[string, TopicSource[]]> = [
    ['Seed Sources', manifest.seedSources || []],
    ['Learned Sources', manifest.learnedSources || []],
  ];

  for (const [title, sources] of groups) {
    lines.push(`## ${title}`);
    lines.push('');

    if (sources.length === 0) {
      lines.push('- None');
      lines.push('');
      continue;
    }

    for (const source of sources) {
      lines.push(`- ${source.title} [${source.kind}]`);
      lines.push(`  - Value: ${source.value}`);
      if (source.notes) {
        lines.push(`  - Notes: ${source.notes}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function domainGuideMarkdown(manifest: TopicManifest): string {
  const lines: string[] = [
    `# ${manifest.displayName || manifest.topic} Domain Guide`,
    '',
    manifest.description,
    '',
  ];

  const instructions = normalizeInstructionList(manifest);
  if (instructions.length > 0) {
    lines.push('## Operating Instructions');
    lines.push('');
    for (const item of instructions) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  for (const section of manifest.sections || []) {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(section.body.replace(/\\n/g, '\n').trim());
    lines.push('');
  }

  if (manifest.prompts?.starter && manifest.prompts.starter.length > 0) {
    lines.push('## Starter Prompts');
    lines.push('');
    for (const prompt of manifest.prompts.starter) {
      lines.push(`- ${prompt}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function renderTopicSkill(host: ConcreteHost, manifest: TopicManifest): string {
  const skillName = manifest.generatedSkillName || `lazylearn-${manifest.slug}`;
  const displayName = manifest.displayName || manifest.topic;
  const instructions = normalizeInstructionList(manifest);
  const starterPrompts = manifest.prompts?.starter || [];

  return `---
name: ${skillName}
description: |
  ${manifest.description}
  Use when the user needs help in the ${displayName} domain and wants the saved
  ${displayName} playbook, reference notes, and source inventory applied.
---

# ${skillName}

## Auto-refresh

Before doing topic work, run:

\`\`\`bash
~/.lazylearn/runtime/bin/lazylearn-topic-refresh ${manifest.slug} --if-stale --host ${host}
\`\`\`

Then read:

- [references/domain-guide.md](references/domain-guide.md)
- [references/source-inventory.md](references/source-inventory.md)

## Working Rules

- Prefer the saved domain guide over inventing new policy.
- If the source inventory is incomplete for the user's request, say so and gather more information.
- When using inference instead of an explicit source-backed rule, label it clearly.

## Domain Instructions

${instructions.length > 0 ? instructions.map(item => `- ${item}`).join('\n') : '- Use the saved domain guide and source inventory.'}

## Starter Prompts

${starterPrompts.length > 0 ? starterPrompts.map(item => `- ${item}`).join('\n') : '- Ask a domain-specific question and use this saved playbook to answer it.'}
`;
}

function renderOpenAiYaml(skillName: string, displayName: string, description: string): string {
  return `interface:
  display_name: "${skillName}"
  short_description: "${truncate(description, 64)}"
  default_prompt: "Use $${skillName} to answer a ${displayName} question with the saved domain playbook."

policy:
  allow_implicit_invocation: true
`;
}

function normalizeManifest(manifest: TopicManifest): TopicManifest {
  const topic = manifest.topic?.trim();
  if (!topic) {
    throw new Error('Topic manifest is missing "topic".');
  }

  const slug = manifest.slug?.trim() || slugify(topic);
  if (!slug) {
    throw new Error('Could not derive a topic slug.');
  }

  return {
    ...manifest,
    schemaVersion: manifest.schemaVersion || 1,
    topic,
    slug,
    displayName: manifest.displayName?.trim() || topic,
    description: manifest.description?.trim() || `${topic} domain playbook.`,
    instructions: normalizeInstructionList(manifest),
    seedSources: manifest.seedSources || [],
    learnedSources: manifest.learnedSources || [],
    sections: manifest.sections || [],
    prompts: manifest.prompts || {},
    refresh: {
      ttlDays: manifest.refresh?.ttlDays ?? DEFAULT_TTL_DAYS,
      lastGeneratedAt: manifest.refresh?.lastGeneratedAt,
      lastRefreshedAt: manifest.refresh?.lastRefreshedAt,
    },
    generatedSkillName: manifest.generatedSkillName || `lazylearn-${slug}`,
    installedHostPaths: manifest.installedHostPaths || {},
  };
}

export function isTopicStale(manifest: TopicManifest, now = Date.now()): boolean {
  const ttlDays = manifest.refresh?.ttlDays ?? DEFAULT_TTL_DAYS;
  const lastRefreshedAt = manifest.refresh?.lastRefreshedAt || manifest.refresh?.lastGeneratedAt;

  if (!lastRefreshedAt) {
    return true;
  }

  const ageMs = now - new Date(lastRefreshedAt).getTime();
  return ageMs >= ttlDays * 24 * 60 * 60 * 1000;
}

export async function buildTopicPackFromManifestFile(
  manifestFile: string,
  options: { host?: Host; install?: boolean } = {},
): Promise<BuiltTopic> {
  const raw = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as TopicManifest;
  const normalized = normalizeManifest(raw);
  const manifestDir = path.dirname(path.resolve(manifestFile));
  const generatedAt = new Date().toISOString();

  if (!normalized.sections || normalized.sections.length === 0) {
    normalized.sections = await synthesizeSections(normalized, manifestDir);
  }

  normalized.generatedSkillName = `lazylearn-${normalized.slug}`;
  normalized.refresh = {
    ttlDays: normalized.refresh?.ttlDays ?? DEFAULT_TTL_DAYS,
    lastGeneratedAt: generatedAt,
    lastRefreshedAt: generatedAt,
  };

  const canonicalTopicRoot = topicRoot(normalized.slug);
  const canonicalManifestPath = topicManifestPath(normalized.slug);
  const canonicalReferencesDir = topicReferencesDir(normalized.slug);
  const installedHosts: Partial<Record<ConcreteHost, string>> = {};

  ensureDir(canonicalTopicRoot);
  ensureDir(canonicalReferencesDir);

  const domainGuide = domainGuideMarkdown(normalized);
  const sourceInventory = sourceInventoryMarkdown(normalized);

  writeText(path.join(canonicalReferencesDir, 'domain-guide.md'), domainGuide);
  writeText(path.join(canonicalReferencesDir, 'source-inventory.md'), sourceInventory);

  for (const host of resolveHosts(options.host || 'auto')) {
    const packDir = topicPackDir(normalized.slug, host);
    const referencesDir = path.join(packDir, 'references');
    ensureDir(referencesDir);

    writeText(path.join(packDir, 'SKILL.md'), renderTopicSkill(host, normalized));
    writeText(path.join(referencesDir, 'domain-guide.md'), domainGuide);
    writeText(path.join(referencesDir, 'source-inventory.md'), sourceInventory);
    writeJson(path.join(packDir, 'topic.json'), normalized);

    if (host === 'codex') {
      writeText(
        path.join(packDir, 'agents', 'openai.yaml'),
        renderOpenAiYaml(normalized.generatedSkillName, normalized.displayName || normalized.topic, normalized.description),
      );
    }

    if (options.install !== false) {
      const installPath = installedSkillPath(host, normalized.generatedSkillName);
      symlinkForce(packDir, installPath);
      installedHosts[host] = installPath;

      if (host === 'codex') {
        installWorkspaceCodexSkill(normalized.generatedSkillName, packDir);
      }
    }
  }

  normalized.installedHostPaths = {
    ...normalized.installedHostPaths,
    ...installedHosts,
  };

  writeJson(canonicalManifestPath, normalized);

  return {
    manifest: normalized,
    topicRoot: canonicalTopicRoot,
    skillName: normalized.generatedSkillName,
    installedHosts,
  };
}

export async function refreshTopicPack(
  topic: string,
  options: { host?: Host; ifStale?: boolean; install?: boolean } = {},
): Promise<BuiltTopic> {
  const slug = slugify(topic);
  const manifestPath = topicManifestPath(slug);

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Topic "${slug}" does not exist at ${manifestPath}.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as TopicManifest;
  if (options.ifStale && !isTopicStale(manifest)) {
    return {
      manifest,
      topicRoot: topicRoot(slug),
      skillName: manifest.generatedSkillName || `lazylearn-${slug}`,
      installedHosts: manifest.installedHostPaths || {},
      skippedRefresh: true,
    };
  }

  return buildTopicPackFromManifestFile(manifestPath, {
    host: options.host || 'auto',
    install: options.install,
  });
}
