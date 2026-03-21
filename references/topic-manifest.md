# Topic Manifest Schema

`lazylearn` builds topic skills from a JSON manifest.

## Required fields

```json
{
  "schemaVersion": 1,
  "topic": "SEO",
  "slug": "seo",
  "description": "Search engine optimization operating playbook.",
  "instructions": [
    "Prefer actionable audits over theory-only responses."
  ],
  "seedSources": [
    {
      "title": "Internal note",
      "kind": "inline",
      "value": "..."
    }
  ]
}
```

## Optional fields

- `displayName`: human-facing topic title
- `learnedSources`: additional sources discovered during research
- `sections`: reusable domain reference sections
- `prompts.starter`: starter prompts to embed into the generated skill
- `refresh.ttlDays`: staleness window; defaults to `7`

## Source kinds

- `inline`: direct text in `value`
- `file`: path in `value`; relative paths are resolved from the manifest file directory
- `url`: web URL in `value`; lazylearn will fetch a readable excerpt when building references

## Output behavior

The builder enriches the manifest with:

- `generatedSkillName`
- `installedHostPaths`
- `refresh.lastGeneratedAt`
- `refresh.lastRefreshedAt`
