#!/usr/bin/env bun
import { refreshTopicPack } from '../src/topic';
import type { Host } from '../src/types';

function readFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const topic = readFlag('--topic') || process.argv[2];
if (!topic) {
  throw new Error('Missing topic slug. Use --topic <slug> or provide it as the first argument.');
}

const host = (readFlag('--host') || 'auto') as Host;
const ifStale = process.argv.includes('--if-stale');
const install = process.argv.includes('--install') || !process.argv.includes('--no-install');

const result = await refreshTopicPack(topic, { host, ifStale, install });
console.log(JSON.stringify({
  skillName: result.skillName,
  topicRoot: result.topicRoot,
  installedHosts: result.installedHosts,
  skippedRefresh: result.skippedRefresh || false,
}, null, 2));
