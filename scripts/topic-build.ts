#!/usr/bin/env bun
import path from 'node:path';
import { buildTopicPackFromManifestFile } from '../src/topic';
import type { Host } from '../src/types';

function readFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const manifest = readFlag('--manifest');
if (!manifest) {
  throw new Error('Missing required --manifest <path>.');
}

const host = (readFlag('--host') || 'auto') as Host;
const install = process.argv.includes('--install');

const result = await buildTopicPackFromManifestFile(path.resolve(manifest), { host, install });
console.log(JSON.stringify({
  skillName: result.skillName,
  topicRoot: result.topicRoot,
  installedHosts: result.installedHosts,
}, null, 2));
