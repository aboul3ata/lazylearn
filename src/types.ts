export type Host = 'claude' | 'codex' | 'auto';
export type ConcreteHost = 'claude' | 'codex';
export type SourceKind = 'inline' | 'file' | 'url';

export interface TopicSource {
  title: string;
  kind: SourceKind;
  value: string;
  notes?: string;
}

export interface TopicSection {
  title: string;
  body: string;
}

export interface TopicRefreshConfig {
  ttlDays?: number;
  lastGeneratedAt?: string;
  lastRefreshedAt?: string;
}

export interface TopicPrompts {
  starter?: string[];
}

export interface TopicManifest {
  schemaVersion: number;
  topic: string;
  slug?: string;
  displayName?: string;
  description: string;
  instructions?: string[];
  seedSources?: TopicSource[];
  learnedSources?: TopicSource[];
  sections?: TopicSection[];
  prompts?: TopicPrompts;
  refresh?: TopicRefreshConfig;
  generatedSkillName?: string;
  installedHostPaths?: Partial<Record<ConcreteHost, string>>;
}

export interface BuiltTopic {
  manifest: TopicManifest;
  topicRoot: string;
  skillName: string;
  installedHosts: Partial<Record<ConcreteHost, string>>;
  skippedRefresh?: boolean;
}
