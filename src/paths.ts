import os from 'node:os';
import path from 'node:path';
import type { ConcreteHost, Host } from './types';

export const DEFAULT_TTL_DAYS = 7;

export function repoRoot(): string {
  return process.env.LAZYLEARN_REPO_ROOT || path.resolve(import.meta.dir, '..');
}

export function lazylearnHome(): string {
  return process.env.LAZYLEARN_HOME || path.join(os.homedir(), '.lazylearn');
}

export function claudeSkillsDir(): string {
  return process.env.LAZYLEARN_CLAUDE_SKILLS_DIR || path.join(os.homedir(), '.claude', 'skills');
}

export function codexSkillsDir(): string {
  return process.env.LAZYLEARN_CODEX_SKILLS_DIR || path.join(os.homedir(), '.codex', 'skills');
}

export function runtimeBinDir(): string {
  return path.join(lazylearnHome(), 'runtime', 'bin');
}

export function topicRoot(slug: string): string {
  return path.join(lazylearnHome(), 'topics', slug);
}

export function topicReferencesDir(slug: string): string {
  return path.join(topicRoot(slug), 'references');
}

export function topicPackDir(slug: string, host: ConcreteHost): string {
  return path.join(topicRoot(slug), 'hosts', host, `lazylearn-${slug}`);
}

export function topicManifestPath(slug: string): string {
  return path.join(topicRoot(slug), 'topic.json');
}

export function workDir(): string {
  return path.join(lazylearnHome(), 'work');
}

export function hostSkillsDir(host: ConcreteHost): string {
  return host === 'claude' ? claudeSkillsDir() : codexSkillsDir();
}

export function installedSkillPath(host: ConcreteHost, skillName: string): string {
  return path.join(hostSkillsDir(host), skillName);
}

export function resolveHosts(host: Host): ConcreteHost[] {
  return host === 'auto' ? ['claude', 'codex'] : [host];
}
