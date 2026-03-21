import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { buildTopicPackFromManifestFile, refreshTopicPack } from '../src/topic';

describe('topic build and refresh', () => {
  let tempRoot = '';
  let previousEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lazylearn-'));
    previousEnv = {
      LAZYLEARN_HOME: process.env.LAZYLEARN_HOME,
      LAZYLEARN_REPO_ROOT: process.env.LAZYLEARN_REPO_ROOT,
      LAZYLEARN_CLAUDE_SKILLS_DIR: process.env.LAZYLEARN_CLAUDE_SKILLS_DIR,
      LAZYLEARN_CODEX_SKILLS_DIR: process.env.LAZYLEARN_CODEX_SKILLS_DIR,
    };

    process.env.LAZYLEARN_HOME = path.join(tempRoot, '.lazylearn');
    process.env.LAZYLEARN_REPO_ROOT = tempRoot;
    process.env.LAZYLEARN_CLAUDE_SKILLS_DIR = path.join(tempRoot, '.claude', 'skills');
    process.env.LAZYLEARN_CODEX_SKILLS_DIR = path.join(tempRoot, '.codex', 'skills');
    fs.mkdirSync(path.join(tempRoot, '.agents', 'skills'), { recursive: true });
  });

  afterEach(() => {
    process.env.LAZYLEARN_HOME = previousEnv.LAZYLEARN_HOME;
    process.env.LAZYLEARN_REPO_ROOT = previousEnv.LAZYLEARN_REPO_ROOT;
    process.env.LAZYLEARN_CLAUDE_SKILLS_DIR = previousEnv.LAZYLEARN_CLAUDE_SKILLS_DIR;
    process.env.LAZYLEARN_CODEX_SKILLS_DIR = previousEnv.LAZYLEARN_CODEX_SKILLS_DIR;
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('builds and installs a topic for both hosts', async () => {
    const manifestPath = path.resolve('examples/seo/topic.json');
    const result = await buildTopicPackFromManifestFile(manifestPath, { host: 'auto', install: true });

    expect(result.skillName).toBe('lazylearn-seo');
    expect(fs.existsSync(path.join(result.topicRoot, 'topic.json'))).toBe(true);
    expect(fs.existsSync(path.join(result.topicRoot, 'references', 'domain-guide.md'))).toBe(true);
    expect(fs.lstatSync(result.installedHosts.claude!).isSymbolicLink()).toBe(true);
    expect(fs.lstatSync(result.installedHosts.codex!).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(path.join(result.topicRoot, 'hosts', 'codex', 'lazylearn-seo', 'agents', 'openai.yaml'))).toBe(true);
    expect(fs.lstatSync(path.join(tempRoot, '.agents', 'skills', 'lazylearn-seo')).isDirectory()).toBe(true);
  });

  test('skips stale refresh when topic is still fresh', async () => {
    const manifestPath = path.resolve('examples/seo/topic.json');
    await buildTopicPackFromManifestFile(manifestPath, { host: 'auto', install: true });

    const refreshed = await refreshTopicPack('seo', { host: 'auto', ifStale: true, install: true });
    expect(refreshed.skippedRefresh).toBe(true);
  });

  test('refreshes when topic is stale', async () => {
    const manifestPath = path.resolve('examples/seo/topic.json');
    const built = await buildTopicPackFromManifestFile(manifestPath, { host: 'auto', install: true });
    const canonicalManifestPath = path.join(built.topicRoot, 'topic.json');
    const manifest = JSON.parse(fs.readFileSync(canonicalManifestPath, 'utf8'));
    manifest.refresh.lastRefreshedAt = '2000-01-01T00:00:00.000Z';
    fs.writeFileSync(canonicalManifestPath, JSON.stringify(manifest, null, 2) + '\n');

    const refreshed = await refreshTopicPack('seo', { host: 'auto', ifStale: true, install: true });
    expect(refreshed.skippedRefresh).toBeFalsy();
    expect(refreshed.manifest.refresh?.lastRefreshedAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  test('renders escaped newlines in section bodies as real newlines in the domain guide', async () => {
    const manifestPath = path.join(tempRoot, 'topic.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
      schemaVersion: 1,
      topic: 'SEO',
      description: 'Test topic.',
      sections: [
        {
          title: 'Checklist',
          body: '1. First\\n2. Second',
        },
      ],
    }, null, 2));

    const built = await buildTopicPackFromManifestFile(manifestPath, { host: 'auto', install: true });
    const guide = fs.readFileSync(path.join(built.topicRoot, 'references', 'domain-guide.md'), 'utf8');
    expect(guide.includes('1. First\n2. Second')).toBe(true);
    expect(guide.includes('1. First\\n2. Second')).toBe(false);
  });
});
