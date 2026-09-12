# Maintaining the website documentation

The website keeps authored pages in this directory. Builds do not read the SDK checkout or depend on its location.

## Source map

| SDK source | Website coverage |
| --- | --- |
| `USER_GUIDE.md` | Setup, workflows, examples, quality migration, topic domains |
| `API_REFERENCE.md` | Public method behavior, receipts, pins, domains, errors |
| `ARCHITECTURE.md` | Runtime boundaries, durable preparation/commit, quality, cluster isolation |
| `internals.md` | Pipeline, store, adapter, fleet and maintenance explanations |
| `knowledge/CORE_API_AND_AGENT.md` | Existing chatbot integration, core versus agent responsibilities |
| `knowledge/INGESTION_AND_MEMORY_CONSTRUCTION.md` | Durable runs, canonical evidence, episodes, stable topic assignment |
| `knowledge/RETRIEVAL_RECALL_AND_GRAFTING.md` | Candidate sources, adaptive selection, pins, cache boundaries |
| `knowledge/STORAGE_SCHEMA_AND_MIGRATIONS.md` | Migrations 007–011, optional store capabilities, evidence and domains |
| `knowledge/MAINTENANCE_LIFECYCLE_AND_MEMORY_QUALITY.md` | Lifecycle, conflict/history, maintenance boundaries |
| `knowledge/FLEET_CLI_STUDIO_AND_DEVEX.md` | Fleet copies, Doctor, Studio, consumer versus contributor setup |
| `knowledge/SYSTEM_OVERVIEW.md` | End-to-end flow and layer responsibilities |
| `knowledge/SHARED_CONTRACTS_AND_INTEGRATION_POINTS.md` | Contributor review and cross-module invariants |
| `knowledge/TESTS.md` | Unit, integration, manual and provider evaluation guidance |

The September 2026 source review found older prose alongside newer sections. Where they conflict, verify `src/index.ts`, actual source declarations, implementation, CLI commands, and migrations. In particular:

- Retrieval no longer uses confidence weighting or a `minSimilarity` candidate cutoff. Semantic graft selection has a separate similarity option.
- Quality admission and decay default to observation. Decay does not overwrite quality.
- Stable topics aggregate episodes; episode history preserves bounded summaries.
- Durable run jobs coexist with compatibility queue paths. Do not claim all ingestion methods have the same durability contract.
- The generated schema filename is `mg-schema.ts`.
- Optional cache failures and required queue failures have different operational behavior.

## Refreshing public contracts

```sh
npm run docs:sync-contracts -- /path/to/project-memografter
npm run docs:check
npm run lint
npm run build
```

`contracts.json` contains reviewed snapshots of public type declarations and annotated method signatures. `sync-doc-contracts.mjs` reads SDK TypeScript without executing it. Some forwarding methods infer their result type; their explicit documented signatures live in `current-api.ts` and must be reviewed against the source. Refreshing contracts does not automatically refresh authored examples or behavior descriptions.

`memory-pages.ts` contains the new concepts and workflows. Existing topics stay in their original page modules. API content is assembled by `api-reference.ts` and `current-api.ts`. The old confidence-update URL is retained as migration guidance.

`docs:check` validates duplicate routes and anchors, local links, navigation, search targets, table shapes, missing signatures, and obsolete confidence examples. After changing layout, review desktop and narrow-screen rendering, tables, code blocks, and search. Do not run live SDK provider or database suites for a website-only edit.
